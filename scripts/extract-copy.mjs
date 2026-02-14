#!/usr/bin/env node

/**
 * Extract copy/messaging data from crawl manifests.
 *
 * Usage:
 *   node scripts/extract-copy.mjs --slug aave
 *   node scripts/extract-copy.mjs --all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const ARCHIVE_DIR = resolve(SCREENSHOT_DIR, "archive");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "src/data/copy-tracking.ts");

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

function detectChanges(current, previous, url) {
  const changes = [];
  const fields = [
    { key: "h1", label: "H1 headline" },
    { key: "metaDescription", label: "Meta description" },
    { key: "ogTitle", label: "OG title" },
    { key: "ogDescription", label: "OG description" },
  ];

  for (const { key, label } of fields) {
    const oldVal = previous[key] || "";
    const newVal = current[key] || "";
    if (oldVal !== newVal && (oldVal || newVal)) {
      changes.push({
        date: new Date().toISOString().split("T")[0],
        element: label,
        oldText: oldVal,
        newText: newVal,
        url,
      });
    }
  }

  // Compare CTAs
  const oldCtas = new Set(previous.ctas || []);
  const newCtas = new Set(current.ctas || []);
  for (const cta of newCtas) {
    if (!oldCtas.has(cta)) {
      changes.push({
        date: new Date().toISOString().split("T")[0],
        element: "CTA added",
        oldText: "",
        newText: cta,
        url,
      });
    }
  }
  for (const cta of oldCtas) {
    if (!newCtas.has(cta)) {
      changes.push({
        date: new Date().toISOString().split("T")[0],
        element: "CTA removed",
        oldText: cta,
        newText: "",
        url,
      });
    }
  }

  return changes;
}

function processSlug(slug) {
  const rawPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
  const manifest = loadManifest(rawPath);
  if (!manifest || !manifest.pageCopy) {
    console.log(`  ${slug}: no copy data in manifest`);
    return null;
  }

  const url = manifest.url || "";
  const date = (manifest.crawledAt || new Date().toISOString()).split("T")[0];

  const snapshot = {
    date,
    url,
    h1: manifest.pageCopy.h1 || undefined,
    metaDescription: manifest.pageCopy.metaDescription || undefined,
    ogTitle: manifest.pageCopy.ogTitle || undefined,
    ogDescription: manifest.pageCopy.ogDescription || undefined,
    ctas: manifest.pageCopy.ctas || [],
    navItems: manifest.pageCopy.navItems || [],
  };

  // Look for archived manifests to detect changes
  const allChanges = [];
  const archiveSlugDir = resolve(ARCHIVE_DIR, slug);
  if (existsSync(archiveSlugDir)) {
    const dates = readdirSync(archiveSlugDir)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .reverse();

    for (const archDate of dates) {
      const archManifest = loadManifest(resolve(archiveSlugDir, archDate, `${slug}-raw.json`));
      if (archManifest?.pageCopy) {
        const changes = detectChanges(manifest.pageCopy, archManifest.pageCopy, url);
        allChanges.push(...changes);
        break; // Only compare against most recent archive
      }
    }
  }

  console.log(`  ${slug}: snapshot captured, ${allChanges.length} copy changes detected`);
  return { snapshots: [snapshot], changes: allChanges };
}

function getSlugs() {
  if (args.slug) return [args.slug];
  return readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith("-raw.json"))
    .map(f => f.replace("-raw.json", ""));
}

// Load existing data
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
console.log(`\nExtracting copy data for ${slugs.length} app(s)...`);

for (const slug of slugs) {
  const data = processSlug(slug);
  if (data) {
    // Merge snapshots (append if new date)
    const prev = existing[slug] || { snapshots: [], changes: [] };
    const existingDates = new Set(prev.snapshots.map(s => s.date));
    for (const snap of data.snapshots) {
      if (!existingDates.has(snap.date)) {
        prev.snapshots.push(snap);
      }
    }
    prev.changes = [...prev.changes, ...data.changes];
    existing[slug] = prev;
  }
}

const entries = Object.entries(existing)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, data]) => `  "${slug}": ${JSON.stringify(data, null, 2).replace(/\n/g, "\n  ")}`)
  .join(",\n");

const output = `import { type CopySnapshot, type CopyChange } from "./apps";

export const copyDataBySlug: Record<string, { snapshots: CopySnapshot[]; changes: CopyChange[] }> = {
${entries}
};
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`\nWritten to ${OUTPUT_FILE}`);
