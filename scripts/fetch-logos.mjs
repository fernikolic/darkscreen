#!/usr/bin/env node

/**
 * Fetch App Logos
 *
 * Downloads logos for all apps in apps.ts using a waterfall of free sources.
 * Saves as /public/logos/{slug}.png. Skips existing unless --force.
 *
 * Usage:
 *   node scripts/fetch-logos.mjs                  # fetch all missing logos
 *   node scripts/fetch-logos.mjs --slug metamask   # fetch one logo
 *   node scripts/fetch-logos.mjs --force           # re-fetch all
 *   node scripts/fetch-logos.mjs --dry-run         # preview without downloading
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const LOGOS_DIR = resolve(PROJECT_ROOT, "public/logos");

// ─── CLI ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

// ─── Load apps from apps.ts ───────────────────────────────────────────

function loadApps() {
  const src = readFileSync(resolve(PROJECT_ROOT, "src/data/apps.ts"), "utf-8");
  const apps = [];
  const re = /{\s*slug:\s*"([^"]+)"[\s\S]*?website:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    apps.push({ slug: m[1], website: m[2] });
  }
  return apps;
}

// ─── HTTP fetch helper ────────────────────────────────────────────────

function fetchUrl(url, redirectCount = 0) {
  return new Promise((ok, fail) => {
    if (redirectCount > 5) return fail(new Error("Too many redirects"));
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith("/")) {
          const u = new URL(url);
          loc = `${u.protocol}//${u.host}${loc}`;
        }
        return fetchUrl(loc, redirectCount + 1).then(ok, fail);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return fail(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => ok(Buffer.concat(chunks)));
      res.on("error", fail);
    });
    req.on("error", fail);
    req.on("timeout", () => { req.destroy(); fail(new Error("Timeout")); });
  });
}

// ─── Logo sources (waterfall order) ──────────────────────────────────

function getSources(domain) {
  return [
    {
      name: "Google Favicon",
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    },
    {
      name: "icon.horse",
      url: `https://icon.horse/icon/${domain}`,
    },
    {
      name: "Clearbit",
      url: `https://logo.clearbit.com/${domain}`,
    },
    {
      name: "DuckDuckGo",
      url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    },
  ];
}

function extractDomain(website) {
  try {
    const url = new URL(website);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function fetchLogo(slug, website, { force, dryRun }) {
  const outPath = resolve(LOGOS_DIR, `${slug}.png`);

  if (!force && existsSync(outPath)) {
    return { slug, status: "skip", reason: "exists" };
  }

  if (dryRun) {
    return { slug, status: "dry-run", domain: extractDomain(website) };
  }

  const domain = extractDomain(website);
  const sources = getSources(domain);

  for (const source of sources) {
    try {
      const buf = await fetchUrl(source.url);

      // Reject tiny files (< 1KB = likely placeholder/error)
      if (buf.length < 1024) {
        continue;
      }

      writeFileSync(outPath, buf);
      return { slug, status: "ok", source: source.name, size: buf.length };
    } catch {
      continue;
    }
  }

  return { slug, status: "fail", domain };
}

async function runBatch(items, concurrency, fn) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function main() {
  mkdirSync(LOGOS_DIR, { recursive: true });

  const allApps = loadApps();
  const apps = args.slug
    ? allApps.filter((a) => a.slug === args.slug)
    : allApps;

  if (apps.length === 0) {
    console.error(`No app found for slug: ${args.slug}`);
    process.exit(1);
  }

  const dryRun = args["dry-run"];
  const force = args.force;

  console.log(`\nFetching logos for ${apps.length} app(s)${dryRun ? " (dry run)" : ""}${force ? " (force)" : ""}\n`);

  const results = await runBatch(apps, 5, (app) =>
    fetchLogo(app.slug, app.website, { force, dryRun })
  );

  // Summary
  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skip");
  const failed = results.filter((r) => r.status === "fail");
  const dry = results.filter((r) => r.status === "dry-run");

  if (dryRun) {
    console.log("Would fetch:");
    for (const r of dry) console.log(`  ${r.slug} (${r.domain})`);
    console.log(`\n${dry.length} to fetch, ${skipped.length} already exist`);
    return;
  }

  for (const r of ok) {
    console.log(`  ✓ ${r.slug} — ${r.source} (${(r.size / 1024).toFixed(1)}KB)`);
  }
  for (const r of failed) {
    console.log(`  ✗ ${r.slug} — all sources failed (${r.domain})`);
  }

  console.log(`\nDone: ${ok.length} fetched, ${skipped.length} skipped, ${failed.length} failed`);

  if (failed.length > 0) {
    console.log("\nFailed apps:");
    for (const r of failed) console.log(`  - ${r.slug} (${r.domain})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
