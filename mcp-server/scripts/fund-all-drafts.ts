#!/usr/bin/env tsx
/**
 * Fund all draft bounties at once
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/fund-all-drafts.ts
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

  console.log('💰 Funding all draft bounties\n');
  initFirestore();
  const db = getDb();

  // Check balance first
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: POSTER_ID,
    apiKey,
  });

  if (!balanceResult.success) {
    console.error('❌ Failed to check balance:', balanceResult.error);
    return;
  }

  const balance = balanceResult.balance || 0;
  console.log(`💵 Current balance: $${balance}\n`);

  // Get all draft bounties from this poster
  const draftsSnapshot = await db
    .collection('bounties')
    .where('posterId', '==', POSTER_ID)
    .where('status', '==', 'draft')
    .get();

  if (draftsSnapshot.empty) {
    console.log('No draft bounties found!');
    return;
  }

  const drafts = draftsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const totalNeeded = drafts.reduce((sum, b: any) => sum + (b.amount || 0), 0);

  console.log(`📋 Found ${drafts.length} draft bounties`);
  console.log(`💵 Total needed: $${totalNeeded}`);
  console.log(`💰 Available: $${balance}\n`);

  if (balance < totalNeeded) {
    console.log(`⚠️  Insufficient balance!`);
    console.log(`   Need: $${totalNeeded - balance} more`);
    console.log(`\n   Deposit via: npx tsx scripts/deposit-usdt.ts`);

    // Show which bounties we CAN fund
    let runningTotal = 0;
    let canFund = 0;
    for (const bounty of drafts) {
      const amount = (bounty as any).amount || 0;
      if (runningTotal + amount <= balance) {
        runningTotal += amount;
        canFund++;
      } else {
        break;
      }
    }

    if (canFund > 0) {
      console.log(`\n   Can fund ${canFund}/${drafts.length} bounties with current balance.`);
      console.log(`   Run with PARTIAL=1 to fund what we can.`);
    }

    if (!process.env.PARTIAL) {
      return;
    }
    console.log('\n   PARTIAL=1 set, funding what we can...\n');
  }

  let funded = 0;
  let spent = 0;

  for (const bounty of drafts) {
    const amount = (bounty as any).amount || 0;
    const title = (bounty as any).title || 'Untitled';

    if (spent + amount > balance) {
      console.log(`⏭️  Skipping "${title}" - insufficient balance`);
      continue;
    }

    process.stdout.write(`💸 Funding "${title}" ($${amount})... `);

    const result = await bountyTools.bounty_fund.handler({
      bountyId: bounty.id,
      posterAgentId: POSTER_ID,
      apiKey,
    });

    if (result.success) {
      funded++;
      spent += amount;
      console.log('✅');
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 SUMMARY`);
  console.log(`   Funded: ${funded}/${drafts.length}`);
  console.log(`   Spent:  $${spent}`);
  console.log(`   Remaining balance: $${balance - spent}`);

  if (funded === drafts.length) {
    console.log(`\n✨ All bounties are now LIVE!`);
    console.log(`   View at: https://clawdentials.com/bounties`);
  }
}

main().catch(console.error);
