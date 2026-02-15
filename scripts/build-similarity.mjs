#!/usr/bin/env node

/**
 * Build pre-computed similarity index from CLIP embeddings.
 *
 * Reads embeddings.bin + embedding-index.json, computes pairwise cosine
 * similarity, and outputs similarity.json with top-N similar screens per image.
 *
 * Usage:
 *   node scripts/build-similarity.mjs
 *   node scripts/build-similarity.mjs --top 20    # top N similar (default: 20)
 *
 * Run after: python scripts/generate-embeddings.py
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const EMBEDDINGS_BIN = resolve(PROJECT_ROOT, "src/data/embeddings.bin");
const INDEX_FILE = resolve(PROJECT_ROOT, "src/data/embedding-index.json");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "src/data/similarity.json");

const { values: args } = parseArgs({
  options: {
    top: { type: "string", default: "20" },
  },
  strict: false,
});

const TOP_N = parseInt(args.top, 10);

if (!existsSync(EMBEDDINGS_BIN) || !existsSync(INDEX_FILE)) {
  console.error("Missing embeddings. Run first:");
  console.error("  python scripts/generate-embeddings.py");
  process.exit(1);
}

// ─── Load data ──────────────────────────────────────────────────────────

const index = JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
const buffer = readFileSync(EMBEDDINGS_BIN);
const DIMS = 512; // CLIP ViT-B/32 dimension
const numImages = index.length;

console.log(`Loaded ${numImages} embeddings (${DIMS} dimensions each)`);

// Parse binary into Float32Arrays
const embeddings = [];
for (let i = 0; i < numImages; i++) {
  const offset = i * DIMS * 4; // 4 bytes per float32
  const floats = new Float32Array(buffer.buffer, buffer.byteOffset + offset, DIMS);
  embeddings.push(floats);
}

// ─── Compute cosine similarity ──────────────────────────────────────────

function cosineSim(a, b) {
  let dot = 0;
  for (let i = 0; i < DIMS; i++) {
    dot += a[i] * b[i];
  }
  // Embeddings are already normalized, so dot product = cosine similarity
  return dot;
}

console.log(`Computing pairwise similarity (${numImages}x${numImages})...`);

const similarity = {};
const startTime = Date.now();

for (let i = 0; i < numImages; i++) {
  const scores = [];
  for (let j = 0; j < numImages; j++) {
    if (i === j) continue;
    scores.push({ idx: j, score: cosineSim(embeddings[i], embeddings[j]) });
  }

  // Sort by similarity descending, take top N
  scores.sort((a, b) => b.score - a.score);
  similarity[index[i]] = scores.slice(0, TOP_N).map((s) => index[s.idx]);

  if ((i + 1) % 100 === 0 || i === numImages - 1) {
    const pct = ((i + 1) / numImages * 100).toFixed(1);
    process.stdout.write(`\r  [${i + 1}/${numImages}] ${pct}%`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n\nComputed in ${elapsed}s`);

// ─── Save ───────────────────────────────────────────────────────────────

writeFileSync(OUTPUT_FILE, JSON.stringify(similarity, null, 2));
const sizeMB = (readFileSync(OUTPUT_FILE).length / 1024 / 1024).toFixed(1);
console.log(`Saved: ${OUTPUT_FILE} (${sizeMB} MB, ${numImages} entries, top ${TOP_N} each)`);
