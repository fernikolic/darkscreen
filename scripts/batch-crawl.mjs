#!/usr/bin/env node

/**
 * Batch add and crawl multiple apps from a JSON file.
 *
 * Input format: JSON array of { url, name, category, chains? }
 *
 * Usage:
 *   node scripts/batch-crawl.mjs --input apps-to-add.json
 *   node scripts/batch-crawl.mjs --input apps-to-add.json --concurrency 3
 *   node scripts/batch-crawl.mjs --input apps-to-add.json --dry-run
 *
 * Example input file (apps-to-add.json):
 *   [
 *     { "url": "https://raydium.io", "name": "Raydium", "category": "DeFi", "chains": "Solana" },
 *     { "url": "https://phantom.app", "name": "Phantom", "category": "Wallet", "chains": "Solana,Multi-chain" }
 *   ]
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const { values: args } = parseArgs({
  options: {
    input: { type: "string" },
    concurrency: { type: "string", default: "1" },
    "dry-run": { type: "boolean", default: false },
    "skip-crawl": { type: "boolean", default: false },
  },
  strict: false,
});

if (!args.input) {
  console.error("Usage: node scripts/batch-crawl.mjs --input <file.json> [--concurrency N] [--dry-run]");
  process.exit(1);
}

// ─── Load input ─────────────────────────────────────────────────────────

let appList;
try {
  const raw = readFileSync(resolve(process.cwd(), args.input), "utf-8");
  appList = JSON.parse(raw);
} catch (err) {
  console.error(`Failed to read input file: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(appList) || appList.length === 0) {
  console.error("Input must be a non-empty JSON array");
  process.exit(1);
}

const concurrency = parseInt(args.concurrency, 10);
console.log(`\nBatch crawl: ${appList.length} apps, concurrency ${concurrency}\n`);

// ─── Process apps ───────────────────────────────────────────────────────

const results = { success: [], failed: [] };

async function processApp(app, index) {
  const { url, name, category, chains } = app;
  if (!url || !name || !category) {
    console.log(`  [${index + 1}/${appList.length}] SKIP: missing url/name/category for "${name || "unknown"}"`);
    results.failed.push({ name: name || "unknown", error: "missing required fields" });
    return;
  }

  console.log(`  [${index + 1}/${appList.length}] Adding ${name}...`);

  const addArgs = [
    resolve(__dirname, "add-app.mjs"),
    "--url", url,
    "--name", name,
    "--category", category,
  ];

  if (chains) addArgs.push("--chains", chains);
  if (args["dry-run"]) addArgs.push("--dry-run");
  if (args["skip-crawl"]) addArgs.push("--skip-crawl");

  try {
    execFileSync("node", addArgs, {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      timeout: 300000, // 5 min per app
    });
    results.success.push(name);
  } catch (err) {
    console.error(`  [${index + 1}] FAILED: ${name} — ${err.message}`);
    results.failed.push({ name, error: err.message });
  }
}

// Sequential processing (concurrency > 1 would need subprocess pooling)
for (let i = 0; i < appList.length; i++) {
  await processApp(appList[i], i);
}

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`  Batch complete: ${results.success.length} succeeded, ${results.failed.length} failed`);
if (results.failed.length > 0) {
  console.log(`\n  Failed apps:`);
  for (const f of results.failed) {
    console.log(`    - ${f.name}: ${f.error}`);
  }
}
console.log(`${"─".repeat(60)}`);
