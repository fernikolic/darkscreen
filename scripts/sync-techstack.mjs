#!/usr/bin/env node

/**
 * Sync tech stack data from crawl manifests.
 *
 * Usage:
 *   node scripts/sync-techstack.mjs --slug aave
 *   node scripts/sync-techstack.mjs --all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "src/data/techstack.ts");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
  },
  strict: false,
});

function processSlug(slug) {
  const rawPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
  if (!existsSync(rawPath)) {
    console.log(`  ${slug}: no raw manifest`);
    return null;
  }

  const manifest = JSON.parse(readFileSync(rawPath, "utf-8"));
  if (!manifest.techStack || manifest.techStack.length === 0) {
    console.log(`  ${slug}: no tech stack data`);
    return null;
  }

  console.log(`  ${slug}: ${manifest.techStack.length} technologies`);
  return manifest.techStack;
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
console.log(`\nSyncing tech stack for ${slugs.length} app(s)...`);

for (const slug of slugs) {
  const stack = processSlug(slug);
  if (stack) {
    existing[slug] = stack;
  }
}

const entries = Object.entries(existing)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, stack]) => `  "${slug}": ${JSON.stringify(stack, null, 2).replace(/\n/g, "\n  ")}`)
  .join(",\n");

const output = `import { type TechStackEntry } from "./apps";

export const techStackBySlug: Record<string, TechStackEntry[]> = {
${entries}
};
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`\nWritten to ${OUTPUT_FILE}`);
