#!/usr/bin/env node

/**
 * Detect UI component bounding boxes from screenshots using Claude Vision.
 *
 * Reads {slug}-manifest.json files, sends each screenshot to Claude Vision,
 * and detects UI element bounding boxes with percentage-based coordinates.
 * Outputs to src/data/elements.json.
 *
 * Usage:
 *   node scripts/detect-elements.mjs --slug aave        # single app
 *   node scripts/detect-elements.mjs --all              # all apps with manifests
 *   node scripts/detect-elements.mjs --all --force      # re-detect everything
 *   node scripts/detect-elements.mjs --all --model claude-sonnet-4-5-20250929
 *   node scripts/detect-elements.mjs --dry-run          # preview what would run
 *
 * Requires: ANTHROPIC_API_KEY environment variable.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const ELEMENTS_FILE = resolve(PROJECT_ROOT, "src/data/elements.json");

// ─── Granular Element Tags ───────────────────────────────────────────────

const GRANULAR_ELEMENT_TAGS = [
  "Modal / Dialog",
  "Form / Input",
  "Data Table",
  "Navigation",
  "Empty State",
  "Onboarding / Walkthrough",
  "Dashboard / Overview",
  "Settings / Preferences",
  "Chart / Graph",
  "Card Layout",
  "List View",
  "Search",
  "Notification / Alert",
  "Profile / Account",
  "Error Page",
  "Loading State",
  "Token Selector",
  "Swap Form",
  "Price Chart",
  "Gas Estimator",
  "Wallet Connect Button",
  "Transaction Confirmation",
  "Portfolio Pie Chart",
  "APY / Yield Display",
  "Staking Form",
  "Bridge Selector",
  "Token Balance",
  "Network Selector",
  "Slippage Settings",
  "Transaction History",
  "Address Input",
  "QR Code",
  "Price Ticker",
  "Volume Bar Chart",
  "Order Book",
  "Liquidity Pool Card",
  "Fee Breakdown",
  "Approval Button",
  "Progress Stepper",
  "Banner / Announcement",
  "Tooltip / Popover",
  "Copy Address Button",
  "Explorer Link",
  "Token Logo Grid",
  "Countdown Timer",
];

// ─── CLI Args ────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    model: { type: "string", default: "claude-haiku-4-5-20251001" },
    concurrency: { type: "string", default: "3" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

if (!args.slug && !args.all) {
  console.error("Usage: node scripts/detect-elements.mjs --slug <slug> | --all");
  console.error("  --force            Re-detect even if data exists");
  console.error("  --model <m>        Claude model (default: claude-haiku-4-5-20251001)");
  console.error("  --concurrency <n>  Parallel workers (default: 3)");
  console.error("  --dry-run          Preview without API calls");
  process.exit(1);
}

if (!args["dry-run"] && !process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required.");
  console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const CONCURRENCY = parseInt(args.concurrency, 10);
const MODEL = args.model;
const DRY_RUN = args["dry-run"];
const client = DRY_RUN ? null : new Anthropic();

// ─── Vision Prompt ───────────────────────────────────────────────────────

const TAG_LIST = GRANULAR_ELEMENT_TAGS.map((t) => `"${t}"`).join(", ");

const DETECTION_PROMPT = `Analyze this crypto product screenshot and detect all distinct UI components. For each component, return:
- tag: one of the following types: [${TAG_LIST}]
- x: percentage from left edge (0-100)
- y: percentage from top edge (0-100)
- width: percentage of viewport width (0-100)
- height: percentage of viewport height (0-100)
- confidence: 0.0 to 1.0

Return JSON array only, no other text. Example:
[{"tag": "Token Selector", "x": 5, "y": 30, "width": 40, "height": 15, "confidence": 0.9}]

Detect components like navigation bars, forms, token selectors, charts, buttons, modals, data tables, etc.
Only include components with confidence > 0.6.`;

// ─── Discover manifests ──────────────────────────────────────────────────

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
  const files = readdirSync(SCREENSHOT_DIR).filter((f) =>
    f.endsWith("-manifest.json")
  );
  return files.map((f) => f.replace("-manifest.json", "")).sort();
}

// ─── Load / save elements.json ───────────────────────────────────────────

function loadElements() {
  if (existsSync(ELEMENTS_FILE)) {
    try {
      return JSON.parse(readFileSync(ELEMENTS_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveElements(data) {
  writeFileSync(ELEMENTS_FILE, JSON.stringify(data, null, 2));
}

// ─── Detect elements for a single screen ─────────────────────────────────

async function detectScreen(imagePath) {
  const fullPath = resolve(PROJECT_ROOT, "public" + imagePath);
  if (!existsSync(fullPath)) {
    console.warn(`  Missing image: ${imagePath}`);
    return null;
  }

  const imgData = readFileSync(fullPath);
  const header = imgData.slice(0, 4).toString("hex");
  const mediaType = header.startsWith("ffd8") ? "image/jpeg" : "image/png";

  let retries = 0;
  const maxRetries = 3;
  const delays = [2000, 4000, 8000];

  while (retries <= maxRetries) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imgData.toString("base64"),
                },
              },
              {
                type: "text",
                text: DETECTION_PROMPT,
              },
            ],
          },
        ],
      });

      const text = response.content[0]?.text || "[]";

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // Filter confidence > 0.6 and validate structure
        return parsed.filter(
          (el) =>
            el &&
            typeof el.tag === "string" &&
            typeof el.x === "number" &&
            typeof el.y === "number" &&
            typeof el.width === "number" &&
            typeof el.height === "number" &&
            typeof el.confidence === "number" &&
            el.confidence > 0.6
        );
      } catch {
        // Try cleaning common JSON issues
        const cleaned = jsonMatch[0]
          .replace(/,\s*]/g, "]")
          .replace(/,\s*}/g, "}");
        try {
          const parsed = JSON.parse(cleaned);
          return parsed.filter(
            (el) =>
              el &&
              typeof el.tag === "string" &&
              typeof el.confidence === "number" &&
              el.confidence > 0.6
          );
        } catch {
          console.warn(`  Failed to parse JSON for ${imagePath}`);
          return [];
        }
      }
    } catch (err) {
      if ((err.status === 429 || err.status === 529) && retries < maxRetries) {
        retries++;
        console.warn(
          `\n  ${err.status === 429 ? "Rate limited" : "API overloaded"}, retrying in ${delays[retries - 1] / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, delays[retries - 1]));
        continue;
      }
      throw err;
    }
  }

  return [];
}

// ─── Progress tracking ───────────────────────────────────────────────────

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
  const costPerScreen = MODEL.includes("haiku")
    ? 0.001
    : MODEL.includes("sonnet")
      ? 0.006
      : 0.03;
  return `$${(screens * costPerScreen).toFixed(2)}`;
}

function printProgress() {
  const elapsed = Date.now() - startTime;
  const rate = completed > 0 ? elapsed / completed : 0;
  const remaining = (totalScreens - completed) * rate;
  const pct =
    totalScreens > 0 ? ((completed / totalScreens) * 100).toFixed(1) : "0.0";

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

async function processApp(slug, elements) {
  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);

  if (!existsSync(manifestPath)) {
    console.warn(`  No manifest found for ${slug}, skipping`);
    completedApps++;
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  let screens = manifest.screens || [];

  // Filter already-detected unless --force
  if (!args.force) {
    screens = screens.filter((s) => !elements[s.image]);
  }

  if (screens.length === 0) {
    completedApps++;
    return;
  }

  console.log(`\n  ${slug}: ${screens.length} screen(s) to process`);

  // Concurrency pool: process screens in parallel with limit
  let screenIndex = 0;

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(
      (async () => {
        while (screenIndex < screens.length) {
          const idx = screenIndex++;
          if (idx >= screens.length) break;

          const screen = screens[idx];
          try {
            const detected = await detectScreen(screen.image);
            if (detected !== null) {
              elements[screen.image] = detected;
            } else {
              failed++;
            }
            completed++;
          } catch (err) {
            console.warn(`\n  Error detecting ${screen.image}: ${err.message}`);
            completed++;
            failed++;
          }

          printProgress();

          // Incremental save every 10 screens
          if (completed % 10 === 0) {
            saveElements(elements);
          }

          // Small delay to avoid hammering API
          await new Promise((r) => setTimeout(r, 300));
        }
      })()
    );
  }

  await Promise.all(workers);

  // Save after each app completes
  saveElements(elements);

  completedApps++;
  printProgress();
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const slugs = discoverManifests();
  totalApps = slugs.length;

  console.log(`Found ${slugs.length} app(s) with manifests`);

  // Load existing elements data
  const elements = loadElements();
  const existingCount = Object.keys(elements).length;
  if (existingCount > 0) {
    console.log(`Existing detections: ${existingCount} screen(s)`);
  }

  // Count total screens to process
  const appScreenCounts = [];
  for (const slug of slugs) {
    const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
    if (!existsSync(manifestPath)) {
      appScreenCounts.push({ slug, count: 0, total: 0 });
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    let screens = manifest.screens || [];
    const total = screens.length;

    if (!args.force) {
      screens = screens.filter((s) => !elements[s.image]);
    }

    appScreenCounts.push({ slug, count: screens.length, total });
    totalScreens += screens.length;
  }

  const skipped = appScreenCounts.filter((a) => a.count === 0).length;

  console.log(
    `Total screens to detect: ${totalScreens} (${skipped} app(s) already complete)`
  );
  console.log(`Estimated cost: ~${formatCost(totalScreens)} with ${MODEL}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  if (totalScreens === 0) {
    console.log("Nothing to do. Use --force to re-detect all.");
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

  // Process apps sequentially (concurrency is within each app's screens)
  for (const slug of slugs) {
    const screenCount =
      appScreenCounts.find((a) => a.slug === slug)?.count || 0;
    if (screenCount === 0) {
      completedApps++;
      continue;
    }

    await processApp(slug, elements);
  }

  // Final save
  saveElements(elements);

  const elapsed = Date.now() - startTime;
  const totalDetected = Object.keys(elements).length;
  const totalElements = Object.values(elements).flat().length;

  console.log(`\n\n${"─".repeat(60)}`);
  console.log(`  Element detection complete`);
  console.log(`  Apps processed: ${completedApps}/${slugs.length}`);
  console.log(
    `  Screens: ${completed - failed} detected, ${failed} failed`
  );
  console.log(
    `  Total: ${totalDetected} screens with ${totalElements} elements in elements.json`
  );
  console.log(
    `  Time: ${formatTime(elapsed)} (${(completed / (elapsed / 1000 || 1)).toFixed(1)} img/s)`
  );
  console.log(`  Estimated cost: ~${formatCost(completed)}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
