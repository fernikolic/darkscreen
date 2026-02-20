#!/usr/bin/env node

/**
 * Extract product intelligence from screenshots using Claude Vision.
 *
 * Reads {slug}-manifest.json files, sends each screenshot to Claude Vision,
 * and extracts 3-pillar intelligence (design, flow, copy) per screen.
 * Outputs to public/screenshots/{slug}-extracted.json.
 *
 * Usage:
 *   node scripts/extract.mjs --slug aave        # single app
 *   node scripts/extract.mjs --all              # all apps with manifests
 *   node scripts/extract.mjs --all --force      # re-extract everything
 *   node scripts/extract.mjs --all --model claude-sonnet-4-5-20250929
 *   node scripts/extract.mjs --dry-run          # preview what would run
 *
 * Cost: ~$14 (Haiku) for all ~4,196 manifest screens.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");

// ─── CLI Args ───────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    model: { type: "string", default: "claude-haiku-4-5-20251001" },
    batch: { type: "string", default: "3" },
    concurrency: { type: "string", default: "3" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

if (!args.slug && !args.all) {
  console.error("Usage: node scripts/extract.mjs --slug <slug> | --all");
  console.error("  --force        Re-extract already-processed screens");
  console.error("  --model <m>    Claude model (default: claude-haiku-4-5-20251001)");
  console.error("  --batch <n>    Images per API call (default: 3)");
  console.error("  --concurrency <n>  Parallel workers (default: 3)");
  console.error("  --dry-run      Preview without API calls");
  process.exit(1);
}

if (!args["dry-run"] && !process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required.");
  console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const BATCH_SIZE = parseInt(args.batch, 10);
const CONCURRENCY = parseInt(args.concurrency, 10);
const MODEL = args.model;
const DRY_RUN = args["dry-run"];
const client = DRY_RUN ? null : new Anthropic();

// ─── Read category mapping from apps.ts ─────────────────────────────────

function getSlugCategoryMap() {
  const appsFile = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
  const blockRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
  const map = {};
  let match;
  while ((match = blockRe.exec(appsFile)) !== null) {
    map[match[1]] = match[2];
  }
  return map;
}

const slugCategoryMap = getSlugCategoryMap();

// ─── Discover manifests ─────────────────────────────────────────────────

function discoverManifests() {
  if (args.slug) {
    const manifestPath = resolve(SCREENSHOT_DIR, `${args.slug}-manifest.json`);
    if (!existsSync(manifestPath)) {
      console.error(`Manifest not found: ${manifestPath}`);
      process.exit(1);
    }
    return [args.slug];
  }

  // --all: find all manifest files
  const files = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith("-manifest.json"));
  return files.map((f) => f.replace("-manifest.json", "")).sort();
}

// ─── Cookie banner dedup ────────────────────────────────────────────────

function dedupCookieBanners(screens) {
  const seenCookieFlows = new Set();
  return screens.filter((s) => {
    const isCookie =
      s.label.toLowerCase().includes("cookie") ||
      s.label.toLowerCase().includes("overlay") ||
      s.label.toLowerCase().includes("banner");
    if (!isCookie) return true;
    const key = `${s.flow}-cookie`;
    if (seenCookieFlows.has(key)) return false;
    seenCookieFlows.add(key);
    return true;
  });
}

// ─── Extraction prompt ──────────────────────────────────────────────────

const SYSTEM = `You are a product intelligence analyst examining crypto app screenshots. For each screenshot, extract structured intelligence across three pillars: design, flow, and copy.

Return a JSON object where keys are image paths and values follow this exact schema:

{
  "design": {
    "layout": "string — layout pattern (e.g. sidebar-main, full-width, split-panel, card-grid, stacked)",
    "colorScheme": "dark | light | mixed",
    "primaryColors": ["hex color strings for dominant 2-3 colors"],
    "typography": {
      "headingStyle": "string — describe heading treatment",
      "bodyStyle": "string — describe body text",
      "dataStyle": "string — describe how data/numbers are displayed, or null"
    },
    "components": [{"type": "string — component type", "description": "string", "position": "string — where on screen", "notable": "string — what makes it interesting, or null"}],
    "spacing": "compact | comfortable | spacious",
    "visualHierarchy": "string — how the page guides the eye",
    "innovativeElements": ["string — anything unusual or novel, empty array if none"]
  },
  "flow": {
    "screenType": "string — e.g. landing, dashboard, form, data-browse, modal, confirmation, error, empty-state, onboarding-step",
    "userIntent": "string — what the user is trying to do here",
    "entryPoints": ["strings — how user likely arrived here"],
    "exitPoints": ["strings — where user can go next"],
    "interactiveElements": [{"element": "string", "action": "string — what it does"}],
    "informationArchitecture": "string — how info is organized",
    "frictionPoints": ["strings — anything that might slow the user down, empty if none"],
    "progressIndicators": ["strings — any progress/status indicators, empty if none"]
  },
  "copy": {
    "headline": "string — main heading text, or null",
    "subheadline": "string — secondary heading, or null",
    "ctas": [{"text": "string", "style": "string — e.g. primary-button, text-link, ghost-button", "placement": "string"}],
    "microcopy": [{"text": "string", "context": "string — where it appears", "purpose": "string — what job it does"}],
    "tone": "string — e.g. professional-technical, friendly-casual, urgent, educational",
    "dataFormatting": ["strings — examples of how data is displayed, e.g. $35.52B, 2.45%"],
    "trustSignals": ["strings — security badges, audit mentions, TVL numbers, etc."],
    "jargonLevel": "none | beginner | intermediate | expert",
    "errorMessages": ["strings — any visible errors, empty if none"],
    "emptyStateText": ["strings — any empty state messages, empty if none"]
  }
}

Be thorough but concise. Focus on what makes each screen distinctive. For arrays, include the most important 3-5 items. Return ONLY valid JSON.`;

// ─── Extract batch via Claude Vision ────────────────────────────────────

async function extractBatch(screens) {
  const content = [];

  for (const screen of screens) {
    const fullPath = resolve(PROJECT_ROOT, "public" + screen.image);
    if (!existsSync(fullPath)) {
      console.warn(`  Missing image: ${screen.image}`);
      continue;
    }

    const imgData = readFileSync(fullPath);
    const header = imgData.slice(0, 4).toString("hex");
    const mediaType = header.startsWith("ffd8") ? "image/jpeg" : "image/png";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: imgData.toString("base64") },
    });
    content.push({
      type: "text",
      text: `Image: ${screen.image} | Flow: ${screen.flow} | Label: ${screen.label}`,
    });
  }

  if (content.length === 0) return {};

  content.push({
    type: "text",
    text: `Extract product intelligence from each image above. Return a single JSON object where keys are the image paths and values contain the design/flow/copy analysis. Example key: "/screenshots/aave-home-1-landing-page.png"`,
  });

  let retries = 0;
  const maxRetries = 3;
  const delays = [2000, 4000, 8000];

  while (retries <= maxRetries) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM,
        messages: [{ role: "user", content }],
      });

      const text = response.content[0]?.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Try to fix common JSON issues
        const cleaned = jsonMatch[0]
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
        try {
          return JSON.parse(cleaned);
        } catch {
          return {};
        }
      }
    } catch (err) {
      if ((err.status === 429 || err.status === 529) && retries < maxRetries) {
        retries++;
        console.warn(`\n  ${err.status === 429 ? "Rate limited" : "API overloaded"}, retrying in ${delays[retries - 1] / 1000}s...`);
        await new Promise((r) => setTimeout(r, delays[retries - 1]));
        continue;
      }
      throw err;
    }
  }
  return {};
}

// ─── Progress tracking ──────────────────────────────────────────────────

let totalScreens = 0;
let completed = 0;
let failed = 0;
let totalApps = 0;
let completedApps = 0;
const startTime = Date.now();

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m ${remainSec}s`;
}

function formatCost(screens) {
  const costPerScreen = MODEL.includes("haiku") ? 0.003 : MODEL.includes("sonnet") ? 0.015 : 0.06;
  return `$${(screens * costPerScreen).toFixed(2)}`;
}

function printProgress() {
  const elapsed = Date.now() - startTime;
  const rate = completed > 0 ? elapsed / completed : 0;
  const remaining = (totalScreens - completed) * rate;
  const pct = totalScreens > 0 ? ((completed / totalScreens) * 100).toFixed(1) : "0.0";

  const filledLen = Math.floor((completed / Math.max(totalScreens, 1)) * 30);
  const bar = "\u2588".repeat(filledLen) + "\u2591".repeat(30 - filledLen);

  process.stdout.write(
    `\r  ${bar} ${pct}% | ${completed}/${totalScreens} screens | ` +
      `${completedApps}/${totalApps} apps | ` +
      `${(completed / (elapsed / 1000 || 1)).toFixed(1)} img/s | ` +
      `ETA: ${formatTime(Math.round(remaining))} | ` +
      `~${formatCost(completed)} spent | ` +
      `Failed: ${failed}   `
  );
}

// ─── Process single app ─────────────────────────────────────────────────

async function processApp(slug) {
  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  const extractedPath = resolve(SCREENSHOT_DIR, `${slug}-extracted.json`);

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const category = slugCategoryMap[slug] || "Unknown";

  // Load existing extraction for incremental processing
  let existing = { screens: [] };
  if (existsSync(extractedPath) && !args.force) {
    try {
      existing = JSON.parse(readFileSync(extractedPath, "utf-8"));
    } catch {
      existing = { screens: [] };
    }
  }

  const existingImages = new Set(existing.screens.map((s) => s.image));

  // Dedup cookie banners
  let screens = dedupCookieBanners(manifest.screens);

  // Filter already-extracted
  if (!args.force) {
    screens = screens.filter((s) => !existingImages.has(s.image));
  }

  if (screens.length === 0) return null;

  // Build batches
  const batches = [];
  for (let i = 0; i < screens.length; i += BATCH_SIZE) {
    batches.push(screens.slice(i, i + BATCH_SIZE));
  }

  const allExtracted = args.force ? [] : [...existing.screens];

  let batchIndex = 0;

  async function processBatch(batch) {
    try {
      const extracted = await extractBatch(batch);
      for (const screen of batch) {
        const data = extracted[screen.image];
        if (data) {
          allExtracted.push({
            image: screen.image,
            label: screen.label,
            flowType: screen.flow,
            step: screen.step,
            design: data.design || null,
            flow: data.flow || null,
            copy: data.copy || null,
          });
        } else {
          failed++;
        }
        completed++;
      }
    } catch (err) {
      console.warn(`\n  Batch error for ${slug}: ${err.message}`);
      completed += batch.length;
      failed += batch.length;
    }
    printProgress();

    // Incremental save
    const output = {
      slug,
      category,
      extractedAt: new Date().toISOString(),
      model: MODEL,
      totalScreens: allExtracted.length,
      screens: allExtracted,
    };
    writeFileSync(extractedPath, JSON.stringify(output, null, 2));
  }

  // Concurrency pool
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(
      (async () => {
        while (batchIndex < batches.length) {
          const idx = batchIndex++;
          if (idx >= batches.length) break;
          await processBatch(batches[idx]);
          await new Promise((r) => setTimeout(r, 500));
        }
      })()
    );
  }
  await Promise.all(workers);

  completedApps++;
  printProgress();

  return {
    slug,
    screensExtracted: allExtracted.length,
    outputPath: extractedPath,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const slugs = discoverManifests();
  totalApps = slugs.length;

  console.log(`Found ${slugs.length} app(s) with manifests`);

  // Count total screens to process
  const appScreenCounts = [];
  for (const slug of slugs) {
    const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const extractedPath = resolve(SCREENSHOT_DIR, `${slug}-extracted.json`);

    let screens = dedupCookieBanners(manifest.screens);

    if (!args.force && existsSync(extractedPath)) {
      try {
        const existing = JSON.parse(readFileSync(extractedPath, "utf-8"));
        const existingImages = new Set(existing.screens.map((s) => s.image));
        screens = screens.filter((s) => !existingImages.has(s.image));
      } catch {
        // treat as no existing
      }
    }

    appScreenCounts.push({ slug, count: screens.length, total: manifest.screens.length });
    totalScreens += screens.length;
  }

  const skipped = appScreenCounts.filter((a) => a.count === 0).length;

  console.log(`Total screens to extract: ${totalScreens} (${skipped} apps already complete)`);
  console.log(`Estimated cost: ~${formatCost(totalScreens)} with ${MODEL}`);
  console.log(`Batch size: ${BATCH_SIZE}, Concurrency: ${CONCURRENCY}\n`);

  if (totalScreens === 0) {
    console.log("Nothing to do. Use --force to re-extract all.");
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log("Dry run — would process:");
    for (const { slug, count, total } of appScreenCounts) {
      if (count > 0) {
        console.log(`  ${slug}: ${count}/${total} screens`);
      }
    }
    console.log(`\nTotal: ${totalScreens} screens, ~${formatCost(totalScreens)}`);
    process.exit(0);
  }

  // Process apps sequentially (concurrency is within each app's batches)
  const results = [];
  for (const slug of slugs) {
    const screenCount = appScreenCounts.find((a) => a.slug === slug)?.count || 0;
    if (screenCount === 0) {
      completedApps++;
      continue;
    }

    const result = await processApp(slug);
    if (result) results.push(result);
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n\n${"─".repeat(60)}`);
  console.log(`  Extraction complete`);
  console.log(`  Apps processed: ${results.length}/${slugs.length}`);
  console.log(`  Screens: ${completed - failed} extracted, ${failed} failed`);
  console.log(`  Time: ${formatTime(elapsed)} (${(completed / (elapsed / 1000 || 1)).toFixed(1)} img/s)`);
  console.log(`  Estimated cost: ~${formatCost(completed)}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
