#!/usr/bin/env node

/**
 * Label screenshots using Haiku — costs ~$0.05 per app.
 *
 * Reads the raw manifest from crawl-app.mjs, sends screenshots to Haiku
 * in batches for descriptive labeling and flow classification, then
 * generates the final manifest.json (same format as sync-manifests.mjs expects).
 *
 * Usage:
 *   node scripts/label-screenshots.mjs --slug lido
 *   node scripts/label-screenshots.mjs --slug lido --model claude-sonnet-4-5-20250929
 *
 * Pipeline:
 *   1. crawl-app.mjs          → raw screenshots + {slug}-raw.json   ($0.00)
 *   2. label-screenshots.mjs  → labeled {slug}-manifest.json        (~$0.05)
 *   3. sync-manifests.mjs     → updates apps.ts                     ($0.00)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, renameSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");

// ─── CLI ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    model: { type: "string", default: "claude-haiku-4-5-20251001" },
    batch: { type: "string", default: "5" },
    clean: { type: "boolean", default: false },
  },
  strict: false,
});

if (!args.slug) {
  console.error("Label screenshots using Haiku (~$0.05/app)\n");
  console.error("Usage: node scripts/label-screenshots.mjs --slug <slug>\n");
  console.error("Options:");
  console.error("  --model <id>   Model (default: claude-haiku-4-5-20251001)");
  console.error("  --batch <n>    Images per API call (default: 5)");
  console.error("  --clean        Remove raw files after labeling");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required for labeling.");
  console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const slug = args.slug;
const MODEL = args.model;
const BATCH_SIZE = parseInt(args.batch, 10);

// ─── Read raw manifest ───────────────────────────────────────────────

const rawPath = resolve(SCREENSHOT_DIR, `${slug}-raw.json`);
if (!existsSync(rawPath)) {
  console.error(`Raw manifest not found: ${rawPath}`);
  console.error(`Run the crawler first: node scripts/crawl-app.mjs --slug ${slug} --url <url>`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
console.log(`Labeling ${raw.totalScreenshots} screenshots for ${slug} (${raw.url})`);
console.log(`Model: ${MODEL} | Batch size: ${BATCH_SIZE}\n`);

// ─── Haiku labeling ──────────────────────────────────────────────────

const client = new Anthropic();

const FLOWS = ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"];

const SYSTEM_PROMPT = `You label screenshots from crypto web applications. For each image, provide:
1. A descriptive label (what the user sees on screen — 5-15 words)
2. A flow classification

Flow guide:
- Home: landing page, explore, markets, governance, portfolio, 404 error, search, general pages
- Onboarding: connect wallet modal, login, signup, registration
- Swap: trading, exchange, token swap, limit orders, recurring/DCA, perpetuals, token selector modal
- Send: transfer, bridge, withdrawal
- Staking: earn, stake, lend, borrow, rewards, savings, pool, liquidity, yield, vaults
- Settings: settings, preferences, language selector, menu dropdown, help, about, FAQ

Return ONLY a JSON array. No markdown fences, no explanation text.`;

async function labelBatch(batch) {
  const content = [];

  for (const screen of batch) {
    const imgPath = resolve(SCREENSHOT_DIR, screen.filename);
    if (!existsSync(imgPath)) {
      console.log(`  ⚠ Missing: ${screen.filename}`);
      continue;
    }

    const imgData = readFileSync(imgPath);
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: imgData.toString("base64") },
    });
    content.push({
      type: "text",
      text: `Image ${screen.index}: URL=${screen.url} | action=${screen.action} | context="${screen.context}"`,
    });
  }

  if (content.length === 0) return [];

  content.push({
    type: "text",
    text: `Label each image above. Return JSON array: [{"index": <n>, "label": "<description>", "flow": "<${FLOWS.join("|")}>"}]`,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0]?.text || "[]";

  // Robust JSON extraction — handles markdown fences and surrounding text
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.log(`  ⚠ No JSON array in response: ${text.slice(0, 100)}`);
    return [];
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    console.log(`  ⚠ Invalid JSON: ${match[0].slice(0, 100)}`);
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const labeled = [];
  const totalBatches = Math.ceil(raw.screens.length / BATCH_SIZE);

  for (let i = 0; i < raw.screens.length; i += BATCH_SIZE) {
    const batch = raw.screens.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} images)...`);

    try {
      const labels = await labelBatch(batch);

      for (const label of labels) {
        const screen = batch.find((s) => s.index === label.index);
        if (screen && FLOWS.includes(label.flow)) {
          labeled.push({ ...screen, label: label.label, flow: label.flow });
        }
      }

      // Report unlabeled screenshots in this batch
      const labeledIndices = new Set(labels.map((l) => l.index));
      const missed = batch.filter((s) => !labeledIndices.has(s.index));
      if (missed.length > 0) {
        console.log(`    ${missed.length} unlabeled — using fallback`);
        for (const s of missed) {
          labeled.push({ ...s, label: s.context || `Screenshot ${s.index}`, flow: "Home" });
        }
      }
    } catch (err) {
      console.log(`  ⚠ Batch ${batchNum} failed: ${err.message}`);
      // Fallback: use raw context, classify as Home
      for (const screen of batch) {
        labeled.push({
          ...screen,
          label: screen.context || `Screenshot ${screen.index}`,
          flow: "Home",
        });
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < raw.screens.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ─── Group by flow, assign step numbers, rename files ──────────────

  const byFlow = {};
  for (const s of labeled) {
    if (!byFlow[s.flow]) byFlow[s.flow] = [];
    byFlow[s.flow].push(s);
  }

  const screens = [];

  for (const [flow, items] of Object.entries(byFlow)) {
    items.forEach((item, i) => {
      const step = i + 1;
      const desc = item.label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const newFilename = `${slug}-${flow.toLowerCase()}-${step}-${desc}.png`;

      const oldPath = resolve(SCREENSHOT_DIR, item.filename);
      const newPath = resolve(SCREENSHOT_DIR, newFilename);

      if (existsSync(oldPath) && oldPath !== newPath) {
        try {
          renameSync(oldPath, newPath);
        } catch (e) {
          console.log(`  ⚠ Rename failed: ${item.filename} → ${newFilename}`);
        }
      }

      screens.push({
        step,
        label: item.label,
        flow,
        image: `/screenshots/${newFilename}`,
      });
    });
  }

  // ─── Generate manifest ─────────────────────────────────────────────

  const manifest = {
    slug,
    url: raw.url,
    crawledAt: raw.crawledAt,
    totalScreenshots: screens.length,
    totalStates: screens.length,
    screens,
  };

  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Clean up raw manifest if requested
  if (args.clean) {
    try {
      const { unlinkSync } = await import("fs");
      unlinkSync(rawPath);
      console.log("  Cleaned up raw manifest");
    } catch {}
  }

  // ─── Summary ───────────────────────────────────────────────────────

  const flowSummary = Object.entries(byFlow)
    .map(([f, items]) => `${f}: ${items.length}`)
    .join(", ");

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Labeled ${screens.length} screenshots for ${slug}`);
  console.log(`  Flows: ${flowSummary}`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`\n  Next: node scripts/sync-manifests.mjs --slug ${slug}`);
  console.log(`${"─".repeat(60)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
