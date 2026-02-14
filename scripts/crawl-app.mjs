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

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { TOTP } from "otpauth";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { createInterface } from "readline";
import { execFileSync } from "child_process";

// Anti-detection: stealth plugin hides WebDriver flag, randomizes fingerprints
chromium.use(StealthPlugin());

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const SESSIONS_DIR = resolve(__dirname, "sessions");
const PROFILES_DIR = resolve(__dirname, "profiles");
const CREDENTIALS_DIR = resolve(__dirname, "credentials");
const AUTH_CONFIG_PATH = resolve(__dirname, "auth-config.json");
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
    "check-auth": { type: "boolean", default: false },
    "save-creds": { type: "boolean", default: false },
    "no-reauth": { type: "boolean", default: false },
    proxy: { type: "string" },
    mobile: { type: "boolean", default: false },
    tablet: { type: "boolean", default: false },
    device: { type: "string" },
  },
  strict: false,
});

const HEADED = args.headed;
const WALLET_MODE = args.wallet;
const PROXY_SERVER = args.proxy || process.env.DARKSCREEN_PROXY || null;
// Authenticated crawls get higher limits by default
const isAuthenticated = WALLET_MODE || args.login || args.relogin;
const MAX_PAGES = parseInt(args["max-pages"], 10) || (isAuthenticated ? 100 : 50);
const MAX_SCREENSHOTS = parseInt(args["max-screenshots"], 10) || 80;

// Force US English locale for consistent screenshots regardless of machine location
const BROWSER_LOCALE = "en-US";
const BROWSER_TIMEZONE = "America/New_York";

// ─── Device presets ───────────────────────────────────────────────────

const DEVICE_PRESETS = {
  desktop: {
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  "iphone-15-pro": {
    viewport: { width: 393, height: 852 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  "pixel-8": {
    viewport: { width: 412, height: 915 },
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  },
  "ipad-pro": {
    viewport: { width: 1024, height: 1366 },
    userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

// Resolve which device profile to use
function resolveDevice() {
  if (args.device && DEVICE_PRESETS[args.device]) return { name: args.device, ...DEVICE_PRESETS[args.device] };
  if (args.mobile) return { name: "iphone-15-pro", ...DEVICE_PRESETS["iphone-15-pro"] };
  if (args.tablet) return { name: "ipad-pro", ...DEVICE_PRESETS["ipad-pro"] };
  return { name: "desktop", ...DEVICE_PRESETS["desktop"] };
}

const ACTIVE_DEVICE = resolveDevice();
const BROWSER_USER_AGENT = ACTIVE_DEVICE.userAgent;

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

// ─── Persistent profile management (for login apps) ───────────────────

function profilePath(slug) {
  return resolve(PROFILES_DIR, slug);
}
function hasProfile(slug) {
  return existsSync(profilePath(slug));
}

async function launchWithProfile(slug, opts = {}) {
  const profDir = profilePath(slug);
  mkdirSync(profDir, { recursive: true });

  const headed = opts.headed || HEADED;
  console.log(`  Using persistent profile: ${profDir}${headed ? " (headed)" : ""}`);

  const launchOpts = {
    headless: !headed,
    args: ["--disable-blink-features=AutomationControlled"],
    viewport: ACTIVE_DEVICE.viewport,
    deviceScaleFactor: ACTIVE_DEVICE.deviceScaleFactor,
    isMobile: ACTIVE_DEVICE.isMobile,
    hasTouch: ACTIVE_DEVICE.hasTouch,
    userAgent: BROWSER_USER_AGENT,
    locale: BROWSER_LOCALE,
    timezoneId: BROWSER_TIMEZONE,
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    ignoreHTTPSErrors: true,
  };
  if (PROXY_SERVER) launchOpts.proxy = { server: PROXY_SERVER };

  const context = await chromium.launchPersistentContext(profDir, launchOpts);

  return { context, browser: null };
}

function loadAuthConfig(slug) {
  if (!existsSync(AUTH_CONFIG_PATH)) return {};
  try {
    const all = JSON.parse(readFileSync(AUTH_CONFIG_PATH, "utf-8"));
    return all[slug] || {};
  } catch {
    return {};
  }
}

// ─── Credential storage ───────────────────────────────────────────────

function credentialPath(slug) {
  return resolve(CREDENTIALS_DIR, `${slug}.json`);
}

function loadCredentials(slug) {
  const p = credentialPath(slug);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf-8");
    const data = JSON.parse(raw);
    if (data.encrypted && process.env.DARKSCREEN_CRED_KEY) {
      return decryptCredentials(data);
    }
    if (data.encrypted) {
      console.log("  ⚠ Credentials are encrypted but DARKSCREEN_CRED_KEY not set");
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveCredentials(slug, creds) {
  mkdirSync(CREDENTIALS_DIR, { recursive: true });
  const key = process.env.DARKSCREEN_CRED_KEY;
  if (key) {
    const encrypted = encryptCredentials(creds, key);
    writeFileSync(credentialPath(slug), JSON.stringify(encrypted, null, 2));
    console.log("  Credentials saved (encrypted)");
  } else {
    console.log("  ⚠ DARKSCREEN_CRED_KEY not set — saving credentials in plaintext");
    writeFileSync(credentialPath(slug), JSON.stringify({ ...creds, encrypted: false }, null, 2));
    console.log("  Credentials saved");
  }
}

async function promptSaveCredentials(slug) {
  if (!args["save-creds"]) return;
  try {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((res) => rl.question("  Save credentials for auto-relogin? (y/N): ", res));
    rl.close();
    if (answer.toLowerCase() !== "y") return;

    const rl2 = createInterface({ input: process.stdin, output: process.stdout });
    const username = await new Promise((res) => rl2.question("  Username/email: ", res));
    const password = await new Promise((res) => rl2.question("  Password: ", res));
    const totpSecret = await new Promise((res) => rl2.question("  TOTP secret (base32, or press Enter to skip): ", res));
    rl2.close();

    const creds = { username, password };
    if (totpSecret.trim()) creds.totpSecret = totpSecret.trim();
    saveCredentials(slug, creds);
  } catch {}
}

function encryptCredentials(creds, key) {
  const derivedKey = createHash("sha256").update(key).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
  const plaintext = JSON.stringify(creds);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { encrypted: true, iv: iv.toString("hex"), tag, data: encrypted };
}

function decryptCredentials(encData) {
  const key = process.env.DARKSCREEN_CRED_KEY;
  const derivedKey = createHash("sha256").update(key).digest();
  const decipher = createDecipheriv("aes-256-gcm", derivedKey, Buffer.from(encData.iv, "hex"));
  decipher.setAuthTag(Buffer.from(encData.tag, "hex"));
  let decrypted = decipher.update(encData.data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

// ─── CAPTCHA detection and solving (CapSolver API) ────────────────────

const CAPSOLVER_API = "https://api.capsolver.com";

async function detectCaptcha(page) {
  // Cloudflare Turnstile
  const turnstile = await page.locator('iframe[src*="challenges.cloudflare.com"], [class*="cf-turnstile"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  if (turnstile) {
    const siteKey = await page.evaluate(() => {
      const el = document.querySelector('[class*="cf-turnstile"]');
      return el?.getAttribute("data-sitekey") || null;
    }).catch(() => null);
    return { type: "turnstile", siteKey };
  }

  // reCAPTCHA v2
  const recaptchaV2 = await page.locator('iframe[src*="google.com/recaptcha"], .g-recaptcha').first().isVisible({ timeout: 1000 }).catch(() => false);
  if (recaptchaV2) {
    const siteKey = await page.evaluate(() => {
      const el = document.querySelector('.g-recaptcha');
      return el?.getAttribute("data-sitekey") || null;
    }).catch(() => null);
    return { type: "recaptchav2", siteKey };
  }

  // hCaptcha
  const hcaptcha = await page.locator('iframe[src*="hcaptcha.com"], .h-captcha').first().isVisible({ timeout: 1000 }).catch(() => false);
  if (hcaptcha) {
    const siteKey = await page.evaluate(() => {
      const el = document.querySelector('.h-captcha');
      return el?.getAttribute("data-sitekey") || null;
    }).catch(() => null);
    return { type: "hcaptcha", siteKey };
  }

  // reCAPTCHA v3 (invisible — check for script tag)
  const recaptchaV3 = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[src*="recaptcha"]');
    for (const s of scripts) {
      if (s.src.includes("render=")) {
        const match = s.src.match(/render=([^&]+)/);
        return match ? match[1] : null;
      }
    }
    return null;
  }).catch(() => null);
  if (recaptchaV3) {
    return { type: "recaptchav3", siteKey: recaptchaV3 };
  }

  return null;
}

async function solveCaptcha(page, captchaInfo) {
  const apiKey = process.env.CAPSOLVER_API_KEY;
  if (!apiKey) {
    console.log("  ⚠ CAPTCHA detected but CAPSOLVER_API_KEY not set — cannot solve");
    return false;
  }

  console.log(`  Solving ${captchaInfo.type} CAPTCHA via CapSolver...`);

  const taskTypeMap = {
    turnstile: "AntiTurnstileTaskProxyLess",
    recaptchav2: "ReCaptchaV2TaskProxyLess",
    recaptchav3: "ReCaptchaV3TaskProxyLess",
    hcaptcha: "HCaptchaTaskProxyLess",
  };

  const taskType = taskTypeMap[captchaInfo.type];
  if (!taskType || !captchaInfo.siteKey) {
    console.log("  Could not determine CAPTCHA task type or site key");
    return false;
  }

  try {
    // Create task
    const taskPayload = {
      clientKey: apiKey,
      task: {
        type: taskType,
        websiteURL: page.url(),
        websiteKey: captchaInfo.siteKey,
      },
    };

    // reCAPTCHA v3 needs pageAction and minScore
    if (captchaInfo.type === "recaptchav3") {
      taskPayload.task.pageAction = "login";
      taskPayload.task.minScore = 0.7;
    }

    const createRes = await fetch(`${CAPSOLVER_API}/createTask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPayload),
    });
    const createData = await createRes.json();

    if (createData.errorId !== 0) {
      console.log(`  CapSolver error: ${createData.errorDescription || createData.errorCode}`);
      return false;
    }

    const taskId = createData.taskId;
    console.log(`  CapSolver task created: ${taskId}`);

    // Poll for result (max 120s)
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await sleep(3000);
      const resultRes = await fetch(`${CAPSOLVER_API}/getTaskResult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey: apiKey, taskId }),
      });
      const resultData = await resultRes.json();

      if (resultData.status === "ready") {
        const token = resultData.solution?.token || resultData.solution?.gRecaptchaResponse;
        if (!token) {
          console.log("  CapSolver returned no token");
          return false;
        }

        console.log("  CAPTCHA solved! Injecting token...");

        // Inject the solution token into the page
        if (captchaInfo.type === "turnstile") {
          await page.evaluate((t) => {
            const input = document.querySelector('[name="cf-turnstile-response"]') ||
                          document.querySelector('input[name*="turnstile"]');
            if (input) input.value = t;
            // Also try the callback
            if (window.turnstile?.getResponse) {
              try { window.turnstile.execute(); } catch {}
            }
          }, token);
        } else if (captchaInfo.type === "hcaptcha") {
          await page.evaluate((t) => {
            const textarea = document.querySelector('[name="h-captcha-response"]') ||
                             document.querySelector('textarea[name*="hcaptcha"]');
            if (textarea) textarea.value = t;
            // Trigger callback
            if (window.hcaptcha) {
              try { window.hcaptcha.execute(); } catch {}
            }
          }, token);
        } else {
          // reCAPTCHA v2/v3
          await page.evaluate((t) => {
            const textarea = document.querySelector('#g-recaptcha-response') ||
                             document.querySelector('textarea[name="g-recaptcha-response"]');
            if (textarea) {
              textarea.value = t;
              textarea.style.display = "block"; // Some sites check visibility
            }
            // Trigger callback
            if (window.___grecaptcha_cfg?.clients) {
              for (const client of Object.values(window.___grecaptcha_cfg.clients)) {
                try {
                  const callback = Object.values(client).find(v => typeof v?.callback === "function");
                  if (callback) callback.callback(t);
                } catch {}
              }
            }
          }, token);
        }

        await sleep(1000);
        return true;
      }

      if (resultData.status === "failed" || resultData.errorId !== 0) {
        console.log(`  CapSolver failed: ${resultData.errorDescription || "unknown error"}`);
        return false;
      }
    }

    console.log("  CapSolver timeout (120s)");
    return false;
  } catch (e) {
    console.log(`  CapSolver error: ${e.message}`);
    return false;
  }
}

// ─── TOTP 2FA automation ──────────────────────────────────────────────

function generateTOTP(secret) {
  const totp = new TOTP({
    secret,
    digits: 6,
    period: 30,
    algorithm: "SHA1",
  });
  return totp.generate();
}

async function handle2FA(page, slug, authConfig = {}) {
  // Detect 2FA/MFA prompt
  const totpSelectors = authConfig.selectors?.totp
    ? [authConfig.selectors.totp]
    : [
        'input[name*="otp"]', 'input[name*="mfa"]', 'input[name*="2fa"]',
        'input[name*="totp"]', 'input[placeholder*="code"]',
        'input[placeholder*="Code"]', 'input[autocomplete="one-time-code"]',
        'input[inputmode="numeric"][maxlength="6"]',
      ];

  let totpField = null;
  for (const sel of totpSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      totpField = el;
      break;
    }
  }

  if (!totpField) return true; // No 2FA prompt — we're good

  console.log("  2FA/TOTP prompt detected");

  // Load TOTP secret from credentials
  const creds = loadCredentials(slug);
  if (!creds?.totpSecret) {
    console.log("  No TOTP secret stored — cannot auto-complete 2FA");
    return false;
  }

  const code = generateTOTP(creds.totpSecret);
  console.log(`  Generated TOTP code: ${code.slice(0, 2)}****`);

  await totpField.fill(code);
  await sleep(500);

  // Submit the 2FA form
  const submitSelectors = authConfig.selectors?.totpSubmit
    ? [authConfig.selectors.totpSubmit]
    : ['button[type="submit"]', 'button:has-text("Verify")', 'button:has-text("Submit")', 'button:has-text("Continue")', 'button:has-text("Confirm")'];

  for (const sel of submitSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        break;
      }
    } catch {}
  }

  await sleep(3000);
  return true;
}

// ─── Auth health check ────────────────────────────────────────────────

async function checkAuthHealth(page, slug, authConfig = {}) {
  const url = page.url();

  // Check 1: URL contains login/signin path → session expired
  const loginPaths = ["/login", "/signin", "/sign-in", "/auth", "/accounts/login"];
  for (const lp of loginPaths) {
    if (url.toLowerCase().includes(lp)) {
      return { authenticated: false, reason: `Redirected to login page: ${url}` };
    }
  }

  // Check 2: Login form visible on current page
  const loginFormVisible = await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
  if (loginFormVisible) {
    return { authenticated: false, reason: "Login form visible (password field detected)" };
  }

  // Check 3: Per-app success indicators from auth-config.json
  if (authConfig.successIndicators?.length > 0) {
    for (const selector of authConfig.successIndicators) {
      const found = await page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false);
      if (found) {
        return { authenticated: true };
      }
    }
    return { authenticated: false, reason: "No success indicators found" };
  }

  // Check 4: Generic authenticated UI elements
  const authIndicators = [
    '[data-testid="user-menu"]',
    '[data-testid="account-menu"]',
    'button:has-text("Deposit")',
    'button:has-text("Withdraw")',
    'a:has-text("Portfolio")',
    'a:has-text("Dashboard")',
    '[class*="avatar"]',
    '[class*="user-icon"]',
    '[class*="account"]',
  ];

  for (const selector of authIndicators) {
    const found = await page.locator(selector).first().isVisible({ timeout: 1000 }).catch(() => false);
    if (found) {
      return { authenticated: true };
    }
  }

  // If no strong signal either way, assume OK (profile may have valid cookies)
  return { authenticated: true, reason: "No login redirect detected (assuming authenticated)" };
}

// ─── Auto-relogin ─────────────────────────────────────────────────────

async function attemptReauth(context, page, slug, authConfig = {}) {
  const creds = loadCredentials(slug);
  if (!creds || !creds.username || !creds.password) {
    console.log("  No stored credentials — skipping auto-relogin");
    return false;
  }

  console.log("  Attempting auto-relogin...");

  // Navigate to login URL if specified
  if (authConfig.loginUrl) {
    try {
      await page.goto(authConfig.loginUrl, { waitUntil: "networkidle", timeout: 15000 });
      await sleep(2000);
    } catch {}
  }

  // Generic username/email selectors (per-app override takes priority)
  const userSelectors = authConfig.selectors?.username
    ? [authConfig.selectors.username]
    : ['input[type="email"]', 'input[name="email"]', 'input[name="username"]', 'input[name="login"]', 'input[autocomplete="username"]'];

  const passSelectors = authConfig.selectors?.password
    ? [authConfig.selectors.password]
    : ['input[type="password"]', 'input[name="password"]'];

  const submitSelectors = authConfig.selectors?.submit
    ? [authConfig.selectors.submit]
    : ['button[type="submit"]', 'button:has-text("Log In")', 'button:has-text("Login")', 'button:has-text("Sign In")', 'button:has-text("Sign in")', 'button:has-text("Continue")'];

  // Fill username
  let userFilled = false;
  for (const sel of userSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.fill(creds.username);
        userFilled = true;
        break;
      }
    } catch {}
  }
  if (!userFilled) {
    console.log("  Could not find username field");
    return false;
  }

  // Detect and solve CAPTCHA if present
  const captchaInfo = await detectCaptcha(page);
  if (captchaInfo) {
    const solved = await solveCaptcha(page, captchaInfo);
    if (!solved) {
      console.log("  CAPTCHA could not be solved — falling through to human");
      return false;
    }
  }

  // Try to fill password on same page (single-step login)
  let passFilled = false;
  for (const sel of passSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(creds.password);
        passFilled = true;
        break;
      }
    } catch {}
  }

  // If no password field, might be two-step login — submit username first
  if (!passFilled) {
    for (const sel of submitSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 })) {
          await el.click();
          await sleep(3000);
          break;
        }
      } catch {}
    }

    // CAPTCHA might appear between username and password steps
    const midCaptcha = await detectCaptcha(page);
    if (midCaptcha) {
      const solved = await solveCaptcha(page, midCaptcha);
      if (!solved) return false;
      await sleep(2000);
    }

    // Now look for password field on second step
    for (const sel of passSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.fill(creds.password);
          passFilled = true;
          break;
        }
      } catch {}
    }
  }

  if (!passFilled) {
    console.log("  Could not find password field");
    return false;
  }

  // Submit
  for (const sel of submitSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click();
        break;
      }
    } catch {}
  }

  await sleep(5000);

  // Handle 2FA/TOTP if prompted
  const twoFAOk = await handle2FA(page, slug, authConfig);
  if (!twoFAOk) {
    console.log("  2FA could not be completed — falling through to human");
    return false;
  }
  await sleep(2000);

  // Verify login succeeded
  const health = await checkAuthHealth(page, slug, authConfig);
  if (health.authenticated) {
    console.log("  Auto-relogin succeeded!");
    return true;
  }

  console.log(`  Auto-relogin failed: ${health.reason}`);
  return false;
}

// ─── Human-in-the-loop fallback ───────────────────────────────────────

async function humanInTheLoop(context, page, slug, targetUrl) {
  console.log("\n  Manual login required. Opening headed browser...");

  // Close the headless context — profile is persisted on disk
  await context.close();

  // Re-open same profile in headed mode
  const { context: headedCtx } = await launchWithProfile(slug, { headed: true });
  const headedPage = headedCtx.pages()[0] || await headedCtx.newPage();

  try {
    await headedPage.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch {}

  // macOS desktop notification
  try {
    execFileSync("osascript", ["-e", `display notification "Login required for ${slug}" with title "Darkscreen Crawler" sound name "Ping"`]);
  } catch {}

  console.log("  Browser opened — please log in manually.");
  console.log("  Waiting for successful authentication (5 min timeout)...\n");

  // Poll for auth success
  const authConfig = loadAuthConfig(slug);
  const deadline = Date.now() + 5 * 60 * 1000;
  let authenticated = false;

  while (Date.now() < deadline) {
    await sleep(3000);
    try {
      const health = await checkAuthHealth(headedPage, slug, authConfig);
      if (health.authenticated) {
        // Double-check it's not a false positive from the login page itself
        const url = headedPage.url();
        const onLogin = ["/login", "/signin", "/sign-in", "/auth"].some((p) => url.toLowerCase().includes(p));
        if (!onLogin) {
          authenticated = true;
          break;
        }
      }
    } catch {}
  }

  if (!authenticated) {
    console.log("  Timeout — manual login not detected. Skipping this app.");
    await headedCtx.close();
    return null;
  }

  console.log("  Login detected! Closing headed browser...");

  // Prompt to save credentials for future auto-relogin
  await promptSaveCredentials(slug);

  // Close headed context (profile auto-persists)
  await headedCtx.close();
  await sleep(1000);

  // Re-open headless for crawling
  const { context: crawlCtx } = await launchWithProfile(slug);
  return crawlCtx;
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
  const walletOpts = {
    headless: false, // Extensions require headed mode
    args: [
      `--disable-extensions-except=${METAMASK_EXT_DIR}`,
      `--load-extension=${METAMASK_EXT_DIR}`,
      "--disable-blink-features=AutomationControlled",
    ],
    viewport: ACTIVE_DEVICE.viewport,
    deviceScaleFactor: ACTIVE_DEVICE.deviceScaleFactor,
    isMobile: ACTIVE_DEVICE.isMobile,
    hasTouch: ACTIVE_DEVICE.hasTouch,
    userAgent: BROWSER_USER_AGENT,
    locale: BROWSER_LOCALE,
    timezoneId: BROWSER_TIMEZONE,
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    ignoreHTTPSErrors: true,
  };
  if (PROXY_SERVER) walletOpts.proxy = { server: PROXY_SERVER };

  const context = await chromium.launchPersistentContext(METAMASK_PROFILE, walletOpts);

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
  const deviceSuffix = ACTIVE_DEVICE.name === "desktop" ? "" : `-${ACTIVE_DEVICE.name}`;
  const filename = `${slug}-raw${deviceSuffix}-${String(idx).padStart(3, "0")}.png`;
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
  const viewportH = ACTIVE_DEVICE.viewport.height;
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

// ─── Metadata extraction (zero API cost) ─────────────────────────────────

async function extractPageCopy(page) {
  try {
    return await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.innerText?.trim() || null;
      const metaDesc = document.querySelector('meta[name="description"]')?.content || null;
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content || null;
      const heroArea = document.querySelector('main, [role="main"], section:first-of-type') || document.body;
      const ctas = [...heroArea.querySelectorAll('a, button')]
        .map(el => el.innerText?.trim())
        .filter(t => t && t.length > 1 && t.length < 80)
        .slice(0, 10);
      const navItems = [...new Set(
        [...document.querySelectorAll('nav a, header a, [role="navigation"] a')]
          .map(el => el.innerText?.trim())
          .filter(t => t && t.length > 1 && t.length < 50)
      )];
      return { h1, metaDescription: metaDesc, ogTitle, ogDescription: ogDesc, ctas, navItems };
    });
  } catch (e) {
    console.log(`  ⚠ Copy extraction failed: ${e.message}`);
    return null;
  }
}

async function detectTechStack(page) {
  try {
    return await page.evaluate(() => {
      const stack = [];

      // Frameworks
      if (document.querySelector('#__next') || window.__NEXT_DATA__) stack.push({ category: 'Framework', name: 'Next.js', evidence: '__NEXT_DATA__ or #__next' });
      else if (window.__NUXT__) stack.push({ category: 'Framework', name: 'Nuxt.js', evidence: '__NUXT__' });
      else if (window.___gatsby) stack.push({ category: 'Framework', name: 'Gatsby', evidence: '___gatsby' });
      if (document.querySelector('[data-reactroot], [data-reactid]') || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) stack.push({ category: 'Framework', name: 'React', evidence: 'React markers' });
      if (window.__VUE__) stack.push({ category: 'Framework', name: 'Vue.js', evidence: '__VUE__' });
      if (document.querySelector('[ng-version], [_ngcontent]')) stack.push({ category: 'Framework', name: 'Angular', evidence: 'ng-version attribute' });

      // CSS
      const allClasses = document.body.innerHTML;
      if (allClasses.match(/\b(sm:|md:|lg:|xl:)/)) stack.push({ category: 'CSS', name: 'Tailwind CSS', evidence: 'Responsive utility classes' });
      if (document.querySelector('.bootstrap, [class*="col-md-"], [class*="col-lg-"]')) stack.push({ category: 'CSS', name: 'Bootstrap', evidence: 'Bootstrap grid classes' });
      if (document.querySelector('[class*="chakra-"]')) stack.push({ category: 'CSS', name: 'Chakra UI', evidence: 'chakra- class prefix' });
      if (document.querySelector('[class*="MuiBox"], [class*="MuiButton"]')) stack.push({ category: 'CSS', name: 'Material UI', evidence: 'Mui class prefix' });

      // Analytics
      const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src);
      const allScriptSrc = scripts.join(' ');
      if (window.analytics || allScriptSrc.includes('segment')) stack.push({ category: 'Analytics', name: 'Segment', evidence: 'analytics.js or segment script' });
      if (window.mixpanel || allScriptSrc.includes('mixpanel')) stack.push({ category: 'Analytics', name: 'Mixpanel', evidence: 'mixpanel object or script' });
      if (window.ga || window.gtag || allScriptSrc.includes('google-analytics') || allScriptSrc.includes('gtag')) stack.push({ category: 'Analytics', name: 'Google Analytics', evidence: 'ga/gtag' });
      if (window.hj || allScriptSrc.includes('hotjar')) stack.push({ category: 'Analytics', name: 'Hotjar', evidence: 'hj or hotjar script' });
      if (window.amplitude || allScriptSrc.includes('amplitude')) stack.push({ category: 'Analytics', name: 'Amplitude', evidence: 'amplitude object or script' });
      if (window.FS || allScriptSrc.includes('fullstory')) stack.push({ category: 'Analytics', name: 'FullStory', evidence: 'FS object or script' });
      if (window.DD_RUM || allScriptSrc.includes('datadoghq')) stack.push({ category: 'Analytics', name: 'Datadog', evidence: 'DD_RUM or datadog script' });

      // Error tracking
      if (window.__SENTRY__ || allScriptSrc.includes('sentry')) stack.push({ category: 'Error Tracking', name: 'Sentry', evidence: '__SENTRY__ or sentry script' });

      // Support
      if (window.Intercom || allScriptSrc.includes('intercom')) stack.push({ category: 'Support', name: 'Intercom', evidence: 'Intercom widget' });

      // Wallets
      if (window.ethereum) stack.push({ category: 'Wallet', name: 'Ethereum (window.ethereum)', evidence: 'window.ethereum injected' });
      if (window.solana) stack.push({ category: 'Wallet', name: 'Solana (window.solana)', evidence: 'window.solana injected' });
      if (window.nostr) stack.push({ category: 'Wallet', name: 'Nostr (window.nostr)', evidence: 'window.nostr injected' });

      // CDN/Hosting
      const metaGenerator = document.querySelector('meta[name="generator"]')?.content || '';
      if (metaGenerator.includes('Vercel') || document.cookie.includes('__vercel')) stack.push({ category: 'CDN', name: 'Vercel', evidence: 'Vercel meta or cookie' });

      // Cookie consent
      if (document.querySelector('#onetrust-banner-sdk') || allScriptSrc.includes('onetrust')) stack.push({ category: 'Privacy', name: 'OneTrust', evidence: 'OneTrust banner' });
      if (document.querySelector('#CookiebotWidget') || allScriptSrc.includes('cookiebot')) stack.push({ category: 'Privacy', name: 'Cookiebot', evidence: 'Cookiebot widget' });

      return stack;
    });
  } catch (e) {
    console.log(`  ⚠ Tech stack detection failed: ${e.message}`);
    return [];
  }
}

async function capturePerformance(page) {
  try {
    return await page.evaluate(() => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

      const resources = performance.getEntriesByType('resource');
      let jsSize = 0, cssSize = 0, imageSize = 0, fontSize = 0, otherSize = 0;

      for (const r of resources) {
        const size = r.transferSize || 0;
        if (r.initiatorType === 'script' || r.name.match(/\.js(\?|$)/i)) jsSize += size;
        else if (r.initiatorType === 'css' || r.name.match(/\.css(\?|$)/i)) cssSize += size;
        else if (r.initiatorType === 'img' || r.name.match(/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?|$)/i)) imageSize += size;
        else if (r.name.match(/\.(woff2?|ttf|otf|eot)(\?|$)/i)) fontSize += size;
        else otherSize += size;
      }

      const totalTransfer = jsSize + cssSize + imageSize + fontSize + otherSize;

      return {
        loadTime: Math.max(0, loadTime),
        domContentLoaded: Math.max(0, domContentLoaded),
        lcp: typeof window.__DS_LCP === 'number' ? Math.round(window.__DS_LCP) : null,
        cls: typeof window.__DS_CLS === 'number' ? Math.round(window.__DS_CLS * 1000) / 1000 : null,
        resourceCount: resources.length,
        transferSize: totalTransfer,
        breakdown: {
          js: jsSize,
          css: cssSize,
          images: imageSize,
          fonts: fontSize,
          other: otherSize,
        },
      };
    });
  } catch (e) {
    console.log(`  ⚠ Performance capture failed: ${e.message}`);
    return null;
  }
}

// ─── Main crawl function ─────────────────────────────────────────────

async function crawlApp(slug, startUrl, appAuthType = "public") {
  const isLoginApp = appAuthType === "login";
  const hasAuth = isLoginApp ? hasProfile(slug) : hasSession(slug);
  const authMode = WALLET_MODE ? "WALLET" : isLoginApp ? "PROFILE" : hasAuth ? "SESSION" : "PUBLIC";
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Crawling: ${slug} — ${startUrl} [${authMode}] [${ACTIVE_DEVICE.name}]`);
  console.log(`  Mode: Deterministic (zero API cost)`);
  console.log(`  Limits: ${MAX_PAGES} pages, ${MAX_SCREENSHOTS} screenshots`);
  console.log(`${"═".repeat(60)}\n`);

  // Legacy session deprecation warning
  if (isLoginApp && hasSession(slug)) {
    console.log("  ⚠ Legacy session file detected. Persistent profiles are now used instead.");
    console.log(`    Old session: ${sessionPath(slug)}`);
    console.log("    You can delete it — profile-based auth is more reliable.\n");
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
    page = context.pages()[0] || await context.newPage();
  } else if (isLoginApp) {
    // Login apps: use persistent profile (cookies, IndexedDB, etc. survive)
    const result = await launchWithProfile(slug);
    context = result.context;
    browser = result.browser;
    page = context.pages()[0] || await context.newPage();
  } else {
    // Public apps: ephemeral browser
    const launchOpts = {
      headless: !HEADED,
      args: ["--disable-blink-features=AutomationControlled"],
    };
    if (PROXY_SERVER) launchOpts.proxy = { server: PROXY_SERVER };

    browser = await chromium.launch(launchOpts);

    context = await browser.newContext({
      viewport: ACTIVE_DEVICE.viewport,
      deviceScaleFactor: ACTIVE_DEVICE.deviceScaleFactor,
      isMobile: ACTIVE_DEVICE.isMobile,
      hasTouch: ACTIVE_DEVICE.hasTouch,
      userAgent: BROWSER_USER_AGENT,
      locale: BROWSER_LOCALE,
      timezoneId: BROWSER_TIMEZONE,
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();
  }

  page.setDefaultTimeout(10000);

  const visited = new Set();

  // Load legacy session cookies for non-login, non-wallet apps that have sessions
  if (hasSession(slug) && !WALLET_MODE && !isLoginApp) {
    const session = JSON.parse(readFileSync(sessionPath(slug), "utf-8"));
    if (session.cookies?.length > 0) await context.addCookies(session.cookies);
  }

  // Register performance observers before navigation
  try {
    await page.evaluateOnNewDocument(() => {
      window.__DS_LCP = 0;
      window.__DS_CLS = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__DS_LCP = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__DS_CLS += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
  } catch {}

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

  // Auth health check + recovery cascade for login apps
  if (isLoginApp && hasProfile(slug) && !args["no-reauth"]) {
    const authConfig = loadAuthConfig(slug);
    const health = await checkAuthHealth(page, slug, authConfig);

    if (!health.authenticated) {
      console.log(`  ⚠ Auth check failed: ${health.reason}`);

      // Recovery cascade: auto-relogin → human-in-the-loop → skip
      let recovered = false;

      // Step 1: Try auto-relogin
      recovered = await attemptReauth(context, page, slug, authConfig);

      // Step 2: Human-in-the-loop fallback
      if (!recovered) {
        const newCtx = await humanInTheLoop(context, page, slug, startUrl);
        if (newCtx) {
          context = newCtx;
          page = context.pages()[0] || await context.newPage();
          page.setDefaultTimeout(10000);
          try {
            await page.goto(startUrl, { waitUntil: "networkidle", timeout: 30000 });
            await sleep(2000);
          } catch {}
          recovered = true;
        }
      }

      if (!recovered) {
        console.log(`  Skipping ${slug} — could not authenticate.`);
        if (browser) await browser.close();
        else await context.close();
        return null;
      }
    } else {
      console.log("  Auth check passed");
    }
  }

  // Legacy session storage injection for non-profile apps
  if (hasSession(slug) && !WALLET_MODE && !isLoginApp) {
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

  // ── Extract page metadata (zero API cost) ──────────────────────────────
  console.log("\n  Extracting page metadata...");
  const landingPageCopy = await extractPageCopy(page);
  if (landingPageCopy) console.log(`    Copy: h1="${landingPageCopy.h1 || '(none)'}", ${landingPageCopy.ctas.length} CTAs`);

  const detectedTechStack = await detectTechStack(page);
  console.log(`    Tech stack: ${detectedTechStack.length} technologies detected`);

  const perfData = await capturePerformance(page);
  if (perfData) console.log(`    Performance: ${perfData.loadTime}ms load, ${perfData.resourceCount} resources`);

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
  const authenticated = WALLET_MODE || isLoginApp || hasSession(slug);
  await probeCommonPaths(page, slug, startUrl, visited, authenticated);

  // ── Save raw manifest ────────────────────────────────────────────
  const deviceSuffix = ACTIVE_DEVICE.name === "desktop" ? "" : `-${ACTIVE_DEVICE.name}`;
  const rawManifest = {
    slug,
    url: startUrl,
    device: ACTIVE_DEVICE.name,
    viewport: ACTIVE_DEVICE.viewport,
    crawledAt: new Date().toISOString(),
    totalScreenshots: screenshots.length,
    pageCopy: landingPageCopy || null,
    techStack: detectedTechStack || [],
    performance: perfData || null,
    screens: [...screenshots],
  };

  const outPath = resolve(SCREENSHOT_DIR, `${slug}-raw${deviceSuffix}.json`);
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
  console.log("  Browser will open with persistent profile. Log in manually, then press Enter.\n");

  // Use persistent profile — all cookies, IndexedDB, service workers auto-persist
  const { context } = await launchWithProfile(slug, { headed: true });
  const page = context.pages()[0] || await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  await waitForEnter(">> Log in to the app, then press ENTER to start crawling... ");

  // Prompt to save credentials for future auto-relogin
  await promptSaveCredentials(slug);

  // Close headed context — profile auto-persists on close
  await context.close();
  console.log("  Profile saved! Starting crawl...\n");

  // Re-open headless for crawling
  const targetUrl = crawlUrl || startUrl;
  await crawlApp(slug, targetUrl, "login");
}

// ─── Entry point ─────────────────────────────────────────────────────

async function main() {
  // Resolve app data from apps.ts if slug is provided
  const allApps = loadApps();
  const appData = args.slug ? allApps.find((a) => a.slug === args.slug) : null;
  const appAuthType = appData?.authType || "public";

  // --check-auth: diagnostic mode — check auth health without crawling
  if (args["check-auth"]) {
    if (!args.slug) {
      console.error("Usage: node scripts/crawl-app.mjs --check-auth --slug <slug>");
      process.exit(1);
    }
    if (!hasProfile(args.slug)) {
      console.log(`  No profile exists for ${args.slug}. Run --login first.`);
      process.exit(0);
    }
    const { context } = await launchWithProfile(args.slug);
    const page = context.pages()[0] || await context.newPage();
    const checkUrl = args["app-url"] || appData?.appUrl || args.url || appData?.url;
    if (!checkUrl) {
      console.error(`App "${args.slug}" not found in apps.ts. Provide --url.`);
      process.exit(1);
    }
    try {
      await page.goto(checkUrl, { waitUntil: "networkidle", timeout: 30000 });
      await sleep(2000);
    } catch {}
    const authConfig = loadAuthConfig(args.slug);
    const health = await checkAuthHealth(page, args.slug, authConfig);
    console.log(`  Auth health for ${args.slug}: ${health.authenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED"}`);
    if (health.reason) console.log(`  Reason: ${health.reason}`);
    await context.close();
    process.exit(0);
  }

  // --login or --relogin: open browser for manual login, then crawl
  if (args.login || args.relogin) {
    if (!args.slug) {
      console.error("Usage: node scripts/crawl-app.mjs --login --slug <slug> [--url <url>] [--app-url <url>]");
      process.exit(1);
    }
    // Skip login if profile exists and not --relogin
    if (args.login && !args.relogin && hasProfile(args.slug)) {
      console.log(`  Profile exists for ${args.slug}. Use --relogin to force new login.`);
      console.log("  Starting crawl with existing profile...\n");
      const crawlUrl = args["app-url"] || (appData && appData.appUrl) || args.url || (appData && appData.url);
      if (!crawlUrl) {
        console.error(`App "${args.slug}" not found in apps.ts. Provide --url.`);
        process.exit(1);
      }
      return crawlApp(args.slug, crawlUrl, "login");
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
    console.log(`\nCrawling all ${allApps.length} apps...\n`);
    const results = { success: [], failed: [], skipped: [] };
    const startTime = Date.now();

    for (const app of allApps) {
      // Skip wallet apps unless --wallet is set
      if (app.authType === "wallet" && !WALLET_MODE) {
        console.log(`  Skipping ${app.slug} (wallet app — use --wallet)`);
        results.skipped.push({ slug: app.slug, reason: "wallet mode required" });
        continue;
      }

      // For login apps, use appUrl if profile exists
      const crawlUrl = (app.authType === "login" && hasProfile(app.slug) && app.appUrl)
        ? app.appUrl : app.url;

      try {
        const manifest = await crawlApp(app.slug, crawlUrl, app.authType);
        if (manifest) {
          results.success.push({ slug: app.slug, screenshots: manifest.totalScreenshots });
        } else {
          results.failed.push({ slug: app.slug, reason: "crawl returned null" });
        }
      } catch (e) {
        console.error(`  Failed ${app.slug}: ${e.message}`);
        results.failed.push({ slug: app.slug, reason: e.message });
      }
    }

    // Summary report
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n${"═".repeat(60)}`);
    console.log("  CRAWL REPORT");
    console.log(`${"═".repeat(60)}`);
    console.log(`  Total time: ${elapsed} min`);
    console.log(`  Success: ${results.success.length} apps`);
    console.log(`  Failed:  ${results.failed.length} apps`);
    console.log(`  Skipped: ${results.skipped.length} apps`);
    if (results.failed.length > 0) {
      console.log("\n  Failures:");
      for (const f of results.failed) {
        console.log(`    - ${f.slug}: ${f.reason}`);
      }
    }
    console.log(`${"═".repeat(60)}\n`);

    // Write report JSON
    const reportPath = resolve(PROJECT_ROOT, "scripts/crawl-report.json");
    writeFileSync(reportPath, JSON.stringify({ ...results, elapsed, timestamp: new Date().toISOString() }, null, 2));
    console.log(`  Report saved: ${reportPath}`);
  } else if (args.slug) {
    // Determine the URL: CLI --url > --app-url > appData.appUrl (when auth) > appData.url
    let crawlUrl = args.url;
    if (!crawlUrl && appData) {
      if ((WALLET_MODE || (appAuthType === "login" && hasProfile(args.slug))) && appData.appUrl) {
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
    await crawlApp(args.slug, crawlUrl, appAuthType);
  } else {
    console.error("Darkscreen Deterministic Crawler");
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
    console.error("  --check-auth          Check auth health without crawling");
    console.error("  --save-creds          Prompt to save credentials during login");
    console.error("  --mobile              Emulate iPhone 15 Pro (393x852)");
    console.error("  --tablet              Emulate iPad Pro (1024x1366)");
    console.error("  --device <name>       Device preset (iphone-15-pro, pixel-8, ipad-pro)");
    console.error("  --no-reauth           Skip auto-relogin, crawl with whatever state");
    console.error("  --proxy <url>         Proxy server (e.g. http://us-proxy:8080)");
    console.error("  --max-pages <n>       Max pages to visit (default: 50, 100 with auth)");
    console.error("  --max-screenshots <n> Max screenshots (default: 80)");
    console.error("\n  Env vars:");
    console.error("  CAPSOLVER_API_KEY     CapSolver API key for automated CAPTCHA solving");
    console.error("  DARKSCREEN_PROXY      Default proxy (overridden by --proxy)");
    console.error("  DARKSCREEN_CRED_KEY   Passphrase for encrypting stored credentials\n");
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
