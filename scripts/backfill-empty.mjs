#!/usr/bin/env node

/**
 * Backfill empty public apps — identifies apps with no screenshots on disk
 * and runs the full pipeline (crawl → label → tag → sync) for each.
 *
 * Usage:
 *   node scripts/backfill-empty.mjs              # crawl all empty public apps
 *   node scripts/backfill-empty.mjs --dry-run    # preview what would be crawled
 *   node scripts/backfill-empty.mjs --slug argent # backfill a single app
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const APPS_FILE = resolve(PROJECT_ROOT, "src/data/apps.ts");
const SCREENSHOTS_DIR = resolve(PROJECT_ROOT, "public/screenshots");

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    slug: { type: "string" },
  },
  strict: false,
});

// ─── Load apps from apps.ts ─────────────────────────────────────────────

function loadApps() {
  const raw = readFileSync(APPS_FILE, "utf-8");
  const entries = [];
  const blockRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?accentColor:\s*"[^"]+"/g;
  let block;
  while ((block = blockRe.exec(raw)) !== null) {
    const text = block[0];
    const slug = block[1];
    const nameMatch = text.match(/name:\s*"([^"]+)"/);
    const authMatch = text.match(/authType:\s*"([^"]+)"/);
    const screenCountMatch = text.match(/screenCount:\s*(\d+)/);
    entries.push({
      slug,
      name: nameMatch?.[1] || slug,
      authType: authMatch?.[1] || "public",
      screenCount: parseInt(screenCountMatch?.[1] || "0", 10),
    });
  }
  return entries;
}

// ─── Check which apps have screenshots on disk ──────────────────────────

function hasScreenshotsOnDisk(slug) {
  try {
    const files = readdirSync(SCREENSHOTS_DIR);
    return files.some(
      (f) =>
        f.startsWith(`${slug}-`) &&
        f.endsWith(".png") &&
        !f.includes("-raw-")
    );
  } catch {
    return false;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

const allApps = loadApps();

// Find empty apps (no labeled screenshots on disk)
let empty = allApps.filter((app) => !hasScreenshotsOnDisk(app.slug));

// Filter to single slug if provided
if (args.slug) {
  empty = empty.filter((a) => a.slug === args.slug);
}

// Separate by auth type
const publicApps = empty.filter((a) => a.authType === "public");
const loginApps = empty.filter((a) => a.authType === "login");
const walletApps = empty.filter((a) => a.authType === "wallet");

console.log(`\nEmpty apps: ${empty.length} total`);
console.log(`  Public:  ${publicApps.length} (will crawl)`);
console.log(`  Login:   ${loginApps.length} (skipped — needs manual login)`);
console.log(`  Wallet:  ${walletApps.length} (skipped — needs wallet setup)\n`);

if (publicApps.length > 0) {
  console.log("Public apps to backfill:");
  for (const app of publicApps) {
    console.log(`  - ${app.name} (${app.slug})`);
  }
}

if (loginApps.length > 0) {
  console.log("\nLogin apps (manual crawl needed):");
  for (const app of loginApps) {
    console.log(`  - ${app.name} (${app.slug})`);
  }
}

if (walletApps.length > 0) {
  console.log("\nWallet apps (manual crawl needed):");
  for (const app of walletApps) {
    console.log(`  - ${app.name} (${app.slug})`);
  }
}

if (publicApps.length === 0) {
  console.log("\nNo empty public apps to backfill.");
  process.exit(0);
}

if (args["dry-run"]) {
  console.log("\nDRY RUN — would crawl the public apps listed above.");
  process.exit(0);
}

// ─── Crawl + Label each public app ──────────────────────────────────────

// Note: uses execFileSync (array args, no shell) — safe against injection.
// Same pattern as recrawl-stale.mjs.

const results = { success: [], failed: [] };

for (let i = 0; i < publicApps.length; i++) {
  const app = publicApps[i];
  console.log(`\n[${i + 1}/${publicApps.length}] Backfilling ${app.name}...`);

  const steps = [
    { label: "Crawling", cmd: "crawl-app.mjs", cmdArgs: ["--slug", app.slug] },
    { label: "Labeling", cmd: "label-local.mjs", cmdArgs: ["--slug", app.slug] },
  ];

  let ok = true;
  for (const step of steps) {
    try {
      console.log(`  ${step.label}...`);
      execFileSync("node", [resolve(__dirname, step.cmd), ...step.cmdArgs], {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
        timeout: 300000, // 5 min per step
      });
    } catch (err) {
      console.error(`  ${step.label} failed: ${err.message}`);
      ok = false;
      break;
    }
  }

  if (ok) {
    results.success.push(app.name);
  } else {
    results.failed.push(app.name);
  }
}

// ─── Post-processing: tag + sync all at once ────────────────────────────

if (results.success.length > 0) {
  console.log("\nRunning auto-tag for all new screens...");
  try {
    execFileSync("node", [resolve(__dirname, "auto-tag.mjs")], {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      timeout: 120000,
    });
  } catch (err) {
    console.error(`  auto-tag failed: ${err.message}`);
  }

  console.log("Syncing manifests to apps.ts...");
  try {
    execFileSync("node", [resolve(__dirname, "sync-manifests.mjs")], {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      timeout: 120000,
    });
  } catch (err) {
    console.error(`  sync-manifests failed: ${err.message}`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log("  Backfill complete:");
console.log(`    Success: ${results.success.length}`);
console.log(`    Failed:  ${results.failed.length}`);
console.log(`    Skipped: ${loginApps.length + walletApps.length} (login/wallet)`);

if (results.failed.length > 0) {
  console.log(`\n  Failed apps:`);
  for (const name of results.failed) {
    console.log(`    - ${name}`);
  }
}

if (loginApps.length + walletApps.length > 0) {
  console.log(`\n  Manual crawl needed:`);
  for (const app of [...loginApps, ...walletApps]) {
    const flag = app.authType === "login" ? "--login" : "--wallet";
    console.log(`    node scripts/crawl-app.mjs --slug ${app.slug} ${flag}`);
  }
}

console.log(`${"─".repeat(60)}`);
