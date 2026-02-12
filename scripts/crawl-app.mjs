#!/usr/bin/env node

/**
 * OpenClaw Crawler — AI-powered screenshot agent for crypto apps
 *
 * Uses Claude Sonnet + Playwright ARIA snapshots to explore crypto products
 * like a human UX researcher, capturing every screen, modal, and state.
 *
 * Usage:
 *   node scripts/crawl-app.mjs --slug lido --url https://stake.lido.fi
 *   node scripts/crawl-app.mjs --slug binance --max-turns 30 --headed
 *   node scripts/crawl-app.mjs --all
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { createHash } from "crypto";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const SESSIONS_DIR = resolve(__dirname, "sessions");

// ─── CLI ────────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    url: { type: "string" },
    all: { type: "boolean", default: false },
    "max-turns": { type: "string", default: "50" },
    headed: { type: "boolean", default: false },
    model: { type: "string", default: "claude-sonnet-4-5-20250929" },
    login: { type: "boolean", default: false },
    "auth-email": { type: "string" },
    "auth-password": { type: "string" },
  },
  strict: false,
});

const MAX_TURNS = parseInt(args["max-turns"], 10);
const HEADED = args.headed;
const MODEL = args.model;
const SLIDING_WINDOW = 40; // max messages kept in context
const AUTH_EMAIL = args["auth-email"] || process.env.CRAWL_AUTH_EMAIL;
const AUTH_PASSWORD = args["auth-password"] || process.env.CRAWL_AUTH_PASSWORD;
const HAS_CREDENTIALS = !!(AUTH_EMAIL && AUTH_PASSWORD);

// ─── Apps from data file (for --all mode) ──────────────────────────────────

function loadApps() {
  try {
    const raw = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
    const entries = [];
    const re = /slug:\s*"([^"]+)"[\s\S]*?website:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      entries.push({ slug: m[1], url: m[2] });
    }
    return entries;
  } catch {
    return [];
  }
}

// ─── Session management (auth) ─────────────────────────────────────────────

function sessionPath(slug) {
  return resolve(SESSIONS_DIR, `${slug}.json`);
}

function hasSession(slug) {
  return existsSync(sessionPath(slug));
}

async function saveSession(context, page, slug) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const cookies = await context.cookies();
  const localStorage = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      data[key] = window.localStorage.getItem(key);
    }
    return data;
  });
  const sessionStorage = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      data[key] = window.sessionStorage.getItem(key);
    }
    return data;
  });
  const session = {
    slug,
    savedAt: new Date().toISOString(),
    url: page.url(),
    cookies,
    localStorage,
    sessionStorage,
  };
  writeFileSync(sessionPath(slug), JSON.stringify(session, null, 2));
  console.log(`Session saved: ${sessionPath(slug)} (${cookies.length} cookies)`);
  return session;
}

async function loadSession(context, page, slug) {
  const filepath = sessionPath(slug);
  if (!existsSync(filepath)) return false;
  const session = JSON.parse(readFileSync(filepath, "utf-8"));
  // Add cookies to context
  if (session.cookies && session.cookies.length > 0) {
    await context.addCookies(session.cookies);
  }
  // Inject localStorage and sessionStorage after navigating
  if (session.localStorage && Object.keys(session.localStorage).length > 0) {
    await page.evaluate((data) => {
      for (const [k, v] of Object.entries(data)) {
        window.localStorage.setItem(k, v);
      }
    }, session.localStorage);
  }
  if (session.sessionStorage && Object.keys(session.sessionStorage).length > 0) {
    await page.evaluate((data) => {
      for (const [k, v] of Object.entries(data)) {
        window.sessionStorage.setItem(k, v);
      }
    }, session.sessionStorage);
  }
  console.log(`Session loaded: ${filepath} (saved ${session.savedAt})`);
  return true;
}

function waitForEnter(prompt) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      res();
    });
  });
}

// ─── Tool definitions for Claude ───────────────────────────────────────────

const TOOLS = [
  {
    name: "screenshot",
    description:
      "Capture a screenshot of the current page state. Always provide a descriptive label and classify into a flow. Use this BEFORE dismissing banners/popups to capture them, then dismiss and screenshot again.",
    input_schema: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description: "Descriptive label for this screen, e.g. 'Cookie consent banner' or 'Swap token selector modal'",
        },
        flow: {
          type: "string",
          enum: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
          description: "Which product flow this screen belongs to",
        },
      },
      required: ["label", "flow"],
    },
  },
  {
    name: "click",
    description:
      "Click an element on the page. Use ARIA roles, text content, or CSS selectors. Prefer text-based selectors for reliability. Examples: 'text=Swap', 'button:has-text(\"Connect Wallet\")', '[aria-label=\"Settings\"]'",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Playwright selector for the element to click",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "navigate",
    description:
      "Navigate to a URL. Must be same-domain as the starting URL. Use this to visit specific pages like /settings, /404, etc.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL to navigate to (must be same domain)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "type",
    description:
      "Type text into an input field. Use only test/dummy data, never real credentials.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Playwright selector for the input field",
        },
        text: {
          type: "string",
          description: "Text to type into the field",
        },
      },
      required: ["selector", "text"],
    },
  },
  {
    name: "scroll",
    description: "Scroll the page to reveal more content.",
    input_schema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["down", "up"],
          description: "Scroll direction",
        },
        amount: {
          type: "number",
          description: "Pixels to scroll (default 500)",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "dismiss",
    description:
      "Dismiss a banner, modal, popup, or overlay. Provide a specific selector if possible, otherwise common dismiss selectors will be tried.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Optional specific selector for the dismiss button. Leave empty to try common selectors.",
        },
      },
      required: [],
    },
  },
  {
    name: "wait",
    description: "Wait for a specified duration (for loading, animations, etc.).",
    input_schema: {
      type: "object",
      properties: {
        ms: {
          type: "number",
          description: "Milliseconds to wait (max 10000)",
        },
      },
      required: ["ms"],
    },
  },
  {
    name: "go_back",
    description: "Navigate back to the previous page in browser history.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "request_visual",
    description:
      "Request an actual screenshot image for the next turn. Use this when the ARIA snapshot is insufficient to understand a complex visual layout (charts, images, custom canvas elements). Costs more tokens — use sparingly.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Why you need visual context",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "pause",
    description:
      "Pause and wait for the human operator to complete an action in the browser (e.g., solving a CAPTCHA, completing 2FA, email verification). The browser must be in headed mode (--headed). Use this when you encounter a challenge you cannot solve programmatically.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "What the human needs to do, e.g. 'Complete CAPTCHA puzzle' or 'Enter 2FA code from authenticator app'",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "done",
    description: "Signal that exploration is complete. Provide a summary of what was covered.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Summary of exploration: pages visited, flows covered, notable findings",
        },
      },
      required: ["summary"],
    },
  },
];

// ─── System prompt ─────────────────────────────────────────────────────────

function buildSystemPrompt(slug, startUrl, { isAuthenticated = false, credentials = null } = {}) {
  let authContext;

  if (credentials) {
    authContext = `\n\n## Authentication — LOGIN REQUIRED
You have been given credentials to log into this app. Your FIRST priority is to log in:
1. Find and click the "Log In" / "Sign In" button
2. Enter the email: ${credentials.email}
3. Enter the password (use the type tool with the password field selector — the password will be provided as tool input)
4. Submit the login form
5. If you encounter a CAPTCHA or 2FA prompt, screenshot it and use the "pause" tool to let the human operator complete it
6. After login succeeds, screenshot the authenticated dashboard

Once logged in, PRIORITIZE capturing authenticated screens:
- Dashboard / portfolio / home (logged-in view)
- Account settings and preferences
- Security settings (2FA, password, sessions)
- Deposit and withdrawal flows (screenshot but don't submit transactions)
- Transaction/trade history
- Notification settings
- Profile/identity pages
- Any premium/pro features
- API management pages
- Referral/rewards pages

You ARE allowed to submit the login form. You are NOT allowed to submit any financial transactions, change account settings, or create API keys.`;
  } else if (isAuthenticated) {
    authContext = `\n\n## Authentication — SESSION LOADED
You are logged into this app with a saved session. PRIORITIZE capturing authenticated screens:
- Dashboard / portfolio / home (logged-in view)
- Account settings and preferences
- Security settings (2FA, password, sessions)
- Deposit and withdrawal flows (screenshot but don't submit)
- Transaction/trade history
- Notification settings
- Profile/identity pages
- Any premium/pro features
- API management pages
- Referral/rewards pages`;
  } else {
    authContext = `\n\n## Authentication
You are NOT logged in. You can only capture public-facing pages. Screenshot "Connect Wallet" and login/signup modals but do not submit credentials.`;
  }

  return `You are a meticulous UX researcher systematically documenting the interface of a crypto product called "${slug}".

Your mission: explore EVERY screen, modal, dropdown, and state of this web application and capture comprehensive screenshots. You are building a visual product intelligence library.

## Rules

1. **Screenshot banners/popups FIRST** — If you see a cookie banner, consent dialog, or any overlay, screenshot it with an appropriate label, THEN dismiss it, THEN screenshot the clean page underneath.

2. **Breadth over depth** — Visit every navigation item, settings page, help section, footer link, and submenu before going deep into any single flow.

3. **Visit these areas systematically:**
   - Main navigation items (every tab/link)
   - Settings/preferences pages
   - Help/support/FAQ sections
   - Footer links (terms, privacy, about)
   - Try a nonexistent URL path to capture the 404 page
   - Any "Connect Wallet" or sign-up modals (screenshot but don't submit)
   - Token/asset selector modals
   - Dropdown menus and sidebars

4. **Flow classification** — Classify every screenshot into one of: Home, Onboarding, Swap, Send, Staking, Settings. Use your best judgment.

5. **Never:**
   - Navigate to external domains (stay on ${new URL(startUrl).hostname} and its subdomains)
   - Submit financial transactions (trades, withdrawals, deposits)
   - Change account security settings or create API keys${!credentials ? `
   - Submit real forms or create real accounts
   - Enter real credentials or wallet info
   - Click "Sign up" / "Create account" submit buttons (screenshot the form instead)` : `
   - You ARE allowed to submit the login form with the provided credentials`}

6. **Label descriptively** — Each screenshot label should describe what's shown: "Main navigation with Markets tab active", "Token swap confirmation modal", "Cookie consent banner".

7. **Be efficient** — Don't screenshot the same state twice. The state hash will tell you if you've already captured a similar view.

8. **Use request_visual sparingly** — Only when ARIA text is genuinely insufficient (complex charts, image-heavy pages).

## Current app
- Slug: ${slug}
- Start URL: ${startUrl}
- Domain restriction: ${new URL(startUrl).hostname}${authContext}`;
}

// ─── State hashing ─────────────────────────────────────────────────────────

function hashState(url, ariaSnippet) {
  const normalized = url.split("?")[0].split("#")[0];
  const snippet = (ariaSnippet || "").slice(0, 500);
  return createHash("md5").update(normalized + "|" + snippet).digest("hex").slice(0, 12);
}

// ─── Filename sanitizer ────────────────────────────────────────────────────

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// ─── ARIA snapshot helper ──────────────────────────────────────────────────

async function getAriaSnapshot(page) {
  try {
    const snapshot = await page.accessibility.snapshot();
    if (!snapshot) return "(empty page)";
    return formatAccessibilityTree(snapshot, 0, 3000);
  } catch {
    return "(accessibility snapshot unavailable)";
  }
}

function formatAccessibilityTree(node, depth = 0, maxChars = 3000) {
  if (!node) return "";
  let result = "";
  const indent = "  ".repeat(depth);
  const role = node.role || "unknown";
  const name = node.name ? ` "${node.name}"` : "";
  const value = node.value ? ` [value: ${node.value}]` : "";
  const desc = node.description ? ` (${node.description})` : "";

  if (role !== "none" && role !== "generic") {
    result += `${indent}[${role}]${name}${value}${desc}\n`;
  }

  if (node.children && result.length < maxChars) {
    for (const child of node.children) {
      if (result.length >= maxChars) {
        result += `${indent}  ... (truncated)\n`;
        break;
      }
      result += formatAccessibilityTree(child, depth + 1, maxChars - result.length);
    }
  }

  return result;
}

// ─── Domain check ──────────────────────────────────────────────────────────

function isSameDomain(urlStr, startUrl) {
  try {
    const target = new URL(urlStr);
    const start = new URL(startUrl);
    return (
      target.hostname === start.hostname ||
      target.hostname.endsWith("." + start.hostname)
    );
  } catch {
    return false;
  }
}

// ─── Common dismiss selectors ──────────────────────────────────────────────

const COMMON_DISMISS_SELECTORS = [
  'button:has-text("Accept")',
  'button:has-text("Accept All")',
  'button:has-text("Accept all")',
  'button:has-text("Got it")',
  'button:has-text("I understand")',
  'button:has-text("Agree")',
  'button:has-text("OK")',
  'button:has-text("Close")',
  'button:has-text("Dismiss")',
  'button:has-text("No thanks")',
  'button:has-text("Reject All")',
  '[aria-label="Close"]',
  '[aria-label="Dismiss"]',
  '[aria-label="close"]',
  "#onetrust-accept-btn-handler",
  ".cookie-consent-accept",
  '[data-testid="close-button"]',
  '[data-testid="dismiss"]',
];

// ─── Tool executor ─────────────────────────────────────────────────────────

async function executeTool(page, toolName, toolInput, state) {
  const { slug, startUrl, screens, flowCounters, visitedHashes, screenshotDir } = state;

  switch (toolName) {
    case "screenshot": {
      const { label, flow } = toolInput;
      const counter = flowCounters[flow] = (flowCounters[flow] || 0) + 1;
      const desc = sanitizeFilename(label);
      const filename = `${slug}-${flow.toLowerCase()}-${counter}-${desc}.png`;
      const filepath = resolve(screenshotDir, filename);

      await page.screenshot({ path: filepath, type: "png", fullPage: false });

      const screen = {
        step: counter,
        label,
        flow,
        image: `/screenshots/${filename}`,
      };
      screens.push(screen);

      const currentUrl = page.url();
      const aria = await getAriaSnapshot(page);
      const stateHash = hashState(currentUrl, aria);
      visitedHashes.add(stateHash);

      return `Screenshot saved: ${filename} (${flow} step ${counter}). State hash: ${stateHash}`;
    }

    case "click": {
      const { selector } = toolInput;
      try {
        await page.click(selector, { timeout: 5000 });
        await page.waitForTimeout(1000);
        return `Clicked: ${selector}. Page URL: ${page.url()}`;
      } catch (err) {
        return `Failed to click "${selector}": ${err.message}. Try a different selector.`;
      }
    }

    case "navigate": {
      const { url } = toolInput;
      if (!isSameDomain(url, startUrl)) {
        return `Blocked: ${url} is outside allowed domain (${new URL(startUrl).hostname}). Stay on the same domain.`;
      }
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);
        return `Navigated to: ${page.url()}`;
      } catch (err) {
        return `Navigation failed: ${err.message}`;
      }
    }

    case "type": {
      const { selector, text } = toolInput;
      try {
        await page.fill(selector, text, { timeout: 5000 });
        return `Typed "${text}" into ${selector}`;
      } catch (err) {
        return `Failed to type into "${selector}": ${err.message}`;
      }
    }

    case "scroll": {
      const { direction, amount = 500 } = toolInput;
      const delta = direction === "down" ? amount : -amount;
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(500);
      return `Scrolled ${direction} by ${Math.abs(delta)}px. Page URL: ${page.url()}`;
    }

    case "dismiss": {
      const { selector } = toolInput;
      const selectors = selector ? [selector] : COMMON_DISMISS_SELECTORS;
      let dismissed = false;

      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await el.click({ timeout: 2000 });
            dismissed = true;
            await page.waitForTimeout(500);
            break;
          }
        } catch {}
      }

      return dismissed
        ? `Dismissed overlay/banner. Page URL: ${page.url()}`
        : "No dismissable element found with the provided selectors.";
    }

    case "wait": {
      const ms = Math.min(toolInput.ms || 2000, 10000);
      await page.waitForTimeout(ms);
      return `Waited ${ms}ms. Page URL: ${page.url()}`;
    }

    case "go_back": {
      try {
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 });
        await page.waitForTimeout(1000);
        return `Navigated back. Page URL: ${page.url()}`;
      } catch (err) {
        return `Go back failed: ${err.message}`;
      }
    }

    case "request_visual": {
      state.sendVisualNext = true;
      return `Visual context will be included in the next turn. Reason noted: ${toolInput.reason}`;
    }

    case "pause": {
      if (HEADED) {
        console.log(`\n  ⏸  PAUSED — ${toolInput.reason}`);
        await waitForEnter("  >> Complete the action in the browser, then press ENTER to continue... ");
        await page.waitForTimeout(2000);
        return `Human completed action: "${toolInput.reason}". Page URL: ${page.url()}. You may now continue exploring.`;
      } else {
        return `Cannot pause in headless mode. The browser is not visible. Consider re-running with --headed flag if login requires CAPTCHA or 2FA.`;
      }
    }

    case "done": {
      state.isDone = true;
      return `Exploration complete. ${toolInput.summary}`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// ─── Main crawl loop ───────────────────────────────────────────────────────

async function crawlApp(slug, startUrl) {
  const isAuthenticated = hasSession(slug);
  const authLabel = HAS_CREDENTIALS ? " [LOGIN]" : isAuthenticated ? " [SESSION]" : " [PUBLIC]";
  // Force headed mode when credentials are provided (user may need to solve CAPTCHA/2FA)
  const useHeaded = HEADED || HAS_CREDENTIALS;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Crawling: ${slug} — ${startUrl}${authLabel}`);
  console.log(`  Max turns: ${MAX_TURNS} | Model: ${MODEL}`);
  if (HAS_CREDENTIALS) console.log(`  Auth: ${AUTH_EMAIL} (headed mode forced for 2FA/CAPTCHA)`);
  console.log(`${"=".repeat(60)}\n`);

  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const anthropic = new Anthropic();

  const browser = await chromium.launch({
    headless: !useHeaded,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Load saved session (cookies) BEFORE navigating
  if (isAuthenticated) {
    const session = JSON.parse(readFileSync(sessionPath(slug), "utf-8"));
    if (session.cookies && session.cookies.length > 0) {
      await context.addCookies(session.cookies);
      console.log(`  Loaded ${session.cookies.length} cookies from session`);
    }
  }

  // Navigate to start URL
  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error(`Failed to load ${startUrl}: ${err.message}`);
    await browser.close();
    return;
  }

  // Inject localStorage/sessionStorage AFTER page loads (needs same-origin)
  if (isAuthenticated) {
    try {
      await loadSession(context, page, slug);
      // Reload to pick up injected storage
      await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(3000);
    } catch (err) {
      console.log(`  Warning: session injection partial: ${err.message}`);
    }
  }

  const state = {
    slug,
    startUrl,
    screens: [],
    flowCounters: {},
    visitedHashes: new Set(),
    screenshotDir: SCREENSHOT_DIR,
    sendVisualNext: false,
    isDone: false,
  };

  const credentials = HAS_CREDENTIALS ? { email: AUTH_EMAIL, password: AUTH_PASSWORD } : null;
  const systemPrompt = buildSystemPrompt(slug, startUrl, { isAuthenticated, credentials });
  let messages = [];

  // Initial turn: provide ARIA snapshot of landing page
  const initialAria = await getAriaSnapshot(page);
  const initialHash = hashState(page.url(), initialAria);
  state.visitedHashes.add(initialHash);

  let initialContent = `Page loaded: ${page.url()}\nState hash: ${initialHash}\nVisited states: 1\nScreenshots taken: 0`;
  if (credentials) {
    initialContent += `\n\nCREDENTIALS AVAILABLE — Log in first before exploring:\n  Email: ${credentials.email}\n  Password: ${credentials.password}`;
    initialContent += `\n\nIMPORTANT: Find the login/sign-in button, click it, then use the "type" tool to enter email and password into the form fields, then submit.`;
  }
  if (isAuthenticated && !credentials) {
    initialContent += `\n\nSESSION LOADED — You should be logged in. Check if the page shows authenticated content.`;
  }
  initialContent += `\n\nARIA snapshot:\n${initialAria}`;

  messages.push({
    role: "user",
    content: initialContent,
  });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    if (state.isDone) break;

    console.log(`\n-- Turn ${turn}/${MAX_TURNS} --`);

    // Sliding window: trim old messages but never orphan tool_use/tool_result pairs.
    // Messages alternate: user, assistant (with tool_use), user (with tool_result), ...
    // We must always trim to start on a user message that has NO tool_result blocks,
    // so we never reference a tool_use_id from a trimmed assistant message.
    if (messages.length > SLIDING_WINDOW) {
      let trimTo = messages.length - SLIDING_WINDOW;
      // Walk forward until we find a user message with only text content (no tool_results)
      while (trimTo < messages.length) {
        const msg = messages[trimTo];
        if (msg.role === "user") {
          const content = Array.isArray(msg.content) ? msg.content : [msg.content];
          const hasToolResult = content.some((b) => typeof b === "object" && b.type === "tool_result");
          if (!hasToolResult) break;
        }
        trimTo++;
      }
      if (trimTo < messages.length) {
        messages = messages.slice(trimTo);
      }
    }

    // Call Claude
    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        tool_choice: { type: "any" },
        messages,
      });
    } catch (err) {
      if (err.status === 429) {
        console.log("  Rate limited — waiting 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      console.error(`  API error: ${err.message}`);
      break;
    }

    // Process response
    messages.push({ role: "assistant", content: response.content });

    const toolResults = [];
    for (const block of response.content) {
      if (block.type === "text") {
        console.log(`  Thinking: ${block.text.slice(0, 100)}...`);
      }

      if (block.type === "tool_use") {
        console.log(`  Tool: ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);

        const result = await executeTool(page, block.name, block.input, state);
        console.log(`    -> ${result.slice(0, 100)}`);

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    if (state.isDone) {
      messages.push({ role: "user", content: toolResults });
      break;
    }

    if (toolResults.length === 0) {
      console.log("  No tool calls — ending.");
      break;
    }

    // Build next user message with tool results + fresh ARIA snapshot
    const currentUrl = page.url();
    const aria = await getAriaSnapshot(page);
    const stateHash = hashState(currentUrl, aria);
    const isNewState = !state.visitedHashes.has(stateHash);
    state.visitedHashes.add(stateHash);

    // Build the content array for the next user turn
    const nextContent = [...toolResults];

    // Append context as a text block
    let contextText = `\n--- Current state ---\nURL: ${currentUrl}\nState hash: ${stateHash}${isNewState ? " (NEW)" : " (SEEN)"}\nVisited states: ${state.visitedHashes.size}\nScreenshots taken: ${state.screens.length}\nTurns remaining: ${MAX_TURNS - turn}\n\nARIA snapshot:\n${aria}`;

    // If visual was requested, capture and include screenshot image
    if (state.sendVisualNext) {
      state.sendVisualNext = false;
      try {
        const visualBuf = await page.screenshot({ type: "png", fullPage: false });
        nextContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: visualBuf.toString("base64"),
          },
        });
        contextText += "\n\n(Visual screenshot included above)";
      } catch {
        contextText += "\n\n(Visual screenshot capture failed)";
      }
    }

    nextContent.push({ type: "text", text: contextText });
    messages.push({ role: "user", content: nextContent });

    // Small delay to avoid hammering both the API and the target site
    await new Promise((r) => setTimeout(r, 1000));
  }

  // ─── Save session after credential login (for future crawls) ────────────
  if (HAS_CREDENTIALS && state.screens.length > 0) {
    try {
      await saveSession(context, page, slug);
      console.log("  Session saved for future crawls (no re-login needed).");
    } catch (err) {
      console.log(`  Warning: could not save session: ${err.message}`);
    }
  }

  // ─── Save manifest ─────────────────────────────────────────────────────

  const manifest = {
    slug,
    url: startUrl,
    crawledAt: new Date().toISOString(),
    totalScreenshots: state.screens.length,
    totalStates: state.visitedHashes.size,
    screens: state.screens,
  };

  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${manifestPath}`);

  // ─── Print copy-pasteable screens array ────────────────────────────────

  console.log(`\n${"-".repeat(60)}`);
  console.log(`Copy-pasteable screens array for src/data/apps.ts:`);
  console.log(`${"-".repeat(60)}`);
  console.log("screens: [");
  for (const s of state.screens) {
    console.log(
      `  { step: ${s.step}, label: "${s.label}", flow: "${s.flow}", image: "${s.image}" },`
    );
  }
  console.log("],");

  await browser.close();

  console.log(`\nDone! ${state.screens.length} screenshots captured for ${slug}.`);
  return manifest;
}

// ─── Entry point ───────────────────────────────────────────────────────────

async function loginFlow(slug, startUrl) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Login mode: ${slug} — ${startUrl}`);
  console.log(`  Browser will open. Log in manually, then press Enter.`);
  console.log(`${"=".repeat(60)}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  await waitForEnter("\n>> Log in to the app in the browser, then press ENTER to save session... ");

  await saveSession(context, page, slug);
  await browser.close();
  console.log(`\nSession saved! Now run the crawl:`);
  console.log(`  node scripts/crawl-app.mjs --slug ${slug} --url ${startUrl}`);
}

async function main() {
  // --login doesn't need an API key
  if (args.login) {
    if (!args.slug || !args.url) {
      console.error("Login mode requires --slug and --url:");
      console.error("  node scripts/crawl-app.mjs --login --slug binance --url https://www.binance.com");
      process.exit(1);
    }
    await loginFlow(args.slug, args.url);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  if (args.all) {
    const allApps = loadApps();
    console.log(`Running crawl for all ${allApps.length} apps...`);
    for (const app of allApps) {
      try {
        await crawlApp(app.slug, app.url);
      } catch (err) {
        console.error(`Failed to crawl ${app.slug}: ${err.message}`);
      }
    }
  } else if (args.slug && args.url) {
    await crawlApp(args.slug, args.url);
  } else if (args.slug) {
    // Look up URL from apps data
    const allApps = loadApps();
    const found = allApps.find((a) => a.slug === args.slug);
    if (!found) {
      console.error(`App "${args.slug}" not found in apps data. Provide --url explicitly.`);
      process.exit(1);
    }
    await crawlApp(found.slug, found.url);
  } else {
    console.error("Usage:");
    console.error("  node scripts/crawl-app.mjs --slug <slug> --url <url>");
    console.error("  node scripts/crawl-app.mjs --slug <slug>  (looks up URL from apps.ts)");
    console.error("  node scripts/crawl-app.mjs --all");
    console.error("");
    console.error("Auth (agent logs in automatically):");
    console.error("  node scripts/crawl-app.mjs --slug binance --url https://www.binance.com \\");
    console.error("    --auth-email user@example.com --auth-password mypassword");
    console.error("  (agent logs in, you solve CAPTCHA/2FA in the headed browser, session saved for next time)");
    console.error("");
    console.error("Auth (manual login, save session):");
    console.error("  node scripts/crawl-app.mjs --login --slug <slug> --url <url>");
    console.error("");
    console.error("Options:");
    console.error("  --max-turns <n>      Max agent turns (default: 50)");
    console.error("  --headed             Show browser window");
    console.error("  --model <id>         Claude model to use");
    console.error("  --auth-email <e>     Email for agent login (or env CRAWL_AUTH_EMAIL)");
    console.error("  --auth-password <p>  Password for agent login (or env CRAWL_AUTH_PASSWORD)");
    console.error("  --login              Manual login mode (opens headed browser)");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
