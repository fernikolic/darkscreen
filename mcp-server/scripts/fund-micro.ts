#!/usr/bin/env tsx
/**
 * Fund micro bounties that fit within budget
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';

const POSTER_ID = 'clawdentials-bounties';

async function main() {
  const apiKey = process.env.POSTER_API_KEY;

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY required');
    process.exit(1);
  }

  console.log('💰 Funding micro bounties\n');
  initFirestore();
  const db = getDb();

  // Check balance
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: POSTER_ID,
    apiKey,
  });

  let balance = balanceResult.balance || 0;
  console.log(`💵 Current balance: $${balance.toFixed(2)}\n`);

  // Get ALL draft bounties (not filtered by poster)
  const draftsSnapshot = await db
    .collection('bounties')
    .where('status', '==', 'draft')
    .get();

  console.log(`Found ${draftsSnapshot.size} total draft bounties\n`);

  // Sort by amount (cheapest first)
  const drafts = draftsSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (a.amount || 0) - (b.amount || 0));

  let funded = 0;
  let spent = 0;

  for (const bounty of drafts) {
    const amount = (bounty as any).amount || 0;
    const title = (bounty as any).title || 'Untitled';
    const posterId = (bounty as any).posterId;

    // Only fund bounties we own
    if (posterId !== POSTER_ID) {
      console.log(`⏭️  Skip "${title}" (different poster: ${posterId})`);
      continue;
    }

    if (spent + amount > balance) {
      console.log(`⏭️  Skip "${title}" ($${amount}) - would exceed balance`);
      continue;
    }

    process.stdout.write(`💸 "${title}" ($${amount})... `);

    const result = await bountyTools.bounty_fund.handler({
      bountyId: bounty.id,
      posterAgentId: POSTER_ID,
      apiKey,
    });

    if (result.success) {
      funded++;
      spent += amount;
      console.log('✅ LIVE');
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 SUMMARY`);
  console.log(`   Funded: ${funded}`);
  console.log(`   Spent:  $${spent.toFixed(2)}`);
  console.log(`   Remaining: $${(balance - spent).toFixed(2)}`);
}

main().catch(console.error);
