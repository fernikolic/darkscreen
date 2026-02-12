/**
 * Wire Screenshots — Scans public/screenshots/ and generates
 * a mapping of what images exist for each app, so you can
 * update apps.ts accordingly.
 *
 * Usage: node scripts/openclaw/wire-screenshots.mjs
 */

import { readdirSync, statSync } from "fs";
import { resolve, basename } from "path";

const screenshotDir = resolve("public/screenshots");
const files = readdirSync(screenshotDir)
  .filter((f) => f.endsWith(".png"))
  .sort();

// Group by app slug
const appScreenshots = {};

for (const file of files) {
  const name = basename(file, ".png");
  // Expected format: {slug}-{routeId}.png
  const firstDash = name.indexOf("-");
  if (firstDash === -1) continue;

  const slug = name.substring(0, firstDash);
  const routeId = name.substring(firstDash + 1);
  const size = statSync(resolve(screenshotDir, file)).size;

  if (!appScreenshots[slug]) {
    appScreenshots[slug] = [];
  }

  appScreenshots[slug].push({
    routeId,
    file,
    path: `/screenshots/${file}`,
    sizeKB: Math.round(size / 1024),
  });
}

// Output summary
console.log("\n=== Darkscreen Screenshot Inventory ===\n");

let totalFiles = 0;
let totalSize = 0;

for (const [slug, shots] of Object.entries(appScreenshots).sort()) {
  console.log(`${slug} (${shots.length} screenshots):`);
  for (const s of shots) {
    console.log(`  - ${s.routeId.padEnd(20)} → ${s.path} (${s.sizeKB}KB)`);
    totalFiles++;
    totalSize += s.sizeKB;
  }
  console.log();
}

console.log(`Total: ${totalFiles} screenshots, ${Math.round(totalSize / 1024)}MB`);

// Output code snippet for apps.ts
console.log("\n=== apps.ts Screenshot Mappings ===\n");
console.log("Copy these into each app's screenshots array:\n");

for (const [slug, shots] of Object.entries(appScreenshots).sort()) {
  console.log(`// ${slug}`);
  console.log(`thumbnail: "${shots[0].path}",`);
  console.log("// screenshot images:");
  for (const s of shots) {
    console.log(`  { image: "${s.path}" }, // ${s.routeId}`);
  }
  console.log();
}
