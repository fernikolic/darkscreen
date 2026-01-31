#!/usr/bin/env npx tsx
/**
 * Quick Cashu Integration Test
 *
 * Creates a small Lightning invoice to verify Cashu works.
 * Run with: npx tsx scripts/test-cashu.ts
 */

import { cashuService } from '../src/services/payments/cashu.js';

async function main() {
  console.log('🥜 Testing Cashu Integration\n');
  console.log('Mint:', cashuService.config.mintUrl);
  console.log('Configured:', cashuService.config.configured);

  // Create a small test invoice (100 sats ≈ $0.10)
  console.log('\nCreating 100 sat invoice...\n');

  const result = await cashuService.createDeposit({
    amount: 100,
    agentId: 'cashu-test',
    description: 'Cashu integration test'
  });

  if (!result.success) {
    console.log('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log('✅ Invoice created successfully!\n');
  console.log('═'.repeat(60));
  console.log('⚡ LIGHTNING INVOICE (100 sats ≈ $0.10):');
  console.log('═'.repeat(60));
  console.log(result.quote!.bolt11);
  console.log('═'.repeat(60));
  console.log('\nQuote ID:', result.quote!.quoteId);
  console.log('Expires:', result.quote!.expiresAt);
  console.log('\n📱 Scan with any Lightning wallet to pay');
  console.log('\nAfter paying, run:');
  console.log(`  npx tsx scripts/test-cashu.ts --check ${result.quote!.quoteId} 100`);
}

async function checkPayment(quoteId: string, amount: number) {
  console.log('🔍 Checking payment status...\n');
  console.log('Quote ID:', quoteId);

  const result = await cashuService.checkDepositAndMint(quoteId, amount);

  if (!result.success) {
    console.log('❌ Error:', result.error);
    process.exit(1);
  }

  if (result.paid) {
    console.log('✅ Payment confirmed!');
    console.log('🪙 Proofs received:', result.proofs?.length || 0);
    console.log('\nTotal value:', result.proofs?.reduce((s, p) => s + p.amount, 0) || 0, 'sats');
    console.log('\n🎉 Cashu integration working!');
  } else {
    console.log('⏳ Payment not yet confirmed');
    console.log('Try again after paying the invoice');
  }
}

// Parse args
const args = process.argv.slice(2);

if (args[0] === '--check' && args[1]) {
  const quoteId = args[1];
  const amount = parseInt(args[2] || '100');
  checkPayment(quoteId, amount);
} else {
  main();
}
