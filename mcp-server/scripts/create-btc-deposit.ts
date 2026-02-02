#!/usr/bin/env tsx
/**
 * Create a BTC deposit with properly stored invoice
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

const AMOUNT_USD = parseInt(process.argv[2] || '10');
const AGENT_ID = process.argv[3] || 'clawdentials-bounties';

// Approximate sats per dollar (at ~$100k/BTC)
const SATS_PER_USD = 1000;

async function main() {
  console.log('💰 Creating BTC deposit\n');
  console.log('Amount: $' + AMOUNT_USD);
  console.log('Agent:', AGENT_ID);
  console.log('');

  initFirestore();
  const db = getDb();

  const amountSats = AMOUNT_USD * SATS_PER_USD;
  console.log('Sats:', amountSats);
  console.log('');

  console.log('🔗 Creating Cashu mint quote...');
  const result = await cashuService.createDeposit({
    amount: amountSats,
    agentId: AGENT_ID,
    description: `Clawdentials deposit: $${AMOUNT_USD}`,
  });

  if (!result.success || !result.quote) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  const { quoteId, bolt11, expiresAt } = result.quote;

  console.log('✅ Quote created!\n');
  console.log('Quote ID:', quoteId);
  console.log('Expires:', expiresAt?.toISOString() || 'unknown');
  console.log('');
  console.log('⚡ PAY THIS LIGHTNING INVOICE:');
  console.log('');
  console.log(bolt11);
  console.log('');

  // Save deposit with invoice
  const depositRef = db.collection('deposits').doc(quoteId);
  await depositRef.set({
    id: quoteId,
    agentId: AGENT_ID,
    amount: AMOUNT_USD,
    amountSats: amountSats,
    currency: 'BTC',
    status: 'pending',
    provider: 'cashu',
    bolt11: bolt11, // Store the invoice!
    createdAt: new Date(),
    expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  console.log('📝 Deposit saved to Firestore');
  console.log('');
  console.log('After paying, verify with:');
  console.log(`  npx tsx scripts/verify-cashu-deposit.ts ${quoteId}`);

  // Save to file for easy access
  const fs = await import('fs');
  fs.writeFileSync('.last-deposit-id', quoteId);
  fs.writeFileSync('.last-invoice', bolt11);
  console.log('');
  console.log('Invoice saved to .last-invoice');
}

main().catch(console.error);
