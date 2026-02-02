#!/usr/bin/env npx tsx
/**
 * Test Cashu verification flow
 *
 * This tests the checkDepositAndMint function to verify
 * it correctly handles both paid and unpaid invoices.
 */

import 'dotenv/config';
import { initFirestore, getDb, getBalance, creditBalance } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

initFirestore();

async function test() {
  const quoteId = process.argv[2];

  if (!quoteId) {
    console.log('Usage: npx tsx scripts/test-cashu-verification.ts <quote-id>');
    console.log('\nThis will check if a Cashu invoice has been paid.');
    console.log('If paid, it will attempt to mint proofs.');
    return;
  }

  console.log(`🧪 Testing Cashu verification for quote: ${quoteId}\n`);

  // First, find the deposit to get the amount
  const db = getDb();
  const depositDoc = await db.collection('deposits').doc(quoteId).get();

  if (!depositDoc.exists) {
    console.log('❌ Deposit not found in Firestore');
    return;
  }

  const deposit = depositDoc.data()!;
  const amountSats = deposit.amountSats || deposit.amount;

  console.log(`Deposit details:`);
  console.log(`  Agent: ${deposit.agentId}`);
  console.log(`  Amount: ${amountSats} sats ($${deposit.amount})`);
  console.log(`  Status: ${deposit.status}`);
  console.log(`  Invoice: ${deposit.bolt11?.substring(0, 40)}...`);
  console.log();

  // Check with Cashu mint
  console.log('Checking with Cashu mint...');
  const result = await cashuService.checkDepositAndMint(quoteId, amountSats);

  console.log(`\nResult:`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Paid: ${result.paid}`);

  if (result.paid && result.proofs && result.proofs.length > 0) {
    console.log(`  Proofs minted: ${result.proofs.length}`);
    const totalSats = result.proofs.reduce((sum, p) => sum + p.amount, 0);
    console.log(`  Total value: ${totalSats} sats`);

    // This would be the balance crediting step
    const currentBalance = await getBalance(deposit.agentId);
    console.log(`\n  Agent ${deposit.agentId} current balance: $${currentBalance}`);
    console.log(`  Would credit: $${deposit.amount}`);
    console.log(`  New balance would be: $${currentBalance + deposit.amount}`);

    console.log('\n✅ Invoice was paid! Balance crediting would work.');
  } else if (result.paid) {
    console.log('  ⚠️  Paid but proofs already minted (or none returned)');
  } else {
    console.log('\n⏳ Invoice not paid yet. Pay this invoice to test full flow:');
    console.log(`\n  ${deposit.bolt11}`);
  }

  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
}

test().catch(console.error);
