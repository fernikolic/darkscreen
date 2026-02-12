#!/usr/bin/env node
/**
 * Curate raw screenshots: select best ones, rename, create manifest.
 * Zero API cost — uses URL/context from raw manifest for labeling.
 */
import { readFileSync, writeFileSync, renameSync, existsSync } from "fs";
import { join } from "path";

const SCREENSHOTS_DIR = join(process.cwd(), "public", "screenshots");

// Manual curation: select indices and assign labels/flows
const CURATION = {
  mempool: {
    picks: [
      { idx: 1, flow: "Home", label: "Bitcoin mempool dashboard with fee estimates and recent blocks" },
      { idx: 2, flow: "Home", label: "Mempool dashboard scrolled showing transaction list and stats" },
      { idx: 3, flow: "Home", label: "Signet testnet explorer dashboard view" },
      { idx: 6, flow: "Home", label: "Transaction acceleration marketplace for stuck Bitcoin transactions" },
      { idx: 7, flow: "Home", label: "Transaction acceleration page scrolled with pending accelerations" },
      { idx: 8, flow: "Home", label: "Bitcoin mining dashboard with hashrate and pool distribution" },
      { idx: 9, flow: "Home", label: "Mining dashboard scrolled showing block rewards and difficulty" },
      { idx: 10, flow: "Home", label: "Lightning Network explorer with node and channel statistics" },
      { idx: 11, flow: "Home", label: "Mempool graphs showing fee rates and transaction volume" },
      { idx: 12, flow: "Home", label: "Enterprise API services page for institutional Bitcoin data" },
      { idx: 13, flow: "Onboarding", label: "Sign in page for mempool.space user accounts" },
      { idx: 14, flow: "Home", label: "Mempool block visualization showing pending transactions" },
      { idx: 29, flow: "Home", label: "Individual block detail page with transaction list" },
      { idx: 30, flow: "Home", label: "Block detail scrolled showing transaction inputs and outputs" },
      { idx: 33, flow: "Home", label: "Mining pool detail page showing hashrate and mined blocks" },
    ],
  },
  xverse: {
    picks: [
      { idx: 1, flow: "Home", label: "Xverse Bitcoin wallet landing page with hero section" },
      { idx: 2, flow: "Home", label: "Security features page with audit details and key management" },
      { idx: 3, flow: "Home", label: "Team and careers page showing company information" },
      { idx: 4, flow: "Home", label: "Blog page with latest articles and news" },
      { idx: 5, flow: "Home", label: "Developer API documentation and integration page" },
      { idx: 6, flow: "Onboarding", label: "Download page with browser extension and mobile app links" },
      { idx: 10, flow: "Home", label: "Ledger hardware wallet integration and support page" },
      { idx: 11, flow: "Home", label: "Keystone cold wallet support and signing guide" },
      { idx: 14, flow: "Home", label: "Bitcoin wallet features page with send and receive capabilities" },
      { idx: 15, flow: "Home", label: "Stacks wallet page for STX tokens and smart contracts" },
      { idx: 16, flow: "Home", label: "Starknet wallet integration page for Layer 2 support" },
      { idx: 18, flow: "Home", label: "Bitcoin NFT wallet page for Ordinals and digital collectibles" },
      { idx: 19, flow: "Home", label: "Ordinals wallet page for Bitcoin inscriptions management" },
      { idx: 20, flow: "Home", label: "BRC-20 token wallet page for Bitcoin fungible tokens" },
      { idx: 21, flow: "Home", label: "Bitcoin DeFi wallet page for decentralized finance access" },
      { idx: 23, flow: "Home", label: "Runes wallet page for Bitcoin protocol token standard" },
      { idx: 24, flow: "Home", label: "Lightning wallet page for instant Bitcoin payments" },
      { idx: 29, flow: "Home", label: "Crypto tax calculator tool integration page" },
      { idx: 30, flow: "Staking", label: "Xverse Earn page for Bitcoin yield and stacking rewards" },
      { idx: 34, flow: "Home", label: "404 error page with not found message" },
    ],
  },
  leather: {
    picks: [
      { idx: 1, flow: "Home", label: "Leather Bitcoin wallet landing page with hero and features" },
      { idx: 2, flow: "Home", label: "Landing page scrolled showing wallet capabilities and ecosystem" },
      { idx: 3, flow: "Home", label: "Portfolio dashboard showing Bitcoin and Stacks balances" },
      { idx: 4, flow: "Onboarding", label: "Connect wallet overlay for stacking feature access" },
      { idx: 5, flow: "Onboarding", label: "Connect wallet overlay for sBTC bridge feature" },
      { idx: 6, flow: "Home", label: "Apps directory page showing Bitcoin ecosystem integrations" },
      { idx: 7, flow: "Settings", label: "Advanced settings page with network and developer options" },
      { idx: 8, flow: "Home", label: "Changelog page with recent wallet updates and releases" },
      { idx: 9, flow: "Home", label: "Help center page with support guides and documentation" },
      { idx: 10, flow: "Home", label: "Changelog entry for USDCx default asset support" },
      { idx: 11, flow: "Home", label: "Changelog entry for USDCx availability on Stacks" },
      { idx: 12, flow: "Home", label: "Changelog entry for improved onramp integration" },
      { idx: 14, flow: "Home", label: "Privacy policy page with data handling information" },
      { idx: 16, flow: "Home", label: "Security page with wallet safety practices and audits" },
      { idx: 17, flow: "Staking", label: "Earn sign-in page for Bitcoin stacking rewards" },
      { idx: 20, flow: "Home", label: "404 error page not found" },
    ],
  },
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

for (const [slug, { picks }] of Object.entries(CURATION)) {
  const rawPath = join(SCREENSHOTS_DIR, `${slug}-raw.json`);
  if (!existsSync(rawPath)) {
    console.log(`⚠️  Skipping ${slug}: no raw manifest found`);
    continue;
  }

  const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
  const rawMap = new Map(raw.screens.map((s) => [s.index, s]));

  // Track step counters per flow
  const flowSteps = {};
  const screens = [];

  for (const pick of picks) {
    const rawScreen = rawMap.get(pick.idx);
    if (!rawScreen) {
      console.log(`  ⚠️  ${slug} index ${pick.idx} not found in raw manifest`);
      continue;
    }

    const flow = pick.flow;
    flowSteps[flow] = (flowSteps[flow] || 0) + 1;
    const step = flowSteps[flow];
    const desc = slugify(pick.label);
    const newFilename = `${slug}-${flow.toLowerCase()}-${step}-${desc}.png`;
    const oldPath = join(SCREENSHOTS_DIR, rawScreen.filename);
    const newPath = join(SCREENSHOTS_DIR, newFilename);

    if (existsSync(oldPath)) {
      renameSync(oldPath, newPath);
      console.log(`  📸 ${rawScreen.filename} → ${newFilename}`);
    } else {
      console.log(`  ⚠️  File not found: ${rawScreen.filename}`);
    }

    screens.push({
      step,
      label: pick.label,
      flow,
      image: `/screenshots/${newFilename}`,
    });
  }

  // Write manifest
  const manifest = {
    slug,
    url: raw.url,
    crawledAt: raw.crawledAt,
    totalScreenshots: screens.length,
    totalStates: screens.length,
    screens,
  };

  const manifestPath = join(SCREENSHOTS_DIR, `${slug}-manifest.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ ${slug}: ${screens.length} screenshots curated → ${manifestPath}\n`);
}
