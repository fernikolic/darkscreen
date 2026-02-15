#!/usr/bin/env node

/**
 * Extract visible text from all screenshots using Claude Vision.
 *
 * Reads every PNG in public/screenshots that's referenced in apps.ts,
 * sends each to Claude Vision, and saves extracted text to src/data/ocr.json.
 * This text is used by the client-side search index (Fuse.js).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/extract-ocr.mjs
 *   node scripts/extract-ocr.mjs --force            # re-extract all
 *   node scripts/extract-ocr.mjs --batch 10          # images per API call
 *   node scripts/extract-ocr.mjs --concurrency 5     # parallel API calls
 *   node scripts/extract-ocr.mjs --slug aave         # only one app
 *
 * Cost: ~$0.01 per screenshot with Haiku (~$40 for 4,000 screenshots)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const OCR_PATH = resolve(PROJECT_ROOT, "src/data/ocr.json");

const { values: args } = parseArgs({
  options: {
    force: { type: "boolean", default: false },
    batch: { type: "string", default: "5" },
    concurrency: { type: "string", default: "3" },
    model: { type: "string", default: "claude-haiku-4-5-20251001" },
    slug: { type: "string" },
  },
  strict: false,
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required.");
  console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const BATCH_SIZE = parseInt(args.batch, 10);
const CONCURRENCY = parseInt(args.concurrency, 10);
const MODEL = args.model;
const client = new Anthropic();

// ─── Load existing OCR data ───────────────────────────────────────────

let existing = {};
if (existsSync(OCR_PATH) && !args.force) {
  try {
    existing = JSON.parse(readFileSync(OCR_PATH, "utf-8"));
    console.log(`Loaded ${Object.keys(existing).length} existing OCR entries`);
  } catch {
    existing = {};
  }
}

// ─── Collect all screenshot image paths from apps data ────────────────

const appsFile = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
const imageRegex = /image:\s*"(\/screenshots\/[^"]+)"/g;
const imagePaths = [];
let match;
while ((match = imageRegex.exec(appsFile)) !== null) {
  imagePaths.push(match[1]);
}

console.log(`Found ${imagePaths.length} screenshots referenced in apps.ts`);

// Filter by slug if specified
const filteredPaths = args.slug
  ? imagePaths.filter((p) => p.includes(`/${args.slug}-`))
  : imagePaths;

if (args.slug) {
  console.log(`Filtered to ${filteredPaths.length} screenshots for slug "${args.slug}"`);
}

// Filter out already-extracted (unless --force)
const toExtract = filteredPaths.filter((p) => !existing[p]);
console.log(`Need to extract: ${toExtract.length} (${filteredPaths.length - toExtract.length} cached)\n`);

if (toExtract.length === 0) {
  console.log("Nothing to do. Use --force to re-extract all.");
  process.exit(0);
}

// ─── Progress tracking ───────────────────────────────────────────────

const startTime = Date.now();
let completed = 0;
let failed = 0;

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m ${remainSec}s`;
}

function printProgress() {
  const elapsed = Date.now() - startTime;
  const rate = completed > 0 ? elapsed / completed : 0;
  const remaining = (toExtract.length - completed) * rate;
  const pct = ((completed / toExtract.length) * 100).toFixed(1);

  const filledLen = Math.floor(completed / toExtract.length * 30);
  const bar = "\u2588".repeat(filledLen) + "\u2591".repeat(30 - filledLen);

  process.stdout.write(
    `\r  ${bar} ${pct}% | ${completed}/${toExtract.length} | ` +
    `${(completed / (elapsed / 1000)).toFixed(1)} img/s | ` +
    `ETA: ${formatTime(Math.round(remaining))} | ` +
    `Failed: ${failed}   `
  );
}

// ─── Extract text via Claude Vision ───────────────────────────────────

const SYSTEM = `You extract all visible text from UI screenshots. Return ONLY the text you can read on screen — buttons, labels, headings, navigation items, numbers, tooltips, error messages, placeholder text. Separate distinct UI elements with newlines. Do not describe the UI, just extract the raw text content. If you can't read any text, return "NO_TEXT".`;

async function extractBatch(paths) {
  const content = [];

  for (const imgPath of paths) {
    const fullPath = resolve(PROJECT_ROOT, "public" + imgPath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const imgData = readFileSync(fullPath);
    // Detect actual format from file header (some JPEGs have .png extension)
    const header = imgData.slice(0, 4).toString("hex");
    const mediaType = header.startsWith("ffd8") ? "image/jpeg" : "image/png";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: imgData.toString("base64") },
    });
    content.push({
      type: "text",
      text: `Image: ${imgPath}`,
    });
  }

  if (content.length === 0) return {};

  content.push({
    type: "text",
    text: `Extract all visible text from each image above. Return a JSON object where keys are the image paths and values are the extracted text (as a single string with newlines between UI elements). Example: {"/screenshots/app-home.png": "Dashboard\\nPortfolio\\n$1,234.56\\nSwap\\nSend"}`,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0]?.text || "{}";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  const results = { ...existing };

  // Split into batches
  const batches = [];
  for (let i = 0; i < toExtract.length; i += BATCH_SIZE) {
    batches.push(toExtract.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches with concurrency ${CONCURRENCY}...\n`);

  // Process batches with concurrency limit
  let batchIndex = 0;

  async function processBatch(batch) {
    try {
      const extracted = await extractBatch(batch);
      let count = 0;
      for (const [path, text] of Object.entries(extracted)) {
        if (text && text !== "NO_TEXT") {
          results[path] = text;
          count++;
        }
      }
      completed += batch.length;
      if (batch.length - count > 0) failed += batch.length - count;
    } catch (err) {
      completed += batch.length;
      failed += batch.length;
    }

    printProgress();

    // Save incrementally (in case of crash)
    writeFileSync(OCR_PATH, JSON.stringify(results, null, 2));
  }

  // Run batches with concurrency pool
  async function runPool() {
    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push(
        (async () => {
          while (batchIndex < batches.length) {
            const idx = batchIndex++;
            if (idx >= batches.length) break;
            await processBatch(batches[idx]);
            // Rate limit per worker
            await new Promise((r) => setTimeout(r, 500));
          }
        })()
      );
    }
    await Promise.all(workers);
  }

  await runPool();

  const elapsed = Date.now() - startTime;
  console.log(`\n\n${"─".repeat(60)}`);
  console.log(`  OCR complete: ${Object.keys(results).length} screenshots indexed`);
  console.log(`  New extractions: ${completed - failed} successful, ${failed} failed`);
  console.log(`  Time: ${formatTime(elapsed)} (${(completed / (elapsed / 1000)).toFixed(1)} img/s)`);
  console.log(`  Output: ${OCR_PATH}`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
