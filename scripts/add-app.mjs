#!/usr/bin/env node

/**
 * Add a new app to Darkscreen — single command, zero manual steps.
 *
 * Pipeline: detect metadata → generate slug → append to apps.ts → fetch logo → crawl → label → tag → sync
 *
 * Usage:
 *   node scripts/add-app.mjs --url https://raydium.io --name Raydium --category DeFi --chains Solana
 *   node scripts/add-app.mjs --url https://phantom.app --name Phantom --category Wallet --chains "Solana,Multi-chain"
 *   node scripts/add-app.mjs --url https://example.com --name Example --category Exchange --chains Ethereum --dry-run
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const APPS_FILE = resolve(PROJECT_ROOT, "src/data/apps.ts");

const VALID_CATEGORIES = ["Wallet", "Exchange", "DeFi", "Bridge", "NFT", "Analytics", "Payment", "Infrastructure"];
const VALID_CHAINS = ["Bitcoin", "Ethereum", "Solana", "Multi-chain"];

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    name: { type: "string" },
    category: { type: "string" },
    chains: { type: "string" },
    platforms: { type: "string", default: "Web" },
    "auth-type": { type: "string", default: "public" },
    "dry-run": { type: "boolean", default: false },
    "skip-crawl": { type: "boolean", default: false },
  },
  strict: false,
});

if (!args.url || !args.name || !args.category) {
  console.error("Usage: node scripts/add-app.mjs --url <URL> --name <NAME> --category <CATEGORY> --chains <CHAINS>");
  console.error("\nRequired: --url, --name, --category");
  console.error("Optional: --chains (default: Multi-chain), --platforms (default: Web), --auth-type (default: public)");
  console.error(`\nValid categories: ${VALID_CATEGORIES.join(", ")}`);
  console.error(`Valid chains: ${VALID_CHAINS.join(", ")}`);
  process.exit(1);
}

if (!VALID_CATEGORIES.includes(args.category)) {
  console.error(`Invalid category: "${args.category}". Valid: ${VALID_CATEGORIES.join(", ")}`);
  process.exit(1);
}

// ─── Generate slug ──────────────────────────────────────────────────────

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const slug = toSlug(args.name);
const chains = (args.chains || "Multi-chain").split(",").map((c) => c.trim());
const platforms = args.platforms.split(",").map((p) => p.trim());
const today = new Date().toISOString().slice(0, 10);

// Check for duplicates
const appsSource = readFileSync(APPS_FILE, "utf-8");
if (appsSource.includes(`slug: "${slug}"`)) {
  console.error(`App "${slug}" already exists in apps.ts`);
  process.exit(1);
}

// ─── Generate app entry ─────────────────────────────────────────────────

const appEntry = `  {
    slug: "${slug}",
    name: "${args.name}",
    category: "${args.category}",
    chains: [${chains.map((c) => `"${c}"`).join(", ")}],
    platforms: [${platforms.map((p) => `"${p}"`).join(", ")}],
    sections: [],
    styles: ["Dark Mode"],
    description: "${args.name} — ${args.category.toLowerCase()} application.",
    website: "${args.url}",
    authType: "${args["auth-type"]}",
    screenCount: 0,
    lastUpdated: "${today}",
    detailed: false,
    flows: [],
    screens: [],
    changes: [],
    accentColor: "#71717A",
  },`;

console.log(`\n  App: ${args.name}`);
console.log(`  Slug: ${slug}`);
console.log(`  Category: ${args.category}`);
console.log(`  Chains: ${chains.join(", ")}`);
console.log(`  URL: ${args.url}`);
console.log(`  Auth: ${args["auth-type"]}\n`);

if (args["dry-run"]) {
  console.log("DRY RUN — would append to apps.ts:\n");
  console.log(appEntry);
  process.exit(0);
}

// ─── Append to apps.ts ─────────────────────────────────────────────────

// Find the closing bracket of the apps array
const closingIndex = appsSource.lastIndexOf("];");
if (closingIndex === -1) {
  console.error("Could not find apps array closing bracket in apps.ts");
  process.exit(1);
}

const newSource =
  appsSource.slice(0, closingIndex) +
  appEntry +
  "\n" +
  appsSource.slice(closingIndex);

writeFileSync(APPS_FILE, newSource);
console.log(`  Added "${args.name}" to apps.ts`);

// ─── Fetch logo ─────────────────────────────────────────────────────────

try {
  console.log("\n  Fetching logo...");
  execFileSync("node", [resolve(__dirname, "fetch-logos.mjs"), "--slug", slug], {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
} catch {
  console.log("  Logo fetch failed — will use fallback letter circle");
}

// ─── Crawl + Label + Tag + Sync ─────────────────────────────────────────

if (args["skip-crawl"]) {
  console.log("\n  Skipping crawl (--skip-crawl). Run manually:");
  console.log(`    node scripts/crawl-app.mjs --slug ${slug}`);
  console.log(`    node scripts/label-local.mjs --slug ${slug}`);
  console.log(`    node scripts/auto-tag.mjs --slug ${slug}`);
  console.log(`    node scripts/sync-manifests.mjs --slug ${slug}`);
  process.exit(0);
}

const steps = [
  { label: "Crawling", cmd: "crawl-app.mjs", args: ["--slug", slug] },
  { label: "Labeling", cmd: "label-local.mjs", args: ["--slug", slug] },
  { label: "Tagging", cmd: "auto-tag.mjs", args: ["--slug", slug] },
  { label: "Syncing manifest", cmd: "sync-manifests.mjs", args: ["--slug", slug] },
];

for (const step of steps) {
  try {
    console.log(`\n  ${step.label}...`);
    execFileSync("node", [resolve(__dirname, step.cmd), ...step.args], {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
  } catch (err) {
    console.error(`  ${step.label} failed: ${err.message}`);
    console.log("  Continuing to next step...");
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`  Done! "${args.name}" added to Darkscreen.`);
console.log(`  View: /library/${slug}`);
console.log(`${"─".repeat(60)}`);
