#!/usr/bin/env tsx
/**
 * Create a BTC deposit (on-chain or Lightning)
 *
 * Usage:
 *   POSTER_API_KEY=xxx AMOUNT=100 npx tsx scripts/deposit-btc.ts
 *   POSTER_API_KEY=xxx AMOUNT=100 LIGHTNING=1 npx tsx scripts/deposit-btc.ts
 *
 * Environment variables:
 *   POSTER_API_KEY - Your agent's API key (required)
 *   AMOUNT - Amount in USD to deposit (default: 100)
 *   LIGHTNING - Set to 1 for Lightning, otherwise on-chain BTC
 */
import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { paymentTools } from '../src/tools/payment.js';

const POSTER_ID = 'clawdentials-bounties';

async function main() {
  const apiKey = process.env.POSTER_API_KEY;
  const amount = parseInt(process.env.AMOUNT || '100', 10);
  const useLightning = process.env.LIGHTNING === '1';
  const currency = useLightning ? 'BTC_LIGHTNING' : 'BTC';

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY environment variable required');
    console.log('\nUsage:');
    console.log('  POSTER_API_KEY=your_api_key AMOUNT=100 npx tsx scripts/deposit-btc.ts');
    console.log('  POSTER_API_KEY=your_api_key AMOUNT=100 LIGHTNING=1 npx tsx scripts/deposit-btc.ts');
    process.exit(1);
  }

  console.log('🦀 Clawdentials BTC Deposit\n');
  console.log('='.repeat(60));

  initFirestore();

  const network = useLightning ? 'Lightning' : 'on-chain';
  console.log(`\n💰 Creating deposit for $${amount} USD (BTC ${network})...`);

  const result = await paymentTools.deposit_create.handler({
    agentId: POSTER_ID,
    apiKey,
    amount,
    currency: currency as 'BTC' | 'BTC_LIGHTNING',
  });

  if (!result.success) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log('\n✅ Deposit created!\n');
  console.log('='.repeat(60));

  if (result.paymentInstructions?.url) {
    // On-chain BTC via OxaPay - uses payment URL
    console.log('\n🔗 PAY HERE (on-chain BTC):\n');
    console.log(result.paymentInstructions.url);
  } else if (result.paymentInstructions?.address) {
    // Lightning - uses bolt11 invoice
    console.log('\n⚡ LIGHTNING INVOICE - Pay this to deposit:\n');
    console.log(result.paymentInstructions.address);
  }

  console.log('\n' + '='.repeat(60));

  console.log(`\n📝 Details:`);
  console.log(`   Deposit ID: ${result.depositId}`);
  console.log(`   Amount: $${amount} USD`);
  console.log(`   Network: ${useLightning ? 'Lightning' : 'On-chain BTC'}`);

  if (result.paymentInstructions?.expiresAt) {
    console.log(`   Expires: ${result.paymentInstructions.expiresAt}`);
  }

  console.log('\n📋 After paying, run this to check status:');
  console.log(`   npx tsx scripts/check-deposit.ts ${result.depositId}`);

  // Also save deposit ID to a file for convenience
  const fs = await import('fs');
  fs.writeFileSync('.last-deposit-id', result.depositId || '');
  console.log('\n   (Deposit ID saved to .last-deposit-id)');
}

main().catch(console.error);
