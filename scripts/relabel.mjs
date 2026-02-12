#!/usr/bin/env node
/**
 * Re-label existing curated screenshots with Haiku vision.
 * Reads manifest.json, sends images to Haiku, updates labels in-place.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const SCREENSHOTS_DIR = join(process.cwd(), "public", "screenshots");
const BATCH_SIZE = 5;
const slugs = process.argv.slice(2).filter(s => !s.startsWith("--"));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY required.\n  export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

if (slugs.length === 0) {
  console.error("Usage: node scripts/relabel.mjs <slug1> <slug2> ...");
  process.exit(1);
}

const client = new Anthropic();

async function relabelApp(slug) {
  const manifestPath = join(SCREENSHOTS_DIR, `${slug}-manifest.json`);
  if (!existsSync(manifestPath)) {
    console.log(`⚠️  No manifest for ${slug}`);
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  console.log(`\n🏷️  Relabeling ${slug} (${manifest.screens.length} screenshots)...`);

  const screens = manifest.screens;
  const updatedScreens = [];

  for (let i = 0; i < screens.length; i += BATCH_SIZE) {
    const batch = screens.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(screens.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} images)...`);

    const content = [];
    for (const screen of batch) {
      const imgPath = join(process.cwd(), "public", screen.image);
      if (!existsSync(imgPath)) {
        console.log(`    ⚠️  Missing: ${screen.image}`);
        updatedScreens.push(screen);
        continue;
      }

      const imgData = readFileSync(imgPath).toString("base64");
      content.push(
        { type: "text", text: `Screenshot ${screen.step} (current flow: ${screen.flow}, current label: "${screen.label}"):` },
        { type: "image", source: { type: "base64", media_type: "image/png", data: imgData } }
      );
    }

    content.push({
      type: "text",
      text: `You are labeling screenshots of the crypto product "${slug}". For each screenshot above, provide a concise, descriptive label (8-15 words) and classify it into one of these flows: Home, Onboarding, Swap, Send, Staking, Settings.

Return ONLY a JSON array with one object per screenshot in order:
[{"label": "...", "flow": "..."}]

Be specific about what's shown — mention UI elements, data, states. Don't be generic.`
    });

    try {
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content }],
      });

      const text = resp.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log(`    ⚠️  No JSON in response, keeping original labels`);
        updatedScreens.push(...batch);
        continue;
      }

      const labels = JSON.parse(jsonMatch[0]);
      for (let j = 0; j < batch.length; j++) {
        const screen = { ...batch[j] };
        if (labels[j]) {
          screen.label = labels[j].label;
          screen.flow = labels[j].flow || screen.flow;
        }
        updatedScreens.push(screen);
        console.log(`    ✅ ${screen.flow}/${screen.step}: ${screen.label}`);
      }
    } catch (err) {
      console.log(`    ⚠️  API error: ${err.message}, keeping original labels`);
      updatedScreens.push(...batch);
    }

    // Small delay between batches
    if (i + BATCH_SIZE < screens.length) await new Promise(r => setTimeout(r, 1000));
  }

  // Recalculate step numbers per flow
  const flowSteps = {};
  for (const screen of updatedScreens) {
    flowSteps[screen.flow] = (flowSteps[screen.flow] || 0) + 1;
    screen.step = flowSteps[screen.flow];
  }

  manifest.screens = updatedScreens;
  manifest.totalScreenshots = updatedScreens.length;
  manifest.totalStates = updatedScreens.length;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ ${slug}: ${updatedScreens.length} labels updated → ${manifestPath}`);
}

for (const slug of slugs) {
  await relabelApp(slug);
}

console.log("\nDone! Run: node scripts/sync-manifests.mjs");
