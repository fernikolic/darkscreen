#!/usr/bin/env node

/**
 * Compare current screenshots against their latest archive.
 *
 * Reports added, removed, changed, and unchanged screens.
 * Optionally writes red-highlighted diff overlay PNGs.
 *
 * Usage:
 *   node scripts/diff-screens.mjs --slug aave
 *   node scripts/diff-screens.mjs --all
 *   node scripts/diff-screens.mjs --slug aave --threshold 5
 *   node scripts/diff-screens.mjs --slug aave --visual
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const ARCHIVE_DIR = resolve(SCREENSHOT_DIR, "archive");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
    threshold: { type: "string", default: "2" },
    visual: { type: "boolean", default: false },
  },
  strict: false,
});

const DIFF_THRESHOLD = parseFloat(args.threshold);

// ─── Helpers ──────────────────────────────────────────────────────────────

function getLatestArchive(slug) {
  const archiveSlugDir = resolve(ARCHIVE_DIR, slug);
  if (!existsSync(archiveSlugDir)) return null;

  const dates = readdirSync(archiveSlugDir)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();

  return dates.length > 0 ? dates[0] : null;
}

function screenKey(screen) {
  return `${screen.flow}:${screen.step}`;
}

function decodePNG(filePath) {
  try {
    const buffer = readFileSync(filePath);
    return PNG.sync.read(buffer);
  } catch (e) {
    return null;
  }
}

function compareImages(currentPath, archivedPath) {
  const currentPNG = decodePNG(currentPath);
  const archivedPNG = decodePNG(archivedPath);

  if (!currentPNG || !archivedPNG) {
    return { error: true, reason: "PNG decode failure" };
  }

  const { width: w1, height: h1 } = currentPNG;
  const { width: w2, height: h2 } = archivedPNG;

  // Dimension mismatch — definitely changed
  if (w1 !== w2 || h1 !== h2) {
    return { diffPercent: 100, reason: `dimension mismatch (${w1}x${h1} vs ${w2}x${h2})`, diffPNG: null };
  }

  const diffPNG = new PNG({ width: w1, height: h1 });
  const numDiff = pixelmatch(currentPNG.data, archivedPNG.data, diffPNG.data, w1, h1, {
    threshold: 0.1,
  });

  const totalPixels = w1 * h1;
  const diffPercent = (numDiff / totalPixels) * 100;

  return { diffPercent: Math.round(diffPercent * 100) / 100, diffPNG };
}

// ─── Diff one app ─────────────────────────────────────────────────────────

function diffApp(slug) {
  const manifestPath = resolve(SCREENSHOT_DIR, `${slug}-manifest.json`);
  if (!existsSync(manifestPath)) {
    console.log(`  ⚠ SKIP: ${slug}-manifest.json not found`);
    return null;
  }

  const latestDate = getLatestArchive(slug);
  if (!latestDate) {
    console.log(`  ⚠ SKIP: No archive found for ${slug} — nothing to compare against`);
    return null;
  }

  const archivePath = resolve(ARCHIVE_DIR, slug, latestDate);
  const archivedManifestPath = resolve(archivePath, `${slug}-manifest.json`);
  if (!existsSync(archivedManifestPath)) {
    console.log(`  ⚠ SKIP: Archived manifest missing for ${slug}/${latestDate}`);
    return null;
  }

  const current = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const archived = JSON.parse(readFileSync(archivedManifestPath, "utf-8"));

  console.log(`\n🔍 Diffing ${slug} (current vs ${latestDate})`);

  // Build lookup maps
  const currentMap = new Map();
  for (const s of current.screens) currentMap.set(screenKey(s), s);

  const archivedMap = new Map();
  for (const s of archived.screens) archivedMap.set(screenKey(s), s);

  const allKeys = new Set([...currentMap.keys(), ...archivedMap.keys()]);

  const screens = [];
  const summary = { changed: 0, added: 0, removed: 0, unchanged: 0 };

  // Diff output dir for visual overlays
  const diffOutputDir = resolve(SCREENSHOT_DIR, `diffs`);
  if (args.visual) mkdirSync(diffOutputDir, { recursive: true });

  for (const key of allKeys) {
    const cur = currentMap.get(key);
    const arch = archivedMap.get(key);

    if (cur && !arch) {
      // Added
      summary.added++;
      screens.push({
        flow: cur.flow,
        step: cur.step,
        label: cur.label,
        status: "added",
        diffPercent: null,
        currentImage: cur.image,
        previousImage: null,
      });
      continue;
    }

    if (!cur && arch) {
      // Removed
      summary.removed++;
      screens.push({
        flow: arch.flow,
        step: arch.step,
        label: arch.label,
        status: "removed",
        diffPercent: null,
        currentImage: null,
        previousImage: `archive/${slug}/${latestDate}/${basename(arch.image)}`,
      });
      continue;
    }

    // Both exist — compare pixels
    const currentFile = resolve(PROJECT_ROOT, "public", cur.image.replace(/^\//, ""));
    const archivedFile = resolve(archivePath, basename(arch.image));

    if (!existsSync(currentFile)) {
      console.log(`  ⚠ Missing current file: ${cur.image}`);
      screens.push({
        flow: cur.flow, step: cur.step, label: cur.label,
        status: "error", diffPercent: null,
        currentImage: cur.image,
        previousImage: `archive/${slug}/${latestDate}/${basename(arch.image)}`,
      });
      continue;
    }

    if (!existsSync(archivedFile)) {
      console.log(`  ⚠ Missing archived file: ${basename(arch.image)}`);
      screens.push({
        flow: cur.flow, step: cur.step, label: cur.label,
        status: "error", diffPercent: null,
        currentImage: cur.image,
        previousImage: `archive/${slug}/${latestDate}/${basename(arch.image)}`,
      });
      continue;
    }

    const result = compareImages(currentFile, archivedFile);

    if (result.error) {
      console.log(`  ⚠ ${key}: ${result.reason}`);
      screens.push({
        flow: cur.flow, step: cur.step, label: cur.label,
        status: "error", diffPercent: null,
        currentImage: cur.image,
        previousImage: `archive/${slug}/${latestDate}/${basename(arch.image)}`,
      });
      continue;
    }

    const status = result.diffPercent > DIFF_THRESHOLD ? "changed" : "unchanged";
    if (status === "changed") summary.changed++;
    else summary.unchanged++;

    screens.push({
      flow: cur.flow,
      step: cur.step,
      label: cur.label,
      status,
      diffPercent: result.diffPercent,
      currentImage: cur.image,
      previousImage: `archive/${slug}/${latestDate}/${basename(arch.image)}`,
      ...(result.reason ? { reason: result.reason } : {}),
    });

    // Write visual diff overlay
    if (args.visual && result.diffPNG && status === "changed") {
      const diffFilename = `${slug}-diff-${cur.flow.toLowerCase()}-${cur.step}.png`;
      const diffPath = resolve(diffOutputDir, diffFilename);
      writeFileSync(diffPath, PNG.sync.write(result.diffPNG));
    }
  }

  // Write diff JSON
  const diffResult = {
    slug,
    comparedAgainst: latestDate,
    diffDate: new Date().toISOString(),
    summary,
    screens,
  };

  const diffJsonPath = resolve(SCREENSHOT_DIR, `${slug}-diff.json`);
  writeFileSync(diffJsonPath, JSON.stringify(diffResult, null, 2));

  // Print table
  console.log(`  Compared against: ${latestDate}`);
  console.log(`  Changed: ${summary.changed}  Added: ${summary.added}  Removed: ${summary.removed}  Unchanged: ${summary.unchanged}`);
  console.log("");

  const changedScreens = screens.filter((s) => s.status === "changed");
  if (changedScreens.length > 0) {
    console.log("  Changed screens:");
    for (const s of changedScreens) {
      console.log(`    ${s.flow}/${s.step} "${s.label}" — ${s.diffPercent}% diff${s.reason ? ` (${s.reason})` : ""}`);
    }
  }

  const addedScreens = screens.filter((s) => s.status === "added");
  if (addedScreens.length > 0) {
    console.log("  Added screens:");
    for (const s of addedScreens) {
      console.log(`    ${s.flow}/${s.step} "${s.label}"`);
    }
  }

  const removedScreens = screens.filter((s) => s.status === "removed");
  if (removedScreens.length > 0) {
    console.log("  Removed screens:");
    for (const s of removedScreens) {
      console.log(`    ${s.flow}/${s.step} "${s.label}"`);
    }
  }

  console.log(`  📝 ${diffJsonPath}`);
  return diffResult;
}

// ─── Main ─────────────────────────────────────────────────────────────────

if (!args.slug && !args.all) {
  console.log("Usage: diff-screens.mjs --slug <slug> | --all [--threshold N] [--visual]");
  process.exit(1);
}

console.log(`🔎 Visual diff (threshold: ${DIFF_THRESHOLD}%)${args.visual ? " + overlay PNGs" : ""}\n`);

if (args.all) {
  const manifests = readdirSync(SCREENSHOT_DIR).filter(
    (f) => f.endsWith("-manifest.json") && !f.endsWith("-raw.json")
  );
  console.log(`Found ${manifests.length} manifest(s)\n`);

  let diffed = 0;
  for (const file of manifests) {
    const slug = file.replace("-manifest.json", "");
    if (diffApp(slug)) diffed++;
  }
  console.log(`\n✅ Diffed ${diffed} app(s).`);
} else {
  diffApp(args.slug);
}

console.log("\nDone!");
