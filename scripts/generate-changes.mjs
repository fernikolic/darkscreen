#!/usr/bin/env node

/**
 * Generate auto-detected changes from diff JSON files.
 *
 * Usage:
 *   node scripts/generate-changes.mjs --slug aave
 *   node scripts/generate-changes.mjs --all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "src/data/auto-changes.ts");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
  },
  strict: false,
});

function inferChangeType(screen) {
  if (screen.status === "added") return "New Feature";
  if (screen.status === "removed") return "Removed";
  if (screen.diffPercent > 50) return "Redesign";
  if (screen.diffPercent > 5) return "Layout Shift";
  return "Copy Change";
}

function generateDescription(screen) {
  const label = screen.label || `${screen.flow}/${screen.step}`;
  if (screen.status === "added") return `New screen detected: ${label}`;
  if (screen.status === "removed") return `Screen removed: ${label}`;
  return `${label} changed by ${screen.diffPercent}%`;
}

function processSlug(slug) {
  const diffPath = resolve(SCREENSHOT_DIR, `${slug}-diff.json`);
  if (!existsSync(diffPath)) {
    console.log(`  No diff file for ${slug}, skipping`);
    return null;
  }

  const diff = JSON.parse(readFileSync(diffPath, "utf-8"));
  const changes = [];

  for (const screen of diff.screens) {
    if (screen.status === "unchanged" || screen.status === "error") continue;

    changes.push({
      date: diff.diffDate.split("T")[0],
      description: generateDescription(screen),
      type: inferChangeType(screen),
      source: "auto",
      diffPercent: screen.diffPercent,
      beforeImage: screen.previousImage || undefined,
      afterImage: screen.currentImage || undefined,
      flow: screen.flow,
      step: screen.step,
      screenLabel: screen.label,
    });
  }

  if (changes.length > 0) {
    console.log(`  ${slug}: ${changes.length} auto-detected changes`);
  }

  return changes.length > 0 ? changes : null;
}

function getSlugs() {
  if (args.slug) return [args.slug];
  // Find all diff files
  return readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith("-diff.json"))
    .map(f => f.replace("-diff.json", ""));
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
console.log(`\nGenerating auto-changes for ${slugs.length} app(s)...`);

for (const slug of slugs) {
  const changes = processSlug(slug);
  if (changes) {
    existing[slug] = changes;
  }
}

// Write output
const entries = Object.entries(existing)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, changes]) => `  "${slug}": ${JSON.stringify(changes, null, 2).replace(/\n/g, "\n  ")}`)
  .join(",\n");

const output = `import { type DiffChange } from "./apps";

export const autoChangesBySlug: Record<string, DiffChange[]> = {
${entries}
};
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`\nWritten to ${OUTPUT_FILE}`);
