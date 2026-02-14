#!/usr/bin/env node

/**
 * Sync performance data from crawl manifests.
 *
 * Usage:
 *   node scripts/sync-performance.mjs --slug aave
 *   node scripts/sync-performance.mjs --all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const ARCHIVE_DIR = resolve(SCREENSHOT_DIR, "archive");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "src/data/performance.ts");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
  },
  strict: false,
});

function loadManifest(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function extractPerfEntry(manifest) {
  if (!manifest?.performance) return null;
  const p = manifest.performance;
  const date = (manifest.crawledAt || new Date().toISOString()).split("T")[0];
  return {
    date,
    url: manifest.url || "",
    loadTime: p.loadTime || 0,
    domContentLoaded: p.domContentLoaded || 0,
    lcp: p.lcp ?? undefined,
    cls: p.cls ?? undefined,
    resourceCount: p.resourceCount || 0,
    transferSize: p.transferSize || 0,
    breakdown: p.breakdown || { js: 0, css: 0, images: 0, fonts: 0, other: 0 },
  };
}

function processSlug(slug) {
  const metrics = [];

  // Current manifest
  const rawPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
  const current = loadManifest(rawPath);
  const currentEntry = extractPerfEntry(current);
  if (currentEntry) metrics.push(currentEntry);

  // Archived manifests
  const archiveSlugDir = resolve(ARCHIVE_DIR, slug);
  if (existsSync(archiveSlugDir)) {
    const dates = readdirSync(archiveSlugDir)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();

    for (const archDate of dates) {
      const archManifest = loadManifest(resolve(archiveSlugDir, archDate, `${slug}-raw.json`));
      const entry = extractPerfEntry(archManifest);
      if (entry) {
        entry.date = archDate;
        metrics.push(entry);
      }
    }
  }

  if (metrics.length === 0) {
    console.log(`  ${slug}: no performance data`);
    return null;
  }

  // Deduplicate by date, keep latest
  const byDate = new Map();
  for (const m of metrics) {
    byDate.set(m.date, m);
  }
  const deduped = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  console.log(`  ${slug}: ${deduped.length} performance snapshot(s)`);
  return deduped;
}

function getSlugs() {
  if (args.slug) return [args.slug];
  return readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith("-raw.json"))
    .map(f => f.replace("-raw.json", ""));
}

let existing = {};
if (existsSync(OUTPUT_FILE)) {
  try {
    const content = readFileSync(OUTPUT_FILE, "utf-8");
    const match = content.match(/= ({[\s\S]*});?\s*$/);
    if (match) {
      existing = JSON.parse(match[1].replace(/\/\/.*/g, "").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    }
  } catch {}
}

const slugs = getSlugs();
console.log(`\nSyncing performance data for ${slugs.length} app(s)...`);

for (const slug of slugs) {
  const metrics = processSlug(slug);
  if (metrics) {
    existing[slug] = metrics;
  }
}

const entries = Object.entries(existing)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, metrics]) => `  "${slug}": ${JSON.stringify(metrics, null, 2).replace(/\n/g, "\n  ")}`)
  .join(",\n");

const output = `import { type PerformanceMetrics } from "./apps";

export const performanceBySlug: Record<string, PerformanceMetrics[]> = {
${entries}
};
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`\nWritten to ${OUTPUT_FILE}`);
