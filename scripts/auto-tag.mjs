#!/usr/bin/env node

/**
 * Auto-tag screens in apps.ts based on label + flow inference rules.
 * Adds tags: [...] to screen entries that don't already have them.
 *
 * Usage: node scripts/auto-tag.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPS_FILE = resolve(__dirname, "..", "src/data/apps.ts");

// ─── Tag rules ────────────────────────────────────────────────────────────

function inferTags(label, flow, image) {
  const tags = [];
  const l = (label || "").toLowerCase();
  const f = (flow || "").toLowerCase();

  // Flow-based tags
  if (f === "settings") tags.push("Settings / Preferences");
  if (f === "onboarding") tags.push("Onboarding / Walkthrough");

  // Label pattern matching
  if (/modal|overlay|popup|dialog|banner|cookie|dismiss/i.test(l)) tags.push("Modal / Dialog");
  if (/form|input|sign.?up|register|create.?account|login|email|password/i.test(l)) tags.push("Form / Input");
  if (/table|leaderboard|ranking|pool list|token list|asset list|all markets/i.test(l)) tags.push("Data Table");
  if (/nav|menu|header|sidebar|footer|breadcrumb|tab/i.test(l)) tags.push("Navigation");
  if (/empty|no data|no result|nothing|zero/i.test(l)) tags.push("Empty State");
  if (/onboard|walkthrough|tutorial|get started|welcome|first time/i.test(l)) tags.push("Onboarding / Walkthrough");
  if (/dashboard|overview|portfolio|summary|home.*page|landing/i.test(l)) tags.push("Dashboard / Overview");
  if (/setting|preference|config|language|theme|notification setting/i.test(l)) tags.push("Settings / Preferences");
  if (/chart|graph|trading|price.*chart|candle|technical/i.test(l)) tags.push("Chart / Graph");
  if (/card|grid|tile|bundle|categor/i.test(l)) tags.push("Card Layout");
  if (/list|scroll|feed|browse|explore|market|price/i.test(l)) tags.push("List View");
  if (/search|filter|find|selector|convert/i.test(l)) tags.push("Search");
  if (/notification|alert|toast|warning|announce/i.test(l)) tags.push("Notification / Alert");
  if (/profile|account|user|my |your |personal/i.test(l)) tags.push("Profile / Account");
  if (/404|error|not found|oops|something went wrong/i.test(l)) tags.push("Error Page");
  if (/loading|spinner|skeleton|progress|wait/i.test(l)) tags.push("Loading State");

  // Specific crypto patterns
  if (/swap|exchange|token.*select|pair/i.test(l)) tags.push("Form / Input");
  if (/stake|earn|reward|yield|apy|apr|vault/i.test(l) && !tags.includes("List View")) tags.push("Card Layout");
  if (/security|proof|reserve|audit/i.test(l)) tags.push("Dashboard / Overview");
  if (/support|help|faq|learn|guide|how to/i.test(l)) tags.push("Navigation");
  if (/legal|terms|privacy|compliance/i.test(l)) tags.push("Navigation");

  // Deduplicate
  return [...new Set(tags)];
}

// ─── Process apps.ts ──────────────────────────────────────────────────────

let source = readFileSync(APPS_FILE, "utf-8");

// Match screen entries: { step: N, label: "...", flow: "...", image: "..." }
// and optionally with existing tags
const screenPattern = /\{ step: (\d+), label: "([^"]*)", flow: "([^"]*)", image: "([^"]*)"(, tags: \[[^\]]*\])? \}/g;

let tagged = 0;
let skipped = 0;

source = source.replace(screenPattern, (match, step, label, flow, image, existingTags) => {
  if (existingTags) {
    skipped++;
    return match; // Already has tags, keep them
  }

  const tags = inferTags(label, flow, image);
  tagged++;

  if (tags.length === 0) {
    return match; // No tags inferred
  }

  const tagsStr = tags.map(t => `"${t}"`).join(", ");
  return `{ step: ${step}, label: "${label}", flow: "${flow}", image: "${image}", tags: [${tagsStr}] }`;
});

writeFileSync(APPS_FILE, source);

console.log(`Tagged ${tagged} screens (${skipped} already had tags)`);
