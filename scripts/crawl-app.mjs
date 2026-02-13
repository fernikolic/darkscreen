#!/usr/bin/env node

/**
 * OpenClaw Deterministic Crawler
 *
 * Pure Playwright — zero AI API calls. $0.00 per crawl.
 * Systematically screenshots every page, tab, modal, and scroll state.
 *
 * After crawling, run label-screenshots.mjs for cheap Haiku labeling (~$0.05/app).
 *
 * Usage:
 *   node scripts/crawl-app.mjs --slug lido --url https://stake.lido.fi
 *   node scripts/crawl-app.mjs --slug lido            (looks up URL from apps.ts)
 *   node scripts/crawl-app.mjs --all
 *   node scripts/crawl-app.mjs --login --slug binance --url https://www.binance.com
 *   node scripts/crawl-app.mjs --slug uniswap --wallet   (DeFi with MetaMask)
 *   node scripts/crawl-app.mjs --login --slug coinbase --app-url https://www.coinbase.com/dashboard
 *
 * Pipeline:
 *   1. crawl-app.mjs  → raw screenshots + {slug}-raw.json     ($0.00)
 *   2. label-screenshots.mjs → labeled manifest.json           (~$0.05)
 *   3. sync-manifests.mjs → updates apps.ts                    ($0.00)
 */

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
const WALLETS_DIR = resolve(__dirname, "wallets");
const METAMASK_PROFILE = resolve(WALLETS_DIR, "metamask-profile");
const METAMASK_EXT_DIR = resolve(WALLETS_DIR, "metamask-extension");
const METAMASK_META = resolve(WALLETS_DIR, "metamask-meta.json");

// ─── CLI ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    url: { type: "string" },
    "app-url": { type: "string" },
    all: { type: "boolean", default: false },
    headed: { type: "boolean", default: false },
    login: { type: "boolean", default: false },
    relogin: { type: "boolean", default: false },
    wallet: { type: "boolean", default: false },
    "max-pages": { type: "string", default: "50" },
    "max-screenshots": { type: "string", default: "80" },
  },
  strict: false,
});

const HEADED = args.headed;
const WALLET_MODE = args.wallet;
// Authenticated crawls get higher limits by default
const isAuthenticated = WALLET_MODE || args.login || args.relogin;
const MAX_PAGES = parseInt(args["max-pages"], 10) || (isAuthenticated ? 100 : 50);
const MAX_SCREENSHOTS = parseInt(args["max-screenshots"], 10) || 80;

// ─── App loading (for --all and --slug without --url) ─────────────────

function loadApps() {
  try {
    const raw = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
    const entries = [];
    // Match each app object block (from slug to accentColor)
    const blockRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?accentColor:\s*"[^"]+"/g;
    let block;
    while ((block = blockRe.exec(raw)) !== null) {
      const text = block[0];
      const slug = block[1];
      const urlMatch = text.match(/website:\s*"([^"]+)"/);
      const authMatch = text.match(/authType:\s*"([^"]+)"/);
      const appUrlMatch = text.match(/appUrl:\s*"([^"]+)"/);
      entries.push({
        slug,
        url: urlMatch ? urlMatch[1] : "",
        authType: authMatch ? authMatch[1] : "public",
        appUrl: appUrlMatch ? appUrlMatch[1] : null,
      });
    }
    return entries;
  } catch {
    return [];
  }
}

// ─── Session management ───────────────────────────────────────────────

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
    const d = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      d[k] = window.localStorage.getItem(k);
    }
    return d;
  });
  writeFileSync(
    sessionPath(slug),
    JSON.stringify({ slug, savedAt: new Date().toISOString(), cookies, localStorage }, null, 2),
  );
  console.log(`  Session saved (${cookies.length} cookies)`);
}

async function loadSession(context, page, slug) {
  if (!existsSync(sessionPath(slug))) return false;
  const session = JSON.parse(readFileSync(sessionPath(slug), "utf-8"));
  if (session.cookies?.length > 0) await context.addCookies(session.cookies);
  if (session.localStorage) {
    await page.evaluate((data) => {
      for (const [k, v] of Object.entries(data)) window.localStorage.setItem(k, v);
    }, session.localStorage);
  }
  console.log(`  Session loaded (saved ${session.savedAt})`);
  return true;
}

function sessionAge(slug) {
  if (!existsSync(sessionPath(slug))) return Infinity;
  const session = JSON.parse(readFileSync(sessionPath(slug), "utf-8"));
  if (!session.savedAt) return Infinity;
  return (Date.now() - new Date(session.savedAt).getTime()) / 1000 / 3600; // hours
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

// ─── Wallet launch (MetaMask persistent context) ──────────────────────

async function launchWithWallet() {
  if (!existsSync(METAMASK_META)) {
    console.error("  MetaMask not set up. Run: node scripts/wallet-setup.mjs");
    process.exit(1);
  }

  const meta = JSON.parse(readFileSync(METAMASK_META, "utf-8"));
  console.log(`  Loading MetaMask v${meta.metamaskVersion} from ${METAMASK_PROFILE}`);

  // launchPersistentContext reuses the saved profile (with MetaMask logged in)
  const context = await chromium.launchPersistentContext(METAMASK_PROFILE, {
    headless: false, // Extensions require headed mode
    args: [
      `--disable-extensions-except=${METAMASK_EXT_DIR}`,
      `--load-extension=${METAMASK_EXT_DIR}`,
      "--disable-blink-features=AutomationControlled",
    ],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });

  // Set up popup handler for MetaMask approval dialogs
  handleWalletPopup(context);

  return { context, browser: null }; // No separate browser — persistent context IS the browser
}

function handleWalletPopup(context) {
  context.on("page", async (popup) => {
    try {
      // MetaMask popups have chrome-extension:// URLs
      const url = popup.url();
      if (!url.includes("chrome-extension://")) return;

      console.log(`  🦊 MetaMask popup detected: ${url}`);
      await popup.waitForLoadState("domcontentloaded", { timeout: 10000 });
      await sleep(1500);

      // Auto-approve connection requests
      // MetaMask "Next" button (account selection step)
      const nextBtn = popup.locator('button:has-text("Next")');
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await sleep(1000);
      }

      // MetaMask "Connect" button (final approval)
      const connectBtn = popup.locator('button:has-text("Connect")');
      if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await connectBtn.click();
        await sleep(1000);
      }

      // MetaMask "Confirm" / "Sign" button (transaction/signature requests)
      const confirmBtn = popup.locator('button:has-text("Confirm"), button:has-text("Sign")');
      if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.first().click();
        await sleep(1000);
      }

      // MetaMask "Approve" button
      const approveBtn = popup.locator('button:has-text("Approve")');
      if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await approveBtn.click();
        await sleep(1000);
      }

      console.log("  🦊 MetaMask popup handled");
    } catch (e) {
      // Popup may close before we can interact — that's fine
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sameDomain(url, base) {
  try {
    const t = new URL(url).hostname;
    const b = new URL(base).hostname;
    return t === b || t.endsWith("." + b);
  } catch {
    return false;
  }
}

function urlToLabel(url) {
  try {
    const path = new URL(url).pathname;
    return (
      path
        .replace(/^\//, "")
        .replace(/\/$/, "")
        .replace(/\//g, " - ") || "home"
    );
  } catch {
    return "unknown";
  }
}

function sanitize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function getPageFingerprint(page) {
  const title = await page.title().catch(() => "");
  const text = await page
    .evaluate(() => {
      const el = document.querySelector('main, [role="main"], #app, #__next, #root');
      return (el || document.body).innerText.slice(0, 500);
    })
    .catch(() => "");
  return { title, text };
}

// Content hash (URL-independent) — catches identical pages at different paths (e.g. 404s)
function contentHash(fingerprint) {
  return createHash("md5")
    .update(`${fingerprint.title}|${fingerprint.text}`)
    .digest("hex")
    .slice(0, 12);
}

// Full state hash (URL + content) — catches same-URL different-content (SPA states)
function stateHash(url, fingerprint) {
  const cleanUrl = url.split("#")[0].split("?")[0];
  return createHash("md5")
    .update(`${cleanUrl}|${fingerprint.title}|${fingerprint.text}`)
    .digest("hex")
    .slice(0, 12);
}

// Random delay to appear more human-like
function humanDelay() {
  return sleep(500 + Math.random() * 1000);
}

// ─── Crawl state (reset per app) ─────────────────────────────────────

let screenshotIdx = 0;
let screenshots = [];
let stateHashes = new Set();
let contentHashes = new Set();

function resetState() {
  screenshotIdx = 0;
  screenshots = [];
  stateHashes = new Set();
  contentHashes = new Set();
}

// ─── Screenshot capture ──────────────────────────────────────────────

async function capture(page, slug, opts = {}) {
  if (screenshotIdx >= MAX_SCREENSHOTS) return null;

  const fp = await getPageFingerprint(page);
  const sHash = stateHash(page.url(), fp);
  const cHash = contentHash(fp);

  if (!opts.force) {
    // Skip if we've seen this exact state OR this exact content at a different URL
    if (stateHashes.has(sHash)) return null;
    if (contentHashes.has(cHash)) return null;
  }
  stateHashes.add(sHash);
  contentHashes.add(cHash);

  const idx = ++screenshotIdx;
  const filename = `${slug}-raw-${String(idx).padStart(3, "0")}.png`;
  const filepath = resolve(SCREENSHOT_DIR, filename);

  await page.screenshot({ path: filepath, fullPage: false });

  const entry = {
    index: idx,
    filename,
    url: page.url(),
    action: opts.action || "page",
    context: opts.context || "",
  };
  screenshots.push(entry);
  console.log(`  📸 [${idx}] ${opts.context || opts.action || filename}`);
  return entry;
}

// ─── Overlay dismissal ───────────────────────────────────────────────

const OVERLAY_SELECTORS = [
  'button:has-text("Accept All")',
  'button:has-text("Accept all")',
  'button:has-text("Accept")',
  'button:has-text("I Agree")',
  'button:has-text("Got it")',
  'button:has-text("Agree")',
  'button:has-text("OK")',
  'button:has-text("Dismiss")',
  'button:has-text("No thanks")',
  'button:has-text("Reject All")',
  'button[aria-label="Close"]',
  'button[aria-label="close"]',
  'button[aria-label="Dismiss"]',
  "#onetrust-accept-btn-handler",
  ".cookie-consent-accept",
  '[data-testid="close-button"]',
  '[data-testid="dismiss"]',
];

async function dismissOverlays(page, slug) {
  let dismissed = false;
  for (const sel of OVERLAY_SELECTORS) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 300 })) {
        // Screenshot the overlay first
        await capture(page, slug, {
          action: "overlay",
          context: `Overlay before dismiss`,
          force: true,
        });
        await el.click({ timeout: 2000 });
        await sleep(500);
        dismissed = true;
        break; // Usually only one overlay at a time
      }
    } catch {}
  }
  return dismissed;
}

// ─── Link extraction ─────────────────────────────────────────────────

async function extractLinks(page, baseUrl) {
  const rawLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]")).map((a) => ({
      href: a.href,
      text: (a.textContent || "").trim().slice(0, 50),
      inNav: !!a.closest('nav, header, [role="navigation"]'),
    }));
  });

  const seen = new Set();
  const navLinks = [];
  const bodyLinks = [];

  for (const { href, text, inNav } of rawLinks) {
    try {
      const u = new URL(href);
      u.hash = "";
      u.search = "";
      const clean = u.href;
      if (seen.has(clean)) continue;
      if (!sameDomain(href, baseUrl)) continue;
      // Skip asset/API URLs
      if (u.pathname.match(/\.(png|jpg|svg|css|js|ico|woff|json)$/)) continue;
      if (u.pathname.startsWith("/api/")) continue;
      seen.add(clean);
      const entry = { url: clean, text: text || urlToLabel(clean) };
      if (inNav) navLinks.push(entry);
      else bodyLinks.push(entry);
    } catch {}
  }

  // Nav links first (higher priority), then body links
  return [...navLinks, ...bodyLinks];
}

// ─── Scroll and capture ─────────────────────────────────────────────

async function scrollAndCapture(page, slug, label) {
  const viewportH = 900;
  const totalH = await page.evaluate(() => document.body.scrollHeight).catch(() => 0);

  if (totalH <= viewportH * 1.3) return;

  let scrollY = viewportH;
  let scrollNum = 0;

  while (scrollY < totalH && scrollNum < 4) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await sleep(800);

    await capture(page, slug, {
      action: "scroll",
      context: `${label} — scrolled ${scrollNum + 1}`,
    });

    scrollY += Math.round(viewportH * 0.8);
    scrollNum++;
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
}

// ─── Tab exploration ─────────────────────────────────────────────────

async function exploreTabs(page, slug, pageLabel) {
  // Find ARIA tabs
  let tabs = await page.locator('[role="tab"]').all();

  // Fallback: tablist children
  if (tabs.length <= 1) {
    tabs = await page.locator('[role="tablist"] > button, [role="tablist"] > a').all();
  }

  const seen = new Set();
  let captured = 0;

  for (const tab of tabs) {
    if (screenshotIdx >= MAX_SCREENSHOTS || captured >= 8) break;
    try {
      if (!(await tab.isVisible())) continue;
      const text = (await tab.textContent()) || "";
      const label = text.trim().slice(0, 30);
      if (!label || seen.has(label)) continue;
      seen.add(label);

      await tab.click({ timeout: 3000 });
      await sleep(1000);

      const took = await capture(page, slug, {
        action: "tab",
        context: `${pageLabel} — ${label} tab`,
      });
      if (took) captured++;
    } catch {}
  }

  return captured;
}

// ─── Interactive element exploration ─────────────────────────────────

const INTERACTIVE_PATTERNS = [
  { selector: 'button:has-text("Connect Wallet")', label: "Connect Wallet modal" },
  { selector: 'button:has-text("Connect wallet")', label: "Connect wallet modal" },
  {
    selector: 'button:has-text("Connect"):not(:has-text("Disconnect"))',
    label: "Connect modal",
  },
  { selector: 'button:has-text("Log In")', label: "Login modal" },
  { selector: 'button:has-text("Login")', label: "Login modal" },
  { selector: 'button:has-text("Sign In")', label: "Sign in modal" },
  { selector: 'button:has-text("Sign Up")', label: "Sign up modal" },
  { selector: 'button[aria-label="Menu"]', label: "Menu dropdown" },
  { selector: 'button[aria-label="menu"]', label: "Menu dropdown" },
  { selector: 'button:has-text("More")', label: "More menu" },
  { selector: 'button:has-text("Settings")', label: "Settings" },
  { selector: 'button:has-text("Language")', label: "Language selector" },
  // Search triggers
  { selector: 'button[aria-label="Search"]', label: "Search modal" },
  { selector: 'input[placeholder*="Search"]', label: "Search field", click: false },
];

async function exploreInteractiveElements(page, slug, pageLabel) {
  let captured = 0;

  for (const pattern of INTERACTIVE_PATTERNS) {
    if (screenshotIdx >= MAX_SCREENSHOTS || captured >= 6) break;

    try {
      const el = page.locator(pattern.selector).first();
      if (!(await el.isVisible({ timeout: 300 }))) continue;

      if (pattern.click === false) continue; // Just check visibility, don't click

      await el.click({ timeout: 3000 });
      await sleep(1000);

      const took = await capture(page, slug, {
        action: "interaction",
        context: `${pageLabel} — ${pattern.label}`,
      });
      if (took) captured++;

      // Dismiss: Escape key
      await page.keyboard.press("Escape");
      await sleep(500);
    } catch {}
  }

  return captured;
}

// ─── Token selector exploration (common in DeFi) ─────────────────────

async function exploreTokenSelectors(page, slug, pageLabel) {
  // Many DeFi apps have token selector buttons (usually showing a token icon + name)
  const tokenBtnSelectors = [
    'button:has-text("Select a token")',
    'button:has-text("Select token")',
    'button:has-text("Choose token")',
    // Buttons that show a specific token (like ETH, USDC) and open a selector
    'button:has(img)[class*="token"]',
    '[class*="token-select"] button',
    '[class*="tokenSelect"] button',
  ];

  for (const sel of tokenBtnSelectors) {
    if (screenshotIdx >= MAX_SCREENSHOTS) break;
    try {
      const el = page.locator(sel).first();
      if (!(await el.isVisible({ timeout: 300 }))) continue;

      await el.click({ timeout: 3000 });
      await sleep(1000);

      await capture(page, slug, {
        action: "interaction",
        context: `${pageLabel} — Token selector`,
      });

      await page.keyboard.press("Escape");
      await sleep(500);
      break; // Usually one selector is enough
    } catch {}
  }
}

// ─── Common path probing ─────────────────────────────────────────────

const COMMON_PATHS = [
  "/this-page-does-not-exist-404-test",
  "/settings",
  "/help",
  "/faq",
  "/about",
  "/login",
  "/signin",
  "/signup",
  "/earn",
  "/stake",
  "/staking",
  "/swap",
  "/trade",
  "/exchange",
  "/markets",
  "/explore",
  "/governance",
  "/vote",
  "/portfolio",
  "/dashboard",
  "/rewards",
  "/referral",
  "/send",
  "/bridge",
  "/pool",
  "/pools",
  "/liquidity",
  "/lend",
  "/borrow",
  "/perps",
  "/predict",
];

// Additional paths that only make sense when authenticated
const AUTH_PATHS = [
  "/history",
  "/transactions",
  "/notifications",
  "/account",
  "/profile",
  "/deposit",
  "/withdraw",
  "/positions",
  "/orders",
  "/activity",
];

async function probeCommonPaths(page, slug, baseUrl, visited, authenticated = false) {
  const origin = new URL(baseUrl).origin;
  let found = 0;
  const paths = authenticated ? [...COMMON_PATHS, ...AUTH_PATHS] : COMMON_PATHS;

  for (const p of paths) {
    if (screenshotIdx >= MAX_SCREENSHOTS || found >= 15) break;
    const url = origin + p;
    const cleanUrl = url.replace(/\/$/, "");
    if (visited.has(cleanUrl) || visited.has(cleanUrl + "/")) continue;
    visited.add(cleanUrl);

    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
      await sleep(800);

      // Check if we got redirected back to home (many apps do this for unknown routes)
      const finalUrl = page.url().split("#")[0].split("?")[0];
      if (visited.has(finalUrl) && finalUrl !== cleanUrl) continue;

      await dismissOverlays(page, slug);
      const took = await capture(page, slug, {
        action: "common-path",
        context: `Path: ${p}`,
      });
      if (took) found++;
    } catch {}
  }

  return found;
}

// ─── Wallet connection (clicks Connect Wallet on DApps) ──────────────

async function connectWallet(page, slug) {
  const connectSelectors = [
    'button:has-text("Connect Wallet")',
    'button:has-text("Connect wallet")',
    'button:has-text("Connect"):not(:has-text("Disconnect"))',
    '[data-testid="navbar-connect-wallet"]',
    '[data-testid="connect-wallet"]',
  ];

  for (const sel of connectSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        console.log("  🔗 Clicking connect wallet...");
        await capture(page, slug, {
          action: "pre-connect",
          context: "Before wallet connect",
        });

        await el.click({ timeout: 5000 });
        await sleep(2000);

        // Look for MetaMask option in the wallet selection modal
        const mmSelectors = [
          'button:has-text("MetaMask")',
          'button:has-text("Metamask")',
          '[data-testid="MetaMask"]',
          'img[alt="MetaMask"]',
          'img[alt="Metamask"]',
        ];

        for (const mmSel of mmSelectors) {
          try {
            const mmBtn = page.locator(mmSel).first();
            if (await mmBtn.isVisible({ timeout: 2000 })) {
              // Screenshot the wallet selector modal
              await capture(page, slug, {
                action: "wallet-modal",
                context: "Wallet selection modal",
              });
              await mmBtn.click({ timeout: 3000 });
              console.log("  🦊 Selected MetaMask — waiting for popup approval...");
              // The handleWalletPopup listener will auto-approve in MetaMask
              await sleep(5000);
              return true;
            }
          } catch {}
        }

        // No specific MetaMask button found — maybe it auto-detected the extension
        console.log("  🔗 Connect clicked — MetaMask may auto-connect");
        await sleep(3000);
        return true;
      }
    } catch {}
  }

  console.log("  ℹ No connect wallet button found (may already be connected)");
  return false;
}

// ─── Main crawl function ─────────────────────────────────────────────

async function crawlApp(slug, startUrl) {
  const hasAuth = hasSession(slug);
  const authMode = WALLET_MODE ? "WALLET" : hasAuth ? "SESSION" : "PUBLIC";
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Crawling: ${slug} — ${startUrl} [${authMode}]`);
  console.log(`  Mode: Deterministic (zero API cost)`);
  console.log(`  Limits: ${MAX_PAGES} pages, ${MAX_SCREENSHOTS} screenshots`);
  console.log(`${"═".repeat(60)}\n`);

  // Warn about stale sessions
  if (hasAuth && !WALLET_MODE) {
    const age = sessionAge(slug);
    if (age > 24) {
      console.log(`  ⚠ Session is ${Math.round(age)}h old — consider --relogin if auth fails`);
    }
  }

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  resetState();

  let browser = null;
  let context;
  let page;

  if (WALLET_MODE) {
    // Wallet mode: use persistent context with MetaMask extension
    const result = await launchWithWallet();
    context = result.context;
    browser = result.browser;
    // Persistent context already has pages — use the first or create one
    page = context.pages()[0] || await context.newPage();
  } else {
    browser = await chromium.launch({
      headless: !HEADED,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();
  }

  page.setDefaultTimeout(10000);

  const visited = new Set();

  // Load session if available (non-wallet mode)
  if (hasAuth && !WALLET_MODE) {
    const session = JSON.parse(readFileSync(sessionPath(slug), "utf-8"));
    if (session.cookies?.length > 0) await context.addCookies(session.cookies);
  }

  // ── Phase 1: Landing page ────────────────────────────────────────
  console.log("Phase 1: Landing page");
  try {
    await page.goto(startUrl, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    try {
      await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      console.error(`  Failed to load ${startUrl}: ${e.message}`);
      if (browser) await browser.close();
      else await context.close();
      return null;
    }
  }
  await sleep(2000);
  visited.add(startUrl);
  visited.add(new URL(startUrl).origin + new URL(startUrl).pathname);

  // Inject session storage after navigation
  if (hasAuth) {
    try {
      await loadSession(context, page, slug);
      await page.reload({ waitUntil: "networkidle", timeout: 15000 });
      await sleep(2000);
    } catch {}
  }

  await capture(page, slug, { action: "landing", context: "Landing page", force: true });
  const hadOverlay = await dismissOverlays(page, slug);
  if (hadOverlay) {
    await capture(page, slug, {
      action: "landing-clean",
      context: "Landing page after overlay dismissed",
      force: true,
    });
  }
  await scrollAndCapture(page, slug, "Landing page");

  // ── Phase 2: Discover links ──────────────────────────────────────
  console.log("\nPhase 2: Link discovery");
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);

  const links = await extractLinks(page, startUrl);
  console.log(`  Found ${links.length} same-domain links`);

  // ── Phase 3: Visit pages + explore tabs ──────────────────────────
  console.log("\nPhase 3: Visiting pages");
  let pagesVisited = 0;

  for (const link of links) {
    if (screenshotIdx >= MAX_SCREENSHOTS || pagesVisited >= MAX_PAGES) break;

    const cleanUrl = link.url.replace(/\/$/, "");
    if (visited.has(cleanUrl) || visited.has(cleanUrl + "/")) continue;
    visited.add(cleanUrl);
    visited.add(cleanUrl + "/");
    pagesVisited++;

    try {
      await page.goto(link.url, { waitUntil: "networkidle", timeout: 15000 });
      await sleep(1000);

      await dismissOverlays(page, slug);

      const label = link.text || urlToLabel(link.url);
      await capture(page, slug, {
        action: "page",
        context: `${label} (${new URL(link.url).pathname})`,
      });

      // Scroll on this page
      await scrollAndCapture(page, slug, label);

      // Explore tabs on this page
      await exploreTabs(page, slug, label);

      // Try token selectors on swap-like pages
      const pathname = new URL(link.url).pathname.toLowerCase();
      if (pathname.match(/swap|trade|exchange/)) {
        await exploreTokenSelectors(page, slug, label);
      }

      await humanDelay();
    } catch (e) {
      console.log(`  ⚠ Failed: ${link.url} — ${(e.message || "").slice(0, 60)}`);
    }
  }

  // ── Phase 4: Interactive elements on landing ─────────────────────
  console.log("\nPhase 4: Interactive elements");
  try {
    await page.goto(startUrl, { waitUntil: "networkidle", timeout: 15000 });
    await sleep(1000);
    await dismissOverlays(page, slug);

    if (WALLET_MODE) {
      // In wallet mode, actually connect to the DApp
      await connectWallet(page, slug);
      await sleep(3000);
      // Screenshot the connected state
      await capture(page, slug, {
        action: "wallet-connected",
        context: "Landing — wallet connected",
        force: true,
      });
      await scrollAndCapture(page, slug, "Landing (connected)");
    } else {
      await exploreInteractiveElements(page, slug, "Landing");
    }
    await exploreTokenSelectors(page, slug, "Landing");
  } catch {}

  // ── Phase 5: Common paths ────────────────────────────────────────
  console.log("\nPhase 5: Common paths");
  const authenticated = WALLET_MODE || hasAuth;
  await probeCommonPaths(page, slug, startUrl, visited, authenticated);

  // ── Save raw manifest ────────────────────────────────────────────
  const rawManifest = {
    slug,
    url: startUrl,
    crawledAt: new Date().toISOString(),
    totalScreenshots: screenshots.length,
    screens: [...screenshots],
  };

  const outPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
  writeFileSync(outPath, JSON.stringify(rawManifest, null, 2));

  if (browser) await browser.close();
  else await context.close();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Done! ${screenshots.length} screenshots for ${slug}`);
  console.log(`  Raw manifest: ${outPath}`);
  console.log(`  Cost: $0.00`);
  console.log(`\n  Next: node scripts/label-screenshots.mjs --slug ${slug}`);
  console.log(`${"─".repeat(60)}`);

  return rawManifest;
}

// ─── Login flow ──────────────────────────────────────────────────────

async function loginFlow(slug, startUrl, crawlUrl) {
  console.log(`\n  Login mode: ${slug} — ${startUrl}`);
  console.log("  Browser will open. Log in manually, then press Enter.\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  await waitForEnter(">> Log in to the app, then press ENTER to save session and start crawling... ");
  await saveSession(context, page, slug);
  await browser.close();
  console.log("  Session saved! Starting crawl...\n");

  // Immediately start crawling with the saved session
  const targetUrl = crawlUrl || startUrl;
  await crawlApp(slug, targetUrl);
}

// ─── Entry point ─────────────────────────────────────────────────────

async function main() {
  // Resolve app data from apps.ts if slug is provided
  const allApps = loadApps();
  const appData = args.slug ? allApps.find((a) => a.slug === args.slug) : null;

  // --login or --relogin: open browser for manual login, then crawl
  if (args.login || args.relogin) {
    if (!args.slug) {
      console.error("Usage: node scripts/crawl-app.mjs --login --slug <slug> [--url <url>] [--app-url <url>]");
      process.exit(1);
    }
    // Skip login if session exists and not --relogin
    if (args.login && !args.relogin && hasSession(args.slug)) {
      const age = sessionAge(args.slug);
      console.log(`  Session exists (${Math.round(age)}h old). Use --relogin to force new login.`);
      console.log("  Starting crawl with existing session...\n");
      const crawlUrl = args["app-url"] || (appData && appData.appUrl) || args.url || (appData && appData.url);
      if (!crawlUrl) {
        console.error(`App "${args.slug}" not found in apps.ts. Provide --url.`);
        process.exit(1);
      }
      return crawlApp(args.slug, crawlUrl);
    }

    const loginUrl = args.url || (appData && appData.url);
    if (!loginUrl) {
      console.error(`App "${args.slug}" not found in apps.ts. Provide --url.`);
      process.exit(1);
    }
    const crawlUrl = args["app-url"] || (appData && appData.appUrl) || loginUrl;
    return loginFlow(args.slug, loginUrl, crawlUrl);
  }

  if (args.all) {
    console.log(`Crawling all ${allApps.length} apps...`);
    for (const app of allApps) {
      try {
        await crawlApp(app.slug, app.url);
      } catch (e) {
        console.error(`Failed ${app.slug}: ${e.message}`);
      }
    }
  } else if (args.slug) {
    // Determine the URL: CLI --url > --app-url > appData.appUrl (when wallet/login) > appData.url
    let crawlUrl = args.url;
    if (!crawlUrl && appData) {
      if ((WALLET_MODE || hasSession(args.slug)) && appData.appUrl) {
        crawlUrl = appData.appUrl;
      } else {
        crawlUrl = appData.url;
      }
    }
    if (args["app-url"]) {
      crawlUrl = args["app-url"];
    }
    if (!crawlUrl) {
      console.error(`App "${args.slug}" not found in apps.ts. Provide --url.`);
      process.exit(1);
    }
    await crawlApp(args.slug, crawlUrl);
  } else {
    console.error("OpenClaw Deterministic Crawler");
    console.error("Zero API cost — pure Playwright automation\n");
    console.error("Usage:");
    console.error("  node scripts/crawl-app.mjs --slug <slug> --url <url>");
    console.error("  node scripts/crawl-app.mjs --slug <slug>");
    console.error("  node scripts/crawl-app.mjs --slug <slug> --wallet");
    console.error("  node scripts/crawl-app.mjs --all");
    console.error("  node scripts/crawl-app.mjs --login --slug <slug> [--url <url>]");
    console.error("  node scripts/crawl-app.mjs --relogin --slug <slug> [--url <url>]\n");
    console.error("Options:");
    console.error("  --headed              Show browser window");
    console.error("  --wallet              Use MetaMask extension (DeFi apps)");
    console.error("  --login               Manual login (KYC apps — auto-crawls after)");
    console.error("  --relogin             Force new login even if session exists");
    console.error("  --app-url <url>       Override authenticated app URL");
    console.error("  --max-pages <n>       Max pages to visit (default: 50, 100 with auth)");
    console.error("  --max-screenshots <n> Max screenshots (default: 80)\n");
    console.error("Pipeline:");
    console.error("  1. crawl-app.mjs          → raw screenshots     ($0.00)");
    console.error("  2. label-screenshots.mjs  → labeled manifest    (~$0.05)");
    console.error("  3. sync-manifests.mjs     → update apps.ts      ($0.00)");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
