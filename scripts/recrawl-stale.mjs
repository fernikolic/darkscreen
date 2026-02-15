#!/usr/bin/env node

/**
 * Re-crawl apps where lastUpdated is older than N days.
 *
 * Usage:
 *   node scripts/recrawl-stale.mjs --days 14
 *   node scripts/recrawl-stale.mjs --days 30 --dry-run
 *   node scripts/recrawl-stale.mjs --days 7 --category DeFi
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const APPS_FILE = resolve(PROJECT_ROOT, "src/data/apps.ts");

const { values: args } = parseArgs({
  options: {
    days: { type: "string", default: "14" },
    "dry-run": { type: "boolean", default: false },
    category: { type: "string" },
    slug: { type: "string" },
  },
  strict: false,
});

const MAX_AGE_DAYS = parseInt(args.days, 10);
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

// ─── Load apps ──────────────────────────────────────────────────────────

function loadApps() {
  const raw = readFileSync(APPS_FILE, "utf-8");
  const entries = [];
  const blockRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?accentColor:\s*"[^"]+"/g;
  let block;
  while ((block = blockRe.exec(raw)) !== null) {
    const text = block[0];
    const slug = block[1];
    const nameMatch = text.match(/name:\s*"([^"]+)"/);
    const dateMatch = text.match(/lastUpdated:\s*"([^"]+)"/);
    const catMatch = text.match(/category:\s*"([^"]+)"/);
    const authMatch = text.match(/authType:\s*"([^"]+)"/);
    const screenCountMatch = text.match(/screenCount:\s*(\d+)/);
    entries.push({
      slug,
      name: nameMatch?.[1] || slug,
      lastUpdated: dateMatch?.[1] || "2020-01-01",
      category: catMatch?.[1] || "",
      authType: authMatch?.[1] || "public",
      screenCount: parseInt(screenCountMatch?.[1] || "0", 10),
    });
  }
  return entries;
}

const allApps = loadApps();

// Filter stale apps
let stale = allApps.filter((app) => {
  if (app.screenCount === 0) return false;
  const updated = new Date(app.lastUpdated);
  return updated < cutoff;
});

if (args.category) {
  stale = stale.filter((a) => a.category === args.category);
}
if (args.slug) {
  stale = stale.filter((a) => a.slug === args.slug);
}

// Sort by stalest first
stale.sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());

console.log(`\nFound ${stale.length} stale apps (not updated in ${MAX_AGE_DAYS}+ days)\n`);

if (stale.length === 0) {
  console.log("Nothing to recrawl.");
  process.exit(0);
}

for (const app of stale) {
  const age = Math.floor((Date.now() - new Date(app.lastUpdated).getTime()) / 86400000);
  console.log(`  ${app.name.padEnd(20)} last updated: ${app.lastUpdated} (${age}d ago) [${app.authType}]`);
}

if (args["dry-run"]) {
  console.log("\nDRY RUN — would recrawl the apps above.");
  process.exit(0);
}

// ─── Recrawl ────────────────────────────────────────────────────────────

const results = { success: [], failed: [], skipped: [] };

for (let i = 0; i < stale.length; i++) {
  const app = stale[i];
  console.log(`\n  [${i + 1}/${stale.length}] Recrawling ${app.name}...`);

  // Skip authenticated apps that need manual intervention
  if (app.authType === "login") {
    console.log(`    SKIP: "${app.name}" requires login (use --login manually)`);
    results.skipped.push(app.name);
    continue;
  }

  const crawlArgs = ["--slug", app.slug];
  if (app.authType === "wallet") crawlArgs.push("--wallet");

  const steps = [
    { label: "Crawling", cmd: "crawl-app.mjs", args: crawlArgs },
    { label: "Labeling", cmd: "label-local.mjs", args: ["--slug", app.slug] },
    { label: "Tagging", cmd: "auto-tag.mjs", args: ["--slug", app.slug] },
    { label: "Syncing", cmd: "sync-manifests.mjs", args: ["--slug", app.slug] },
  ];

  let ok = true;
  for (const step of steps) {
    try {
      execFileSync("node", [resolve(__dirname, step.cmd), ...step.args], {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
        timeout: 300000,
      });
    } catch (err) {
      console.error(`    ${step.label} failed: ${err.message}`);
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

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`  Recrawl complete:`);
console.log(`    Success: ${results.success.length}`);
console.log(`    Failed: ${results.failed.length}`);
console.log(`    Skipped (needs login): ${results.skipped.length}`);
console.log(`${"─".repeat(60)}`);
