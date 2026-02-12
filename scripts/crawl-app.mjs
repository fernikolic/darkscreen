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
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");

// ─── CLI ────────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    url: { type: "string" },
    all: { type: "boolean", default: false },
    "max-turns": { type: "string", default: "50" },
    headed: { type: "boolean", default: false },
    model: { type: "string", default: "claude-sonnet-4-5-20250514" },
  },
  strict: false,
});

const MAX_TURNS = parseInt(args["max-turns"], 10);
const HEADED = args.headed;
const MODEL = args.model;
const SLIDING_WINDOW = 40; // max messages kept in context

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

function buildSystemPrompt(slug, startUrl) {
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
   - Submit real forms or create real accounts
   - Enter real credentials or wallet info
   - Navigate to external domains (stay on ${new URL(startUrl).hostname} and its subdomains)
   - Click "Sign up" / "Create account" submit buttons (screenshot the form instead)

6. **Label descriptively** — Each screenshot label should describe what's shown: "Main navigation with Markets tab active", "Token swap confirmation modal", "Cookie consent banner".

7. **Be efficient** — Don't screenshot the same state twice. The state hash will tell you if you've already captured a similar view.

8. **Use request_visual sparingly** — Only when ARIA text is genuinely insufficient (complex charts, image-heavy pages).

## Current app
- Slug: ${slug}
- Start URL: ${startUrl}
- Domain restriction: ${new URL(startUrl).hostname}`;
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
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Crawling: ${slug} — ${startUrl}`);
  console.log(`  Max turns: ${MAX_TURNS} | Model: ${MODEL}`);
  console.log(`${"=".repeat(60)}\n`);

  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const anthropic = new Anthropic();

  const browser = await chromium.launch({
    headless: !HEADED,
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

  // Navigate to start URL
  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error(`Failed to load ${startUrl}: ${err.message}`);
    await browser.close();
    return;
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

  const systemPrompt = buildSystemPrompt(slug, startUrl);
  let messages = [];

  // Initial turn: provide ARIA snapshot of landing page
  const initialAria = await getAriaSnapshot(page);
  const initialHash = hashState(page.url(), initialAria);
  state.visitedHashes.add(initialHash);

  messages.push({
    role: "user",
    content: `Page loaded: ${page.url()}\nState hash: ${initialHash}\nVisited states: 1\nScreenshots taken: 0\n\nARIA snapshot:\n${initialAria}`,
  });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    if (state.isDone) break;

    console.log(`\n-- Turn ${turn}/${MAX_TURNS} --`);

    // Sliding window: keep system prompt fresh, trim old messages
    if (messages.length > SLIDING_WINDOW) {
      const trimCount = messages.length - SLIDING_WINDOW;
      messages = messages.slice(trimCount);
      // Ensure first message is from user
      if (messages[0].role !== "user") {
        messages = messages.slice(1);
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

async function main() {
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
    console.error("Options:");
    console.error("  --max-turns <n>   Max agent turns (default: 50)");
    console.error("  --headed          Show browser window");
    console.error("  --model <id>      Claude model to use");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
