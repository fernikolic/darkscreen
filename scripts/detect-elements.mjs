#!/usr/bin/env node

/**
 * Detect UI elements in screenshots using Claude Vision.
 *
 * Sends each screenshot to Claude Vision requesting element types + bounding boxes.
 * Outputs to src/data/elements.json.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/detect-elements.mjs
 *   node scripts/detect-elements.mjs --force           # re-detect all
 *   node scripts/detect-elements.mjs --slug uniswap    # only one app
 *   node scripts/detect-elements.mjs --concurrency 3   # parallel API calls
 *   node scripts/detect-elements.mjs --batch 3         # images per API call
 *
 * Cost: ~$0.02 per screenshot with Haiku = ~$80 for 4K screenshots
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const ELEMENTS_PATH = resolve(PROJECT_ROOT, "src/data/elements.json");

const { values: args } = parseArgs({
  options: {
    force: { type: "boolean", default: false },
    batch: { type: "string", default: "3" },
    concurrency: { type: "string", default: "3" },
    model: { type: "string", default: "claude-haiku-4-5-20251001" },
    slug: { type: "string" },
  },
  strict: false,
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required.");
  process.exit(1);
}

const BATCH_SIZE = parseInt(args.batch, 10);
const CONCURRENCY = parseInt(args.concurrency, 10);
const MODEL = args.model;
const client = new Anthropic();

const ELEMENT_TYPES = [
  "Modal / Dialog", "Form / Input", "Data Table", "Navigation", "Empty State",
  "Onboarding / Walkthrough", "Dashboard / Overview", "Settings / Preferences",
  "Chart / Graph", "Card Layout", "List View", "Search", "Notification / Alert",
  "Profile / Account", "Error Page", "Loading State",
  "Token Selector", "Swap Form", "Price Chart", "Gas Estimator",
  "Wallet Connect Button", "Transaction Confirmation", "Portfolio Pie Chart",
  "APY / Yield Display", "Staking Form", "Bridge Selector", "Token Balance",
  "Network Selector", "Slippage Settings", "Transaction History", "Address Input",
  "QR Code", "Price Ticker", "Volume Bar Chart", "Order Book",
  "Liquidity Pool Card", "Fee Breakdown", "Approval Button", "Progress Stepper",
  "Banner / Announcement", "Tooltip / Popover", "Copy Address Button",
  "Explorer Link", "Token Logo Grid", "Countdown Timer",
];

// ─── Load existing data ─────────────────────────────────────────────────

let existing = {};
if (existsSync(ELEMENTS_PATH) && !args.force) {
  try {
    existing = JSON.parse(readFileSync(ELEMENTS_PATH, "utf-8"));
    console.log(`Loaded ${Object.keys(existing).length} existing element entries`);
  } catch {
    existing = {};
  }
}

// ─── Collect image paths ────────────────────────────────────────────────

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

const toDetect = filteredPaths.filter((p) => !existing[p]);
console.log(`Found ${filteredPaths.length} screenshots, need to detect: ${toDetect.length}\n`);

if (toDetect.length === 0) {
  console.log("Nothing to do. Use --force to re-detect all.");
  process.exit(0);
}

// ─── Progress ───────────────────────────────────────────────────────────

const startTime = Date.now();
let completed = 0;
let failed = 0;

function printProgress() {
  const elapsed = Date.now() - startTime;
  const pct = ((completed / toDetect.length) * 100).toFixed(1);
  const filledLen = Math.floor(completed / toDetect.length * 30);
  const bar = "\u2588".repeat(filledLen) + "\u2591".repeat(30 - filledLen);
  process.stdout.write(
    `\r  ${bar} ${pct}% | ${completed}/${toDetect.length} | Failed: ${failed}   `
  );
}

// ─── Detection ──────────────────────────────────────────────────────────

const SYSTEM = `You are a UI element detector for cryptocurrency app screenshots. For each screenshot, identify all visible UI components and return their bounding boxes as percentage coordinates.

Return a JSON object where keys are image paths and values are arrays of detected elements. Each element has:
- tag: one of the provided element types
- x: left edge as percentage (0-100)
- y: top edge as percentage (0-100)
- width: width as percentage (0-100)
- height: height as percentage (0-100)
- confidence: 0.0-1.0

Only include elements you can clearly identify. Focus on the most prominent UI components.

Available element types: ${ELEMENT_TYPES.join(", ")}`;

async function detectBatch(paths) {
  const content = [];

  for (const imgPath of paths) {
    const fullPath = resolve(PROJECT_ROOT, "public" + imgPath);
    if (!existsSync(fullPath)) continue;

    const imgData = readFileSync(fullPath);
    const header = imgData.slice(0, 4).toString("hex");
    const mediaType = header.startsWith("ffd8") ? "image/jpeg" : "image/png";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: imgData.toString("base64") },
    });
    content.push({ type: "text", text: `Image: ${imgPath}` });
  }

  if (content.length === 0) return {};

  content.push({
    type: "text",
    text: `Detect UI elements in each image. Return JSON: {"<path>": [{"tag": "...", "x": N, "y": N, "width": N, "height": N, "confidence": N}, ...]}`,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0]?.text || "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const results = { ...existing };
  const batches = [];
  for (let i = 0; i < toDetect.length; i += BATCH_SIZE) {
    batches.push(toDetect.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches with concurrency ${CONCURRENCY}...\n`);

  let batchIndex = 0;

  async function processBatch(batch) {
    try {
      const detected = await detectBatch(batch);
      for (const [path, elements] of Object.entries(detected)) {
        if (Array.isArray(elements) && elements.length > 0) {
          results[path] = elements;
        }
      }
      completed += batch.length;
    } catch {
      completed += batch.length;
      failed += batch.length;
    }
    printProgress();
    writeFileSync(ELEMENTS_PATH, JSON.stringify(results, null, 2));
  }

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

  const totalElements = Object.values(results).reduce(
    (s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0
  );
  console.log(`\n\n${"─".repeat(60)}`);
  console.log(`  Detection complete: ${Object.keys(results).length} screenshots, ${totalElements} elements`);
  console.log(`  Output: ${ELEMENTS_PATH}`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
