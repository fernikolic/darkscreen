#!/usr/bin/env node

/**
 * Extract text bounding boxes from screenshots using Tesseract.js.
 *
 * Produces line-level bounding boxes (normalized 0-1 coordinates) so the
 * front-end can overlay search-term highlights on screenshot thumbnails.
 *
 * Output: src/data/ocr-boxes.json
 * Format: { "/screenshots/app-home.png": [[lineText, x, y, w, h], ...] }
 *
 * Usage:
 *   node scripts/extract-ocr-boxes.mjs                   # extract missing
 *   node scripts/extract-ocr-boxes.mjs --force            # re-extract all
 *   node scripts/extract-ocr-boxes.mjs --slug aave        # one app only
 *   node scripts/extract-ocr-boxes.mjs --concurrency 4    # parallel workers
 */

import { createWorker } from "tesseract.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const BOXES_PATH = resolve(PROJECT_ROOT, "public/data/ocr-boxes.json");

const { values: args } = parseArgs({
  options: {
    force: { type: "boolean", default: false },
    slug: { type: "string" },
    concurrency: { type: "string", default: "2" },
  },
  strict: false,
});

const CONCURRENCY = parseInt(args.concurrency, 10);

// ─── Load existing data ──────────────────────────────────────────────

let existing = {};
if (existsSync(BOXES_PATH) && !args.force) {
  try {
    existing = JSON.parse(readFileSync(BOXES_PATH, "utf-8"));
    console.log(`Loaded ${Object.keys(existing).length} existing entries`);
  } catch {
    existing = {};
  }
}

// ─── Collect screenshot paths from apps.ts ───────────────────────────

const appsFile = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
const imageRegex = /image:\s*"(\/screenshots\/[^"]+)"/g;
const imagePaths = [];
let match;
while ((match = imageRegex.exec(appsFile)) !== null) {
  imagePaths.push(match[1]);
}

const filteredPaths = args.slug
  ? imagePaths.filter((p) => p.includes(`/${args.slug}-`))
  : imagePaths;

const toExtract = filteredPaths.filter((p) => !existing[p]);
console.log(
  `Total: ${filteredPaths.length} | Cached: ${filteredPaths.length - toExtract.length} | To extract: ${toExtract.length}`
);

if (toExtract.length === 0) {
  console.log("Nothing to do. Use --force to re-extract all.");
  process.exit(0);
}

// ─── Progress ────────────────────────────────────────────────────────

const startTime = Date.now();
let completed = 0;
let failed = 0;

function printProgress() {
  const elapsed = Date.now() - startTime;
  const rate = completed > 0 ? completed / (elapsed / 1000) : 0;
  const remaining = rate > 0 ? (toExtract.length - completed) / rate : 0;
  const pct = ((completed / toExtract.length) * 100).toFixed(1);
  process.stdout.write(
    `\r  ${pct}% | ${completed}/${toExtract.length} | ${rate.toFixed(1)} img/s | ETA: ${Math.round(remaining)}s | Failed: ${failed}   `
  );
}

// ─── Parse TSV to extract line-level bounding boxes ──────────────────

function parseTsvToLines(tsv, imgWidth, imgHeight) {
  const rows = tsv.split("\n");
  // TSV cols: level, page, block, par, line, word, left, top, width, height, conf, text
  // level 5 = word level

  // Group words by line number
  const lineWords = new Map();

  for (const row of rows) {
    const cols = row.split("\t");
    if (cols.length < 12) continue;

    const level = parseInt(cols[0]);
    if (level !== 5) continue; // only word-level

    const lineNum = `${cols[1]}-${cols[2]}-${cols[3]}-${cols[4]}`; // unique line key
    const left = parseInt(cols[6]);
    const top = parseInt(cols[7]);
    const width = parseInt(cols[8]);
    const height = parseInt(cols[9]);
    const conf = parseFloat(cols[10]);
    const text = (cols[11] || "").trim();

    if (!text || conf < 15) continue;

    if (!lineWords.has(lineNum)) lineWords.set(lineNum, []);
    lineWords.get(lineNum).push({ text, left, top, width, height });
  }

  // Build line-level boxes
  const result = [];
  for (const words of lineWords.values()) {
    const lineText = words.map((w) => w.text).join(" ");
    if (lineText.length < 2) continue;

    const x0 = Math.min(...words.map((w) => w.left));
    const y0 = Math.min(...words.map((w) => w.top));
    const x1 = Math.max(...words.map((w) => w.left + w.width));
    const y1 = Math.max(...words.map((w) => w.top + w.height));

    const x = +(x0 / imgWidth).toFixed(4);
    const y = +(y0 / imgHeight).toFixed(4);
    const w = +((x1 - x0) / imgWidth).toFixed(4);
    const h = +((y1 - y0) / imgHeight).toFixed(4);

    if (w <= 0 || h <= 0 || w > 1 || h > 0.5) continue;

    result.push([lineText, x, y, w, h]);
  }

  return result;
}

// ─── Extract bounding boxes ──────────────────────────────────────────

async function extractBoxes(worker, imgPath) {
  const fullPath = resolve(PROJECT_ROOT, "public" + imgPath);
  if (!existsSync(fullPath)) return null;

  try {
    // Recognize with TSV output for bounding boxes
    const { data } = await worker.recognize(fullPath, {}, { tsv: true });

    if (!data.tsv) return null;

    // Get image dimensions for normalization
    const meta = await sharp(fullPath).metadata();
    if (!meta.width || !meta.height) return null;

    const lines = parseTsvToLines(data.tsv, meta.width, meta.height);
    return lines.length > 0 ? lines : null;
  } catch (err) {
    if (completed < 3) console.error(`\n  Error on ${imgPath}: ${err.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const results = { ...existing };

  // Create worker pool
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    const worker = await createWorker("eng");
    workers.push(worker);
  }

  console.log(`\nRunning with ${CONCURRENCY} Tesseract workers...\n`);

  let idx = 0;

  async function processNext(worker) {
    while (idx < toExtract.length) {
      const currentIdx = idx++;
      const imgPath = toExtract[currentIdx];

      const boxes = await extractBoxes(worker, imgPath);
      if (boxes) {
        results[imgPath] = boxes;
      } else {
        failed++;
      }

      completed++;
      printProgress();

      // Save every 100 images
      if (completed % 100 === 0) {
        writeFileSync(BOXES_PATH, JSON.stringify(results));
      }
    }
  }

  await Promise.all(workers.map((w) => processNext(w)));

  // Final save
  writeFileSync(BOXES_PATH, JSON.stringify(results));

  // Terminate workers
  await Promise.all(workers.map((w) => w.terminate()));

  const elapsed = Date.now() - startTime;
  const fileSizeKB = Math.round(readFileSync(BOXES_PATH).length / 1024);
  console.log(`\n\n${"─".repeat(60)}`);
  console.log(`  Extraction complete: ${Object.keys(results).length} screenshots`);
  console.log(`  New: ${completed - failed} ok, ${failed} failed`);
  console.log(`  Time: ${Math.round(elapsed / 1000)}s`);
  console.log(`  Output: ${BOXES_PATH} (${fileSizeKB} KB)`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
