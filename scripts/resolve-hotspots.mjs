#!/usr/bin/env node

/**
 * Post-crawl processing that resolves which hotspot links to which screen.
 *
 * Reads raw manifest hotspot data and matches href values to captured URLs
 * to determine targetStep and targetFlow for each hotspot.
 *
 * Usage:
 *   node scripts/resolve-hotspots.mjs --slug uniswap
 *   node scripts/resolve-hotspots.mjs                   (all manifests)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

// ─── Load manifests ─────────────────────────────────────────────────────

function loadManifests() {
  const files = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith("-manifest.json"));
  const manifests = {};
  for (const file of files) {
    const data = JSON.parse(readFileSync(resolve(SCREENSHOT_DIR, file), "utf-8"));
    manifests[data.slug] = data;
  }
  return manifests;
}

const manifests = loadManifests();
const slugs = args.slug ? [args.slug] : Object.keys(manifests);

console.log(`Resolving hotspots for ${slugs.length} app(s)...\n`);

let totalResolved = 0;
let totalUnresolved = 0;

for (const slug of slugs) {
  const manifest = manifests[slug];
  if (!manifest) {
    console.log(`  SKIP: No manifest for "${slug}"`);
    continue;
  }

  const screens = manifest.screens || [];
  if (screens.length === 0) continue;

  // Build URL → step/flow index from the manifest
  const urlToScreen = new Map();
  for (const screen of screens) {
    if (screen.url) {
      urlToScreen.set(screen.url, { step: screen.step, flow: screen.flow });
      // Also map without trailing slash
      const alt = screen.url.endsWith("/") ? screen.url.slice(0, -1) : screen.url + "/";
      urlToScreen.set(alt, { step: screen.step, flow: screen.flow });
    }
  }

  let resolved = 0;
  let unresolved = 0;

  for (const screen of screens) {
    if (!screen.hotspots || !Array.isArray(screen.hotspots)) continue;

    for (const hotspot of screen.hotspots) {
      if (!hotspot.href) {
        unresolved++;
        continue;
      }

      // Try to resolve href to a screen
      let target = urlToScreen.get(hotspot.href);

      // Try partial path matching if full URL doesn't match
      if (!target) {
        try {
          const hrefPath = new URL(hotspot.href, "https://placeholder.com").pathname;
          for (const [url, screenRef] of urlToScreen) {
            try {
              const urlPath = new URL(url, "https://placeholder.com").pathname;
              if (urlPath === hrefPath) {
                target = screenRef;
                break;
              }
            } catch {
              // skip invalid URLs
            }
          }
        } catch {
          // skip invalid href
        }
      }

      if (target) {
        hotspot.targetStep = target.step;
        hotspot.targetFlow = target.flow;
        resolved++;
      } else {
        // Keep label but no target (rendered as highlight, not clickable)
        if (hotspot.text && !hotspot.label) {
          hotspot.label = hotspot.text;
        }
        unresolved++;
      }
    }
  }

  totalResolved += resolved;
  totalUnresolved += unresolved;

  console.log(`  ${slug}: ${resolved} resolved, ${unresolved} unresolved`);

  if (!args["dry-run"]) {
    const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`  Total: ${totalResolved} resolved, ${totalUnresolved} unresolved`);
if (args["dry-run"]) console.log("  DRY RUN — no files written");
console.log(`${"─".repeat(60)}`);
