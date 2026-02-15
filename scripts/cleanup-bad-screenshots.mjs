#!/usr/bin/env node
/**
 * Cleanup bad screenshots from apps that got captcha'd, 403'd, 404'd, or domain-expired.
 *
 * Two modes:
 * 1. WIPE: Remove all screenshots + reset app in apps.ts
 * 2. PARTIAL: Remove specific bad screenshot files + entries from apps.ts
 */

import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = 'public/screenshots';
const APPS_TS = 'src/data/apps.ts';

// Apps to completely wipe (all screenshots are captcha/error/parking)
const WIPE_SLUGS = [
  'argent',
  'strike',
  'dune',
  'samourai',
  'blockchair',
  'trust-wallet',
  'etherscan',
];

// Read apps.ts
let content = fs.readFileSync(APPS_TS, 'utf-8');

// --- PHASE 1: WIPE apps ---
console.log('\n=== PHASE 1: WIPING BAD APPS ===\n');

for (const slug of WIPE_SLUGS) {
  // Delete all screenshot files for this slug (both labeled and raw)
  const allFiles = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.startsWith(`${slug}-`) && f.endsWith('.png'));

  let deleted = 0;
  for (const file of allFiles) {
    fs.unlinkSync(path.join(SCREENSHOTS_DIR, file));
    deleted++;
  }

  // Delete manifest files
  const manifestFiles = [
    `public/screenshots/${slug}-manifest.json`,
    `public/screenshots/${slug}-raw.json`,
  ];
  for (const mf of manifestFiles) {
    if (fs.existsSync(mf)) {
      fs.unlinkSync(mf);
      console.log(`  Deleted ${mf}`);
    }
  }

  console.log(`  ${slug}: deleted ${deleted} screenshot files`);

  // Reset in apps.ts: screens to [], screenCount to 0, remove thumbnail and lastUpdated
  // Find the app block by slug
  const slugPattern = new RegExp(`(slug:\\s*["']${slug}["'])`, 'g');
  if (!slugPattern.test(content)) {
    console.log(`  WARNING: slug "${slug}" not found in apps.ts`);
    continue;
  }

  // Reset screenCount to 0
  const screenCountRegex = new RegExp(
    `(slug:\\s*["']${slug}["'][\\s\\S]*?)(screenCount:\\s*\\d+)`,
    'g'
  );
  content = content.replace(screenCountRegex, (match, before, sc) => {
    return before + 'screenCount: 0';
  });

  // Remove thumbnail line
  const thumbnailRegex = new RegExp(
    `(slug:\\s*["']${slug}["'][\\s\\S]*?)thumbnail:\\s*["'][^"']*["'],?\\s*\\n`,
    'g'
  );
  content = content.replace(thumbnailRegex, '$1');

  // Remove lastUpdated line
  const lastUpdatedRegex = new RegExp(
    `(slug:\\s*["']${slug}["'][\\s\\S]*?)lastUpdated:\\s*["'][^"']*["'],?\\s*\\n`,
    'g'
  );
  content = content.replace(lastUpdatedRegex, '$1');

  // Reset screens array to []
  // Match screens: [ ... ] for this slug (could span many lines)
  const screensRegex = new RegExp(
    `(slug:\\s*["']${slug}["'][\\s\\S]*?)(screens:\\s*\\[)[\\s\\S]*?(\\],)`,
    'g'
  );
  content = content.replace(screensRegex, '$1$2$3');

  console.log(`  ${slug}: reset in apps.ts`);
}

// --- PHASE 2: Remove specific bad screenshots from partial-clean apps ---
console.log('\n=== PHASE 2: REMOVING SPECIFIC BAD SCREENSHOTS ===\n');

// Map of slug -> list of bad screenshot filenames to remove
// These are the specific captcha/error screenshots mixed into otherwise-good apps
const PARTIAL_CLEAN = {
  // htx: blank home page
  'htx': [
    'htx-home-1-landing-page.png',
  ],
  // sushiswap: 404 test page as home-1
  'sushiswap': [
    'sushiswap-home-1-thispagedoesnotexist404test-page.png',
  ],
  // orbiter: 404 test page as home-1
  'orbiter': [
    'orbiter-home-1-thispagedoesnotexist404test-page.png',
  ],
};

for (const [slug, badFiles] of Object.entries(PARTIAL_CLEAN)) {
  for (const file of badFiles) {
    const filePath = path.join(SCREENSHOTS_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  Deleted ${file}`);
    }

    // Remove the screen entry from apps.ts
    // The screen entry references the file path like /screenshots/filename
    const screenFile = file.replace('.png', '');
    // Remove the entire screen object { file: "...", label: "...", ... },
    const screenEntryRegex = new RegExp(
      `\\s*\\{[^}]*file:\\s*["']/screenshots/${screenFile}["'][^}]*\\},?`,
      'g'
    );
    const beforeLen = content.length;
    content = content.replace(screenEntryRegex, '');
    if (content.length < beforeLen) {
      console.log(`  Removed screen entry for ${screenFile} from apps.ts`);
    }
  }

  // Update screenCount for this slug
  const remainingScreens = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.startsWith(`${slug}-`) && f.endsWith('.png') && !f.includes('-raw-'));
  const newCount = remainingScreens.length;

  const screenCountRegex = new RegExp(
    `(slug:\\s*["']${slug}["'][\\s\\S]*?)(screenCount:\\s*\\d+)`,
    'g'
  );
  content = content.replace(screenCountRegex, (match, before) => {
    return before + `screenCount: ${newCount}`;
  });

  // Update thumbnail to first remaining screenshot
  if (remainingScreens.length > 0) {
    remainingScreens.sort();
    const newThumb = `/screenshots/${remainingScreens[0].replace('.png', '')}`;
    const thumbRegex = new RegExp(
      `(slug:\\s*["']${slug}["'][\\s\\S]*?)(thumbnail:\\s*["'])[^"']*(["'])`,
      'g'
    );
    content = content.replace(thumbRegex, `$1$2${newThumb}$3`);
    console.log(`  ${slug}: updated thumbnail to ${remainingScreens[0]}, screenCount=${newCount}`);
  }
}

// Write updated apps.ts
fs.writeFileSync(APPS_TS, content);
console.log('\n=== DONE ===');
console.log(`Wiped: ${WIPE_SLUGS.join(', ')}`);
console.log(`Partial clean: ${Object.keys(PARTIAL_CLEAN).join(', ')}`);
