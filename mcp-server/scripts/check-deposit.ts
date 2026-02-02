#!/usr/bin/env tsx
/**
 * Check deposit status
 *
 * Usage:
 *   npx tsx scripts/check-deposit.ts <deposit-id>
 *   npx tsx scripts/check-deposit.ts  # Uses .last-deposit-id if exists
 */
import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { paymentTools } from '../src/tools/payment.js';
import { readFileSync, existsSync } from 'fs';

async function main() {
  let depositId = process.argv[2];

  // Try to read from .last-deposit-id if not provided
  if (!depositId && existsSync('.last-deposit-id')) {
    depositId = readFileSync('.last-deposit-id', 'utf-8').trim();
  }

  if (!depositId) {
    console.error('❌ Deposit ID required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/check-deposit.ts <deposit-id>');
    process.exit(1);
  }

  console.log('🦀 Checking deposit status...\n');

  initFirestore();

  const result = await paymentTools.deposit_status.handler({ depositId });

  if (!result.success) {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }

  const deposit = result.deposit;
  console.log('📝 Deposit Status:');
  console.log(`   ID: ${deposit.id}`);
  console.log(`   Amount: $${deposit.amount} ${deposit.currency}`);
  console.log(`   Status: ${deposit.status}`);

  if (deposit.status === 'completed') {
    console.log('\n✅ DEPOSIT CONFIRMED!');
    console.log(`💰 New balance: $${result.newBalance}`);
    console.log('\n🎯 Ready to post bounties!');
    console.log('   Run: POSTER_API_KEY=xxx npx tsx scripts/post-micro-bounties.ts');
  } else if (deposit.status === 'pending') {
    console.log('\n⏳ Waiting for payment...');
    console.log('   Pay the Lightning invoice to complete the deposit.');
  } else if (deposit.status === 'confirming') {
    console.log('\n⏳ Payment received, confirming...');
  } else if (deposit.status === 'expired') {
    console.log('\n❌ Deposit expired. Create a new one.');
  }
}

main().catch(console.error);
