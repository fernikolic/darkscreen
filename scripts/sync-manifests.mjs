#!/usr/bin/env node

/**
 * Sync crawler manifests into src/data/apps.ts
 *
 * Reads all *-manifest.json files from public/screenshots/ and updates
 * the corresponding app's `screens` array, `screenCount`, `thumbnail`,
 * and `lastUpdated` fields in apps.ts.
 *
 * Usage:
 *   node scripts/sync-manifests.mjs
 *   node scripts/sync-manifests.mjs --slug lido   (sync only one app)
 *   node scripts/sync-manifests.mjs --dry-run      (preview without writing)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const APPS_FILE = resolve(PROJECT_ROOT, "src/data/apps.ts");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

// ─── Load manifests ────────────────────────────────────────────────────────

function loadManifests() {
  const files = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith("-manifest.json"));
  const manifests = {};
  for (const file of files) {
    const data = JSON.parse(readFileSync(resolve(SCREENSHOT_DIR, file), "utf-8"));
    manifests[data.slug] = data;
  }
  return manifests;
}

// ─── Generate screens array as TS string ───────────────────────────────────

function screensToTS(screens, indent = "    ") {
  if (!screens || screens.length === 0) return `${indent}screens: [],`;
  let out = `${indent}screens: [\n`;
  for (const s of screens) {
    const label = s.label.replace(/"/g, '\\"');
    out += `${indent}  { step: ${s.step}, label: "${label}", flow: "${s.flow}", image: "${s.image}" },\n`;
  }
  out += `${indent}],`;
  return out;
}

// ─── Update apps.ts ────────────────────────────────────────────────────────

function syncApps(manifests) {
  let source = readFileSync(APPS_FILE, "utf-8");
  let synced = 0;

  for (const [slug, manifest] of Object.entries(manifests)) {
    if (args.slug && args.slug !== slug) continue;

    // Find the app block in the source
    const slugPattern = new RegExp(`slug:\\s*"${slug}"`, "g");
    const match = slugPattern.exec(source);
    if (!match) {
      console.log(`  SKIP: "${slug}" not found in apps.ts`);
      continue;
    }

    // Find the app block — walk backwards to opening brace
    const blockStart = source.lastIndexOf("{", match.index);
    // Find matching closing brace — count braces
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}") depth--;
      if (depth === 0) {
        blockEnd = i + 1;
        break;
      }
    }

    let block = source.slice(blockStart, blockEnd);

    // Replace screens array
    const screensMatch = block.match(/screens:\s*\[[\s\S]*?\],/);
    if (screensMatch) {
      const newScreens = screensToTS(manifest.screens);
      block = block.replace(screensMatch[0], newScreens);
    }

    // Update screenCount
    const screenCountMatch = block.match(/screenCount:\s*\d+/);
    if (screenCountMatch) {
      block = block.replace(screenCountMatch[0], `screenCount: ${manifest.screens.length}`);
    }

    // Update lastUpdated
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const lastUpdatedMatch = block.match(/lastUpdated:\s*"[^"]+"/);
    if (lastUpdatedMatch) {
      block = block.replace(lastUpdatedMatch[0], `lastUpdated: "${dateStr}"`);
    }

    // Set thumbnail to first screenshot with an image
    const firstImage = manifest.screens.find((s) => s.image);
    if (firstImage) {
      const thumbMatch = block.match(/thumbnail:\s*"[^"]+"/);
      if (thumbMatch) {
        block = block.replace(thumbMatch[0], `thumbnail: "${firstImage.image}"`);
      } else {
        // Add thumbnail after detailed field
        block = block.replace(
          /detailed:\s*(true|false)/,
          `detailed: $1,\n    thumbnail: "${firstImage.image}"`
        );
      }
    }

    // Ensure detailed: true
    block = block.replace(/detailed:\s*false/, "detailed: true");

    source = source.slice(0, blockStart) + block + source.slice(blockEnd);
    synced++;

    console.log(`  SYNC: ${slug} — ${manifest.screens.length} screens`);
  }

  return { source, synced };
}

// ─── Main ──────────────────────────────────────────────────────────────────

const manifests = loadManifests();
console.log(`Found ${Object.keys(manifests).length} manifest(s): ${Object.keys(manifests).join(", ")}`);

if (Object.keys(manifests).length === 0) {
  console.log("No manifests found. Run the crawler first.");
  process.exit(0);
}

const { source, synced } = syncApps(manifests);

if (synced === 0) {
  console.log("Nothing to sync.");
  process.exit(0);
}

if (args["dry-run"]) {
  console.log(`\nDry run — ${synced} app(s) would be updated. No files changed.`);
} else {
  writeFileSync(APPS_FILE, source);
  console.log(`\nUpdated ${APPS_FILE} — ${synced} app(s) synced.`);
}
