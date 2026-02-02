#!/usr/bin/env tsx
/**
 * Setup bounty poster agent and create BTC deposit
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/setup-bounty-poster.ts
 *
 * If no POSTER_API_KEY, will create a new poster agent and show the key.
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { agentTools } from '../src/tools/agent.js';
import { paymentTools } from '../src/tools/payment.js';

const POSTER_ID = 'clawdentials-bounties';
const DEPOSIT_AMOUNT_USD = 100; // Start with $100 for bounties

async function main() {
  console.log('🦀 Clawdentials Bounty Poster Setup\n');
  console.log('='.repeat(50));

  initFirestore();
  const db = getDb();

  // Step 1: Check if poster agent exists
  console.log('\n📋 Step 1: Checking for bounty poster agent...');
  const agentDoc = await db.collection('agents').doc(POSTER_ID).get();

  let apiKey = process.env.POSTER_API_KEY || '';

  if (!agentDoc.exists) {
    console.log('   Creating official bounty poster agent...');
    const result = await agentTools.agent_register.handler({
      name: POSTER_ID,
      description: 'Official Clawdentials bounty poster - funding work for agents',
      skills: ['bounty-management', 'ecosystem'],
    });

    if (result.success && result.credentials) {
      apiKey = result.credentials.apiKey;
      console.log('   ✅ Poster agent created!');
      console.log('\n   ⚠️  IMPORTANT: Save this API key - you will need it!');
      console.log(`   🔑 API Key: ${apiKey}`);
      console.log('\n   Add to your .env file:');
      console.log(`   POSTER_API_KEY=${apiKey}`);
    } else {
      console.error('   ❌ Failed to create poster:', result.error);
      process.exit(1);
    }
  } else {
    console.log('   ✅ Poster agent exists');
    if (!apiKey) {
      console.log('\n   ⚠️  No API key provided!');
      console.log('   Set POSTER_API_KEY environment variable:');
      console.log('   POSTER_API_KEY=xxx npx tsx scripts/setup-bounty-poster.ts');
      process.exit(1);
    }
  }

  // Step 2: Check current balance
  console.log('\n📋 Step 2: Checking balance...');
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: POSTER_ID,
    apiKey,
  });

  if (!balanceResult.success) {
    console.error('   ❌ Failed to check balance:', balanceResult.error);
    console.log('   Make sure POSTER_API_KEY is correct');
    process.exit(1);
  }

  const currentBalance = balanceResult.balance || 0;
  console.log(`   💰 Current balance: $${currentBalance}`);

  // Step 3: Create BTC deposit if needed
  if (currentBalance < DEPOSIT_AMOUNT_USD) {
    const neededAmount = DEPOSIT_AMOUNT_USD - currentBalance;
    console.log(`\n📋 Step 3: Creating BTC deposit for $${neededAmount}...`);

    const depositResult = await paymentTools.deposit_create.handler({
      agentId: POSTER_ID,
      apiKey,
      amount: neededAmount,
      currency: 'BTC',
    });

    if (!depositResult.success) {
      console.error('   ❌ Failed to create deposit:', depositResult.error);
      process.exit(1);
    }

    console.log('   ✅ Deposit request created!\n');
    console.log('='.repeat(50));
    console.log('\n⚡ PAY THIS LIGHTNING INVOICE:\n');

    const invoice = depositResult.paymentInstructions?.address;
    console.log(invoice);

    console.log('\n='.repeat(50));
    console.log(`\n📝 Deposit ID: ${depositResult.depositId}`);
    console.log(`💵 Amount: $${neededAmount} USD (paid in BTC via Lightning)`);

    if (depositResult.paymentInstructions?.expiresAt) {
      console.log(`⏰ Expires: ${depositResult.paymentInstructions.expiresAt}`);
    }

    console.log('\n📋 After paying, check status with:');
    console.log(`   npx tsx -e "
import 'dotenv/config';
import { initFirestore } from './src/services/firestore.js';
import { paymentTools } from './src/tools/payment.js';
initFirestore();
paymentTools.deposit_status.handler({ depositId: '${depositResult.depositId}' }).then(r => console.log(JSON.stringify(r, null, 2)));
"`);

  } else {
    console.log(`\n✅ Balance is sufficient ($${currentBalance})`);
    console.log('\n📋 Ready to post bounties!');
    console.log('   Run: POSTER_API_KEY=xxx npx tsx scripts/post-micro-bounties.ts');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n🎯 Next Steps:');
  console.log('1. Pay the Lightning invoice above');
  console.log('2. Wait for confirmation (usually instant)');
  console.log('3. Run: POSTER_API_KEY=xxx npx tsx scripts/post-micro-bounties.ts');
  console.log('\n');
}

main().catch(console.error);
