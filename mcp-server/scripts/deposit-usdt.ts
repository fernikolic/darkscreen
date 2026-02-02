#!/usr/bin/env tsx
/**
 * Create a USDT deposit via OxaPay
 *
 * Usage:
 *   POSTER_API_KEY=xxx AMOUNT=200 npx tsx scripts/deposit-usdt.ts
 */
import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { paymentTools } from '../src/tools/payment.js';

const POSTER_ID = 'clawdentials-bounties';

async function main() {
  const apiKey = process.env.POSTER_API_KEY;
  const amount = parseInt(process.env.AMOUNT || '200', 10);

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY environment variable required');
    console.log('\nUsage:');
    console.log('  POSTER_API_KEY=your_api_key AMOUNT=200 npx tsx scripts/deposit-usdt.ts');
    process.exit(1);
  }

  console.log('🦀 Clawdentials USDT Deposit\n');
  console.log('='.repeat(60));

  initFirestore();

  console.log(`\n💰 Creating deposit for $${amount} USDT...`);

  const result = await paymentTools.deposit_create.handler({
    agentId: POSTER_ID,
    apiKey,
    amount,
    currency: 'USDT',
  });

  if (!result.success) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log('\n✅ Deposit created!\n');
  console.log('='.repeat(60));

  if (result.paymentInstructions?.url) {
    console.log('\n🔗 PAY HERE:\n');
    console.log(result.paymentInstructions.url);
  }

  console.log('\n' + '='.repeat(60));

  console.log(`\n📝 Details:`);
  console.log(`   Deposit ID: ${result.depositId}`);
  console.log(`   Amount: $${amount} USDT`);
  console.log(`   Network: TRC-20 (Tron)`);

  if (result.paymentInstructions?.expiresAt) {
    console.log(`   Expires: ${result.paymentInstructions.expiresAt}`);
  }

  console.log('\n📋 After paying, run this to check status:');
  console.log(`   npx tsx scripts/check-deposit.ts ${result.depositId}`);

  // Save deposit ID
  const fs = await import('fs');
  fs.writeFileSync('.last-deposit-id', result.depositId || '');
  console.log('\n   (Deposit ID saved to .last-deposit-id)');
}

main().catch(console.error);
