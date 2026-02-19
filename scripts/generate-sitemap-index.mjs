#!/usr/bin/env node
/**
 * Generate sitemap index XML from sub-sitemaps in out/sitemap/.
 * Run after `next build` since `generateSitemaps()` in static export
 * creates sub-sitemaps but not the index file.
 */
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const OUT_DIR = join(process.cwd(), "out");
const SITEMAP_DIR = join(OUT_DIR, "sitemap");
const BASE_URL = "https://darkscreens.xyz";

const files = readdirSync(SITEMAP_DIR)
  .filter((f) => f.endsWith(".xml"))
  .sort((a, b) => parseInt(a) - parseInt(b));

const lastmod = new Date().toISOString();

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `<sitemap>
<loc>${BASE_URL}/sitemap/${f}</loc>
<lastmod>${lastmod}</lastmod>
</sitemap>`).join("\n")}
</sitemapindex>`;

writeFileSync(join(OUT_DIR, "sitemap.xml"), index);
console.log(`sitemap-index: wrote ${files.length} sub-sitemaps to out/sitemap.xml`);
