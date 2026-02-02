#!/usr/bin/env tsx
/**
 * Try to recover payment by checking quotes with different sat amounts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

async function main() {
  console.log('🔍 Trying to recover payment with different sat amounts\n');

  initFirestore();
  const db = getDb();

  const deposits = await db.collection('deposits')
    .where('provider', '==', 'cashu')
    .where('status', '==', 'pending')
    .get();

  // The user's invoice was for 12,000 sats (lnbc120u = 120 * 100)
  const targetSats = 12000;

  // Also try variations
  const satAmounts = [
    10000,  // $10 at 1000 sats/USD
    10300,  // $10 at 1030 sats/USD
    12000,  // The actual invoice amount
    12360,  // $12 at 1030 sats/USD
  ];

  console.log(`User's invoice: 12,000 sats (~$12)`);
  console.log(`Checking ${deposits.size} pending deposits...\n`);

  for (const doc of deposits.docs) {
    const quoteId = doc.id;
    const deposit = doc.data();

    console.log('---', quoteId, '---');
    console.log('Deposit amount: $' + deposit.amount);

    for (const sats of satAmounts) {
      try {
        const result = await cashuService.checkDepositAndMint(quoteId, sats);

        if (result.paid) {
          console.log(`✅ PAID with ${sats} sats!`);
          if (result.proofs && result.proofs.length > 0) {
            const total = result.proofs.reduce((s, p) => s + p.amount, 0);
            console.log(`   Proofs: ${result.proofs.length}, total: ${total} sats`);

            // Save it!
            await doc.ref.update({
              status: 'completed',
              completedAt: new Date(),
              proofs: result.proofs,
              amountSats: total,
              recoveredAt: new Date(),
            });
            console.log('   SAVED!');
          }
          break;
        }
      } catch (e) {
        // Ignore errors, just try next amount
      }
    }
    console.log('');
  }
}

main().catch(console.error);
