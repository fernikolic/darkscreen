#!/usr/bin/env node

/**
 * Local labeling — no API needed.
 *
 * Classifies screenshots into flows using URL patterns + context text,
 * generates descriptive labels, renames files, and outputs manifest.json.
 *
 * Usage:
 *   node scripts/label-local.mjs --slug binance
 *   node scripts/label-local.mjs                  (all raw manifests)
 */

import { readFileSync, writeFileSync, renameSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");

const { values: args } = parseArgs({
  options: { slug: { type: "string" } },
  strict: false,
});

const FLOWS = ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"];

// ─── Flow classification rules ────────────────────────────────────────────

const SWAP_PATTERNS = [
  /\/swap/i, /\/trade/i, /\/exchange/i, /\/convert/i, /\/pro\b/i,
  /\/perpetual/i, /\/futures/i, /\/derivatives/i, /\/options/i,
  /\/limit/i, /\/dca/i, /\/recurring/i, /\/markets/i, /\/prices\//i,
  /\/breakout/i, /\/stocks/i,
];

const STAKING_PATTERNS = [
  /\/stak/i, /\/earn/i, /\/lend/i, /\/borrow/i, /\/pool/i,
  /\/liquidity/i, /\/yield/i, /\/vault/i, /\/reward/i, /\/auto-earn/i,
  /\/savings/i, /\/apy/i, /\/supply/i, /\/governance/i, /\/vote/i,
  /\/dao/i, /\/bundle/i, /\/krak\b/i,
];

const SEND_PATTERNS = [
  /\/send/i, /\/transfer/i, /\/bridge/i, /\/withdraw/i,
  /\/payment/i, /\/receive/i, /\/deposit/i, /\/fund/i,
];

const ONBOARDING_PATTERNS = [
  /\/sign-?up/i, /\/login/i, /\/register/i, /\/connect/i,
  /\/onboard/i, /\/auth/i, /\/create-account/i,
];

const SETTINGS_PATTERNS = [
  /\/setting/i, /\/preference/i, /\/help/i, /\/faq/i,
  /\/about\b/i, /\/legal/i, /\/terms/i, /\/privacy/i,
  /\/learn/i, /\/support/i, /\/press/i, /\/blog/i,
  /\/career/i, /\/contact/i, /\/language/i, /\/compliance/i,
  /\/policy/i, /\/docs\b/i, /\/documentation/i,
];

function classifyFlow(url, context, action) {
  const path = new URL(url).pathname.toLowerCase();
  const ctx = (context || "").toLowerCase();

  // Action-based overrides
  if (action === "interaction" && /sign.?up|register|login/i.test(ctx)) return "Onboarding";
  if (action === "interaction" && /connect.?wallet/i.test(ctx)) return "Onboarding";

  // URL pattern matching (most specific first)
  for (const p of ONBOARDING_PATTERNS) { if (p.test(path) || p.test(ctx)) return "Onboarding"; }
  for (const p of SWAP_PATTERNS) { if (p.test(path)) return "Swap"; }
  for (const p of STAKING_PATTERNS) { if (p.test(path)) return "Staking"; }
  for (const p of SEND_PATTERNS) { if (p.test(path)) return "Send"; }
  for (const p of SETTINGS_PATTERNS) { if (p.test(path)) return "Settings"; }

  // Context-based fallbacks
  if (/swap|trading|exchange|convert|perpetual|futures|order/i.test(ctx)) return "Swap";
  if (/stak|earn|lend|borrow|pool|liquidity|yield|vault|reward/i.test(ctx)) return "Staking";
  if (/send|transfer|bridge|withdraw|payment/i.test(ctx)) return "Send";
  if (/setting|preference|help|faq|learn|support|legal|terms|privacy/i.test(ctx)) return "Settings";

  return "Home";
}

function generateLabel(screen) {
  const ctx = screen.context || "";

  // Clean up raw context to make a decent label
  if (ctx.startsWith("Landing page")) return ctx;
  if (ctx.startsWith("Overlay before dismiss")) return "Cookie/overlay banner";
  if (ctx.startsWith("Landing page after overlay dismissed")) return "Landing page (clean)";
  if (ctx.startsWith("Path:")) return ctx.replace("Path: ", "").replace(/^\//, "") + " page";

  // Strip duplicate title text (crawl-app outputs "TitleTitleSubtitle")
  let label = ctx;
  const paren = label.indexOf("(");
  if (paren > 0) label = label.slice(0, paren).trim();

  // Remove duplication like "Stake CryptoStake CryptoEarn..."
  const deduped = label.replace(/(.{8,}?)\1+/g, "$1").trim();
  if (deduped.length >= 8) label = deduped;

  // Limit length
  if (label.length > 60) label = label.slice(0, 57) + "...";
  if (label.length < 3) label = `Screenshot ${screen.index}`;

  return label;
}

// ─── Process one app ─────────────────────────────────────────────────────

function processApp(slug) {
  const rawPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
  if (!existsSync(rawPath)) {
    console.log(`  SKIP: ${rawPath} not found`);
    return null;
  }

  const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
  console.log(`\nLabeling ${raw.totalScreenshots} screenshots for ${slug}`);

  // Classify and label
  const labeled = raw.screens.map((s) => ({
    ...s,
    flow: classifyFlow(s.url, s.context, s.action),
    label: generateLabel(s),
  }));

  // Group by flow and assign step numbers
  const byFlow = {};
  for (const s of labeled) {
    if (!byFlow[s.flow]) byFlow[s.flow] = [];
    byFlow[s.flow].push(s);
  }

  const screens = [];

  for (const [flow, items] of Object.entries(byFlow)) {
    items.forEach((item, i) => {
      const step = i + 1;
      const desc = item.label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const newFilename = `${slug}-${flow.toLowerCase()}-${step}-${desc}.png`;

      const oldPath = resolve(SCREENSHOT_DIR, item.filename);
      const newPath = resolve(SCREENSHOT_DIR, newFilename);

      if (existsSync(oldPath) && oldPath !== newPath) {
        try {
          renameSync(oldPath, newPath);
        } catch (e) {
          console.log(`  ⚠ Rename failed: ${item.filename} → ${newFilename}`);
        }
      }

      screens.push({
        step,
        label: item.label,
        flow,
        image: `/screenshots/${newFilename}`,
      });
    });
  }

  // Flow summary
  const flowSummary = Object.entries(byFlow)
    .map(([f, items]) => `${f}: ${items.length}`)
    .join(", ");

  // Write manifest
  const manifest = {
    slug,
    url: raw.url,
    crawledAt: raw.crawledAt,
    totalScreenshots: screens.length,
    totalStates: screens.length,
    screens,
  };

  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`  ✓ ${screens.length} screens → ${flowSummary}`);
  console.log(`  Manifest: ${manifestPath}`);

  return manifest;
}

// ─── Main ────────────────────────────────────────────────────────────────

if (args.slug) {
  processApp(args.slug);
} else {
  // Process all raw manifests
  const files = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith("-raw.json"));
  console.log(`Found ${files.length} raw manifest(s)`);

  for (const file of files) {
    const slug = file.replace("-raw.json", "");
    processApp(slug);
  }
}

console.log("\nDone! Next: node scripts/sync-manifests.mjs");
