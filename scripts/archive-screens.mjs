#!/usr/bin/env node

/**
 * Archive current screenshots before re-crawling.
 *
 * Copies PNGs + manifest to a dated archive folder so diff-screens.mjs
 * can compare old vs new after the next crawl.
 *
 * Usage:
 *   node scripts/archive-screens.mjs --slug aave
 *   node scripts/archive-screens.mjs --all
 *   node scripts/archive-screens.mjs --slug aave --force
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const ARCHIVE_DIR = resolve(SCREENSHOT_DIR, "archive");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
  },
  strict: false,
});

// ─── Archive one app ──────────────────────────────────────────────────────

function archiveApp(slug) {
  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  if (!existsSync(manifestPath)) {
    console.log(`  ⚠ SKIP: ${slug}-manifest.json not found`);
    return false;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const date = manifest.crawledAt
    ? manifest.crawledAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const archivePath = resolve(ARCHIVE_DIR, slug, date);

  if (existsSync(archivePath) && !args.force) {
    console.log(`  ⏭ SKIP: ${slug} already archived for ${date} (use --force to overwrite)`);
    return false;
  }

  mkdirSync(archivePath, { recursive: true });

  // Copy manifest
  copyFileSync(manifestPath, resolve(archivePath, `${slug}-manifest.json`));

  // Copy all PNGs for this slug
  const pngs = readdirSync(SCREENSHOT_DIR).filter(
    (f) => f.startsWith(`${slug}-`) && f.endsWith(".png")
  );

  for (const png of pngs) {
    copyFileSync(resolve(SCREENSHOT_DIR, png), resolve(archivePath, png));
  }

  console.log(`  ✓ ${slug} → archive/${slug}/${date}/ (${pngs.length} screenshots + manifest)`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────

if (!args.slug && !args.all) {
  console.log("Usage: archive-screens.mjs --slug <slug> | --all [--force]");
  process.exit(1);
}

console.log("📦 Archiving screenshots...\n");

if (args.all) {
  const manifests = readdirSync(SCREENSHOT_DIR).filter(
    (f) => f.endsWith("-manifest.json") && !f.endsWith("-raw.json")
  );
  console.log(`Found ${manifests.length} manifest(s)\n`);

  let archived = 0;
  for (const file of manifests) {
    const slug = file.replace("-manifest.json", "");
    if (archiveApp(slug)) archived++;
  }
  console.log(`\n✅ Archived ${archived} app(s).`);
} else {
  archiveApp(args.slug);
}

console.log("\nDone! Next: re-crawl, then run diff-screens.mjs");
