#!/usr/bin/env node

/**
 * Darkscreen Native Mobile App Capture
 *
 * Uses Maestro to screenshot native iOS/Android apps on simulators.
 * Zero API cost — runs locally via Maestro + Xcode/Android Studio.
 *
 * Prerequisites:
 *   brew install --cask temurin   (Java runtime for Maestro)
 *   curl -Ls "https://get.maestro.mobile.dev" | bash
 *   Xcode (for iOS Simulator) or Android Studio (for Android Emulator)
 *
 * Usage:
 *   node scripts/capture-mobile.mjs --slug coinbase --platform ios
 *   node scripts/capture-mobile.mjs --slug coinbase --platform android
 *   node scripts/capture-mobile.mjs --all --platform ios
 *
 * Pipeline:
 *   1. capture-mobile.mjs  → native app screenshots    ($0.00)
 *   2. label-local.mjs     → labeled manifest           (~$0.05)
 */

import { execFileSync, execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const MAESTRO_DIR = resolve(__dirname, "maestro");
const REGISTRY_PATH = resolve(MAESTRO_DIR, "app-registry.json");

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    all: { type: "boolean", default: false },
    platform: { type: "string", default: "ios" },
    list: { type: "boolean", default: false },
  },
  strict: false,
});

// ─── Preflight checks ────────────────────────────────────────────────

function checkMaestro() {
  const maestroPath = resolve(process.env.HOME, ".maestro/bin/maestro");
  if (!existsSync(maestroPath)) {
    console.error("Maestro not installed. Run:");
    console.error("  brew install --cask temurin");
    console.error('  curl -Ls "https://get.maestro.mobile.dev" | bash');
    process.exit(1);
  }
  return maestroPath;
}

function checkSimulator(platform) {
  if (platform === "ios") {
    try {
      const output = execFileSync("xcrun", ["simctl", "list", "devices", "booted"], { encoding: "utf-8" });
      if (!output.includes("Booted")) {
        console.error("No iOS Simulator running. Open Xcode > Window > Devices and Simulators, or run:");
        console.error('  xcrun simctl boot "iPhone 16 Pro"');
        console.error("  open -a Simulator");
        process.exit(1);
      }
    } catch {
      console.error("Xcode not installed. Install from App Store or:");
      console.error("  xcode-select --install");
      process.exit(1);
    }
  } else if (platform === "android") {
    try {
      const output = execFileSync("adb", ["devices"], { encoding: "utf-8" });
      const devices = output.split("\n").filter((l) => l.includes("device") && !l.includes("List"));
      if (devices.length === 0) {
        console.error("No Android emulator/device connected. Start one from Android Studio.");
        process.exit(1);
      }
    } catch {
      console.error("Android SDK not found. Install Android Studio.");
      process.exit(1);
    }
  }
}

// ─── Registry ─────────────────────────────────────────────────────────

function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    console.error(`App registry not found: ${REGISTRY_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
  // Filter out _comment keys
  const entries = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith("_")) entries[k] = v;
  }
  return entries;
}

// ─── Capture ──────────────────────────────────────────────────────────

function captureApp(maestro, slug, appInfo, platform) {
  const appId = platform === "ios" ? appInfo.ios : appInfo.android;
  if (!appId) {
    console.log(`  Skipping ${slug} — no ${platform} app ID`);
    return null;
  }

  const outputDir = resolve(SCREENSHOT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const flowFile = resolve(MAESTRO_DIR, appInfo.flow || "generic-app-flow.yaml");
  if (!existsSync(flowFile)) {
    console.log(`  Flow not found: ${flowFile}`);
    return null;
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  Capturing: ${appInfo.name} (${platform})`);
  console.log(`  App ID: ${appId}`);
  console.log(`  Flow: ${appInfo.flow}`);
  console.log(`${"═".repeat(50)}\n`);

  const env = {
    ...process.env,
    APP_ID: appId,
    APP_NAME: appInfo.name,
    SLUG: slug,
    OUTPUT_DIR: outputDir,
  };

  try {
    execFileSync(maestro, ["test", flowFile], {
      env,
      stdio: "inherit",
      timeout: 120_000,
    });

    // Count screenshots produced
    const screenshots = readdirSync(outputDir).filter((f) => f.startsWith(`${slug}-mobile-`) && f.endsWith(".png"));

    console.log(`\n  Done! ${screenshots.length} screenshots for ${slug} (${platform})`);

    // Write manifest
    const manifest = {
      slug,
      platform,
      appId,
      capturedAt: new Date().toISOString(),
      totalScreenshots: screenshots.length,
      screens: screenshots.map((filename, i) => ({
        index: i + 1,
        filename,
        action: "native-capture",
        context: `${appInfo.name} native ${platform}`,
      })),
    };

    const manifestPath = resolve(outputDir, `${slug}-mobile-${platform}-raw.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  Manifest: ${manifestPath}`);

    return manifest;
  } catch (e) {
    console.error(`  Failed: ${e.message}`);
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

function main() {
  const registry = loadRegistry();

  if (args.list) {
    console.log("\nRegistered mobile apps:\n");
    for (const [slug, info] of Object.entries(registry)) {
      console.log(`  ${slug.padEnd(15)} ${info.name.padEnd(15)} iOS: ${info.ios || "—"}  Android: ${info.android || "—"}`);
    }
    console.log(`\nTotal: ${Object.keys(registry).length} apps`);
    process.exit(0);
  }

  const platform = args.platform;
  if (!["ios", "android"].includes(platform)) {
    console.error('Platform must be "ios" or "android"');
    process.exit(1);
  }

  const maestro = checkMaestro();
  checkSimulator(platform);

  if (args.all) {
    const results = { success: [], failed: [], skipped: [] };
    for (const [slug, info] of Object.entries(registry)) {
      const manifest = captureApp(maestro, slug, info, platform);
      if (manifest) results.success.push(slug);
      else results.failed.push(slug);
    }
    console.log(`\nResults: ${results.success.length} captured, ${results.failed.length} failed`);
  } else if (args.slug) {
    const info = registry[args.slug];
    if (!info) {
      console.error(`App "${args.slug}" not in registry. Run --list to see available apps.`);
      process.exit(1);
    }
    captureApp(maestro, args.slug, info, platform);
  } else {
    console.error("Darkscreen Native Mobile Capture\n");
    console.error("Usage:");
    console.error("  node scripts/capture-mobile.mjs --slug <slug> --platform ios");
    console.error("  node scripts/capture-mobile.mjs --slug <slug> --platform android");
    console.error("  node scripts/capture-mobile.mjs --all --platform ios");
    console.error("  node scripts/capture-mobile.mjs --list\n");
    console.error("Prerequisites:");
    console.error("  brew install --cask temurin");
    console.error('  curl -Ls "https://get.maestro.mobile.dev" | bash');
    console.error("  Xcode (iOS) or Android Studio (Android)\n");
    process.exit(1);
  }
}

main();
