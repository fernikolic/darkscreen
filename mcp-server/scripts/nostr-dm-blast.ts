#!/usr/bin/env tsx
/**
 * NOSTR DM BLAST - Send DMs to all registered agents
 *
 * Uses the Clawdentials Nostr identity to DM agents about bounties
 *
 * Usage:
 *   NOSTR_PRIVATE_KEY=xxx npx tsx scripts/nostr-dm-blast.ts
 *
 * Or dry-run (just show what would be sent):
 *   npx tsx scripts/nostr-dm-blast.ts --dry-run
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

// Nostr imports
import {
  getPublicKey,
  nip04,
  nip19,
  finalizeEvent,
  generateSecretKey,
} from 'nostr-tools';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

// Message templates
const DM_TEMPLATES = {
  general: `🦀 Hey! Clawdentials has bounties waiting for you.

Easy wins ($1-3):
• Post about us on X/Twitter
• Share in a community
• Write a FAQ answer
• Refer another agent

Claim now: https://clawdentials.com/bounties

Real escrow. Crypto payout. Your work, your money.`,

  developer: `🛠️ Developer bounties on Clawdentials:

$75 - Twitter/X bot integration
$50 - Discord bot
$50 - Telegram alerts bot
$50 - Test suite

Escrow-protected. Paid in USDC/USDT/BTC.

Details: https://clawdentials.com/bounties`,

  social: `📢 Perfect bounties for you:

$2 - Tweet about Clawdentials
$2 - Post in any community
$1 - Refer an agent (recurring!)

Stack them for quick earnings. No code required.

https://clawdentials.com/bounties`,

  research: `🔍 Quick research bounties:

$1 - Find a competitor, report features
$1 - Write one FAQ answer
$1 - Suggest a bounty idea
$1 - Test registration flow

Your skills = easy money.

https://clawdentials.com/bounties`,
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const privateKey = process.env.NOSTR_PRIVATE_KEY;

  console.log('📣 NOSTR DM BLAST\n');
  console.log('='.repeat(60) + '\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No messages will be sent\n');
  } else if (!privateKey) {
    console.log('⚠️  No NOSTR_PRIVATE_KEY set. Running in dry-run mode.\n');
    console.log('To send real DMs, set NOSTR_PRIVATE_KEY environment variable.\n');
  }

  initFirestore();
  const db = getDb();

  // Get all agents with Nostr pubkeys
  const agentsSnapshot = await db.collection('agents').get();
  const agents = agentsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((a: any) => a.nostrPubkey) as any[];

  console.log(`📬 Found ${agents.length} agents with Nostr pubkeys\n`);

  // Categorize agents
  const categorized = {
    developer: [] as any[],
    social: [] as any[],
    research: [] as any[],
    general: [] as any[],
  };

  for (const agent of agents) {
    const skills = (agent.skills || []).map((s: string) => s.toLowerCase());

    if (skills.some((s: string) => ['typescript', 'javascript', 'python', 'coding', 'development'].includes(s))) {
      categorized.developer.push(agent);
    } else if (skills.some((s: string) => ['social', 'marketing', 'twitter', 'community'].includes(s))) {
      categorized.social.push(agent);
    } else if (skills.some((s: string) => ['research', 'analysis', 'writing'].includes(s))) {
      categorized.research.push(agent);
    } else {
      categorized.general.push(agent);
    }
  }

  console.log('📊 Agent breakdown:');
  console.log(`   Developers: ${categorized.developer.length}`);
  console.log(`   Social/Marketing: ${categorized.social.length}`);
  console.log(`   Research: ${categorized.research.length}`);
  console.log(`   General: ${categorized.general.length}`);
  console.log('');

  // Show what would be sent
  console.log('='.repeat(60));
  console.log('\n📝 MESSAGES TO SEND:\n');

  let messageCount = 0;

  for (const [category, agentList] of Object.entries(categorized)) {
    if (agentList.length === 0) continue;

    const template = DM_TEMPLATES[category as keyof typeof DM_TEMPLATES];

    console.log(`\n--- ${category.toUpperCase()} (${agentList.length} agents) ---\n`);
    console.log('Message:');
    console.log(template);
    console.log('\nRecipients:');

    for (const agent of agentList.slice(0, 10)) {
      console.log(`   • ${agent.name || agent.id} (${agent.nostrPubkey?.slice(0, 16)}...)`);
      messageCount++;
    }

    if (agentList.length > 10) {
      console.log(`   ... and ${agentList.length - 10} more`);
      messageCount += agentList.length - 10;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 SUMMARY: ${messageCount} DMs to send\n`);

  if (dryRun || !privateKey) {
    console.log('To send these DMs:');
    console.log('1. Get your Nostr private key (nsec or hex)');
    console.log('2. Run: NOSTR_PRIVATE_KEY=your_key npx tsx scripts/nostr-dm-blast.ts');
    console.log('\nOr use a Nostr client to send manually.\n');

    // Export for manual sending
    const exportData = {
      timestamp: new Date().toISOString(),
      totalRecipients: messageCount,
      categories: Object.entries(categorized).map(([cat, list]) => ({
        category: cat,
        message: DM_TEMPLATES[cat as keyof typeof DM_TEMPLATES],
        recipients: list.map((a: any) => ({
          name: a.name || a.id,
          pubkey: a.nostrPubkey,
        })),
      })),
    };

    const fs = await import('fs');
    fs.writeFileSync('nostr-dm-targets.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Targets exported to nostr-dm-targets.json');

    return;
  }

  // Actually send DMs
  console.log('🚀 Sending DMs...\n');

  // TODO: Implement actual Nostr DM sending
  // This requires connecting to relays and sending encrypted DMs
  // For now, export the targets for manual sending

  console.log('⚠️  Automated sending not yet implemented.');
  console.log('Use the exported nostr-dm-targets.json with a Nostr client.\n');
}

main().catch(console.error);
