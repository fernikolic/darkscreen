#!/usr/bin/env node

/**
 * Generate AI-powered insights from diff data.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-insights.mjs
 *
 * Reads *-diff.json files from the data directory,
 * sends significant diffs (>3% change) to Claude API,
 * and writes results to src/data/insights.ts.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT_FILE = path.join(ROOT, "src", "data", "insights.ts");

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MIN_DIFF_PERCENT = 3;
const BATCH_SIZE = 5;
const MODEL = "claude-sonnet-4-6";

if (!API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
  process.exit(1);
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function findDiffFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith("-diff.json"))
    .map((f) => path.join(DATA_DIR, f));
}

function loadExistingInsights() {
  try {
    const content = fs.readFileSync(OUTPUT_FILE, "utf8");
    const match = content.match(/export const insightsBySlug.*?=\s*({[\s\S]*});/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch {
    // File doesn't exist or can't be parsed
  }
  return {};
}

async function generateInsightForDiff(diff) {
  const prompt = `You are analyzing a UI change detected in a crypto product. Generate a concise insight.

App: ${diff.appName} (${diff.appSlug})
Category: ${diff.category || "Unknown"}
Screen: ${diff.screenLabel || "Unknown"}
Flow: ${diff.flow || "Unknown"}
Date: ${diff.date}
Diff percentage: ${diff.diffPercent?.toFixed(1)}%
Change description: ${diff.description || "Visual change detected"}

Respond with a JSON object (no markdown, just raw JSON):
{
  "title": "Short descriptive title (max 80 chars)",
  "summary": "One-sentence summary of the change and its significance",
  "analysis": "2-3 sentence analysis: what changed, why it likely matters, what other teams can learn",
  "impact": "low|medium|high",
  "category": "UX Change|Feature Launch|Design Trend|Copy Update|Flow Change|Competitive Move"
}`;

  const response = await callClaude(prompt);

  try {
    // Try to parse JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn(`  Failed to parse insight for ${diff.appSlug}: ${e.message}`);
  }
  return null;
}

async function main() {
  console.log("Generating insights from diff data...\n");

  const diffFiles = findDiffFiles();
  if (diffFiles.length === 0) {
    console.log("No diff files found in data/ directory.");
    console.log("Run the diff pipeline first to generate *-diff.json files.");
    return;
  }

  console.log(`Found ${diffFiles.length} diff file(s)`);

  const existingInsights = loadExistingInsights();
  const newInsights = { ...existingInsights };
  let totalGenerated = 0;

  for (const diffFile of diffFiles) {
    const slug = path.basename(diffFile, "-diff.json");
    console.log(`\nProcessing: ${slug}`);

    const diffs = JSON.parse(fs.readFileSync(diffFile, "utf8"));

    // Filter to significant diffs only
    const significant = diffs.filter(
      (d) => d.diffPercent && d.diffPercent > MIN_DIFF_PERCENT
    );

    if (significant.length === 0) {
      console.log(`  No significant diffs (>${MIN_DIFF_PERCENT}%)`);
      continue;
    }

    console.log(`  ${significant.length} significant diff(s)`);

    // Skip already-processed diffs (idempotency)
    const existingDates = new Set(
      (existingInsights[slug] || []).map((i) => `${i.date}-${i.screenLabel}`)
    );

    const toProcess = significant.filter(
      (d) => !existingDates.has(`${d.date}-${d.screenLabel}`)
    );

    if (toProcess.length === 0) {
      console.log("  All diffs already processed");
      continue;
    }

    // Process in batches
    if (!newInsights[slug]) newInsights[slug] = existingInsights[slug] || [];

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((diff) => generateInsightForDiff(diff))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const diff = batch[j];
        if (!result) continue;

        newInsights[slug].push({
          slug,
          date: diff.date,
          title: result.title,
          summary: result.summary,
          analysis: result.analysis,
          impact: result.impact,
          category: result.category,
          beforeImage: diff.beforeImage,
          afterImage: diff.afterImage,
          diffPercent: diff.diffPercent,
          flow: diff.flow,
          screenLabel: diff.screenLabel,
        });
        totalGenerated++;
      }
    }
  }

  // Write output file
  const output = `export type InsightCategory =
  | "UX Change"
  | "Feature Launch"
  | "Design Trend"
  | "Copy Update"
  | "Flow Change"
  | "Competitive Move";

export interface Insight {
  slug: string;
  date: string;
  title: string;
  summary: string;
  analysis: string;
  impact: "low" | "medium" | "high";
  category: InsightCategory;
  beforeImage?: string;
  afterImage?: string;
  diffPercent?: number;
  flow?: string;
  screenLabel?: string;
}

/**
 * Generated by scripts/generate-insights.mjs
 * Run: ANTHROPIC_API_KEY=... node scripts/generate-insights.mjs
 *
 * Last generated: ${new Date().toISOString()}
 */
export const insightsBySlug: Record<string, Insight[]> = ${JSON.stringify(newInsights, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`\nDone! Generated ${totalGenerated} new insight(s).`);
  console.log(`Total insights: ${Object.values(newInsights).flat().length}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
