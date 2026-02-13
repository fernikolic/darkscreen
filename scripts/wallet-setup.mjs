#!/usr/bin/env node

/**
 * MetaMask Wallet Setup for Authenticated Crawling
 *
 * Downloads a pinned version of MetaMask, launches a persistent browser context
 * with the extension loaded, and guides the user through wallet import.
 * The resulting profile is saved so crawl-app.mjs --wallet can reuse it.
 *
 * Usage:
 *   node scripts/wallet-setup.mjs                  # Interactive setup
 *   node scripts/wallet-setup.mjs --check           # Verify existing profile
 *   node scripts/wallet-setup.mjs --reset           # Delete profile and redo setup
 */

import { chromium } from "playwright";
import { mkdirSync, existsSync, rmSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { createInterface } from "readline";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WALLETS_DIR = resolve(__dirname, "wallets");
const METAMASK_PROFILE = resolve(WALLETS_DIR, "metamask-profile");
const METAMASK_EXT_DIR = resolve(WALLETS_DIR, "metamask-extension");
const METAMASK_META = resolve(WALLETS_DIR, "metamask-meta.json");

// Pinned MetaMask version for reproducibility
const METAMASK_VERSION = "12.8.1";
const METAMASK_CRX_URL = `https://github.com/nicedoc/metamask-releases/raw/main/metamask-chrome-${METAMASK_VERSION}.crx`;

const { values: args } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    reset: { type: "boolean", default: false },
  },
  strict: false,
});

function waitForEnter(prompt) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      res();
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Download MetaMask extension ──────────────────────────────────────

async function downloadMetaMask() {
  if (existsSync(METAMASK_EXT_DIR)) {
    console.log(`  MetaMask extension already downloaded at ${METAMASK_EXT_DIR}`);
    return;
  }

  console.log(`  Downloading MetaMask v${METAMASK_VERSION}...`);
  mkdirSync(WALLETS_DIR, { recursive: true });

  const crxPath = resolve(WALLETS_DIR, "metamask.crx");
  const zipPath = resolve(WALLETS_DIR, "metamask.zip");

  // Download CRX
  const response = await fetch(METAMASK_CRX_URL);
  if (!response.ok) {
    throw new Error(`Failed to download MetaMask: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(crxPath, buffer);
  console.log(`  Downloaded CRX (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

  // CRX files are ZIP files with a header — strip it to extract
  // CRX3 header: magic (4) + version (4) + header_length (4) + header (variable)
  const magic = buffer.toString("ascii", 0, 4);
  let zipStart = 0;

  if (magic === "Cr24") {
    // CRX3 format
    const headerLen = buffer.readUInt32LE(8);
    zipStart = 12 + headerLen;
  }

  const zipBuffer = buffer.subarray(zipStart);
  writeFileSync(zipPath, zipBuffer);

  // Extract using unzip
  mkdirSync(METAMASK_EXT_DIR, { recursive: true });
  try {
    execFileSync("unzip", ["-qo", zipPath, "-d", METAMASK_EXT_DIR], { stdio: "pipe" });
  } catch (e) {
    // unzip sometimes exits with 1 for warnings, check if files were extracted
    if (!existsSync(resolve(METAMASK_EXT_DIR, "manifest.json"))) {
      throw new Error(`Failed to extract MetaMask: ${e.message}`);
    }
  }

  // Clean up temp files
  rmSync(crxPath, { force: true });
  rmSync(zipPath, { force: true });

  console.log(`  Extracted to ${METAMASK_EXT_DIR}`);
}

// ─── Profile check ────────────────────────────────────────────────────

function checkProfile() {
  if (!existsSync(METAMASK_PROFILE)) {
    console.log("  No MetaMask profile found. Run without --check to set up.");
    return false;
  }

  if (!existsSync(METAMASK_META)) {
    console.log("  Profile exists but no metadata. May need re-setup.");
    return false;
  }

  const meta = JSON.parse(readFileSync(METAMASK_META, "utf-8"));
  console.log(`  Profile found:`);
  console.log(`    Created: ${meta.createdAt}`);
  console.log(`    MetaMask: v${meta.metamaskVersion}`);
  console.log(`    Path: ${METAMASK_PROFILE}`);
  return true;
}

// ─── Interactive setup ────────────────────────────────────────────────

async function setupWallet() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  MetaMask Wallet Setup");
  console.log("══════════════════════════════════════════════════════════════\n");

  // Step 1: Download extension
  console.log("Step 1: Download MetaMask extension");
  await downloadMetaMask();

  // Step 2: Launch browser with extension
  console.log("\nStep 2: Launch browser with MetaMask");
  mkdirSync(METAMASK_PROFILE, { recursive: true });

  const context = await chromium.launchPersistentContext(METAMASK_PROFILE, {
    headless: false,
    args: [
      `--disable-extensions-except=${METAMASK_EXT_DIR}`,
      `--load-extension=${METAMASK_EXT_DIR}`,
      "--disable-blink-features=AutomationControlled",
    ],
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  console.log("  Browser launched with MetaMask extension.");
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log("  INSTRUCTIONS:");
  console.log("  1. MetaMask onboarding should open automatically");
  console.log("     (If not, click the MetaMask puzzle icon in the toolbar)");
  console.log("  2. Choose 'Import an existing wallet'");
  console.log("  3. Enter your TEST wallet seed phrase");
  console.log("     ⚠ Use a TEST wallet only — never your main wallet");
  console.log("  4. Set a password for the extension");
  console.log("  5. Complete the setup");
  console.log("──────────────────────────────────────────────────────────────\n");

  // Wait for MetaMask to open its onboarding tab
  await sleep(3000);

  // Find MetaMask onboarding page
  const pages = context.pages();
  const mmPage = pages.find((p) => p.url().includes("chrome-extension://"));
  if (mmPage) {
    console.log(`  MetaMask tab detected: ${mmPage.url()}`);
  } else {
    console.log("  Waiting for MetaMask onboarding tab...");
    await sleep(5000);
  }

  await waitForEnter(">> Complete MetaMask setup in the browser, then press ENTER... ");

  // Step 3: Verify MetaMask is set up
  console.log("\nStep 3: Verifying setup...");

  // Try navigating to a DApp to verify MetaMask responds
  const testPage = context.pages()[0] || await context.newPage();
  await testPage.goto("https://app.uniswap.org", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await sleep(3000);

  console.log("  Profile saved to: " + METAMASK_PROFILE);

  // Save metadata
  writeFileSync(
    METAMASK_META,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        metamaskVersion: METAMASK_VERSION,
        profilePath: METAMASK_PROFILE,
        extensionPath: METAMASK_EXT_DIR,
      },
      null,
      2,
    ),
  );

  await context.close();

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  Setup complete!");
  console.log("  ");
  console.log("  Now crawl DeFi apps with wallet:");
  console.log("    node scripts/crawl-app.mjs --slug uniswap --wallet");
  console.log("    node scripts/crawl-app.mjs --slug aave --wallet");
  console.log("══════════════════════════════════════════════════════════════\n");
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  if (args.check) {
    checkProfile();
    return;
  }

  if (args.reset) {
    console.log("  Resetting MetaMask profile...");
    rmSync(METAMASK_PROFILE, { recursive: true, force: true });
    rmSync(METAMASK_META, { force: true });
    console.log("  Profile deleted. Run again to set up fresh.");
    return;
  }

  if (existsSync(METAMASK_META)) {
    console.log("  MetaMask profile already exists.");
    checkProfile();
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((res) => {
      rl.question("  Re-run setup? (y/N) ", (a) => {
        rl.close();
        res(a);
      });
    });
    if (answer.toLowerCase() !== "y") return;
  }

  await setupWallet();
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
