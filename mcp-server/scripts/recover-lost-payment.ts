#!/usr/bin/env tsx
/**
 * Try to recover a lost Cashu payment by checking all pending deposits
 */
import 'dotenv/config';
import { initFirestore, getDb, creditBalance } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

async function main() {
  console.log('🔍 RECOVERING LOST CASHU PAYMENT\n');
  console.log('Checking all pending deposits to see if any were actually paid...\n');

  initFirestore();
  const db = getDb();

  // Get all pending Cashu deposits
  const deposits = await db.collection('deposits')
    .where('provider', '==', 'cashu')
    .where('status', '==', 'pending')
    .get();

  console.log(`Found ${deposits.size} pending Cashu deposits\n`);

  for (const doc of deposits.docs) {
    const deposit = doc.data();
    const quoteId = doc.id;
    const amountSats = deposit.amountSats || deposit.amount * 1000;

    console.log('-----------------------------------');
    console.log('Checking:', quoteId);
    console.log('Amount: $' + deposit.amount + ' (' + amountSats + ' sats)');
    console.log('Agent:', deposit.agentId);
    console.log('Created:', deposit.createdAt?.toDate?.()?.toISOString() || 'unknown');

    try {
      const result = await cashuService.checkDepositAndMint(quoteId, amountSats);

      console.log('Mint response - paid:', result.paid);

      if (result.paid && result.proofs && result.proofs.length > 0) {
        const totalSats = result.proofs.reduce((sum, p) => sum + p.amount, 0);
        console.log('🎉 FOUND PAID DEPOSIT!');
        console.log('Proofs:', result.proofs.length);
        console.log('Total sats:', totalSats);

        // Calculate USD value (rough estimate)
        const usdValue = totalSats / 1000; // ~$1 per 1000 sats at $100k/BTC

        // Store proofs and mark complete
        await doc.ref.update({
          status: 'completed',
          completedAt: new Date(),
          proofs: result.proofs,
          amountSats: totalSats,
          recoveredAt: new Date(),
          notes: 'Recovered via recover-lost-payment script',
        });

        console.log('✅ Deposit marked as completed');
        console.log('USD value: ~$' + usdValue.toFixed(2));

        // Note: The actual balance credit should use the proofs value
        // For now we trust the deposit.amount
        console.log('\nProofs have been stored. The Bitcoin is recovered!');
        console.log('');
      } else if (result.paid) {
        console.log('⚠️ Paid but proofs already issued (or empty)');
      } else {
        console.log('Not paid');
      }

      if (result.error) {
        console.log('Error:', result.error);
      }
    } catch (error) {
      console.log('Error checking:', error instanceof Error ? error.message : error);
    }

    console.log('');
  }

  console.log('-----------------------------------');
  console.log('\nDone checking all pending deposits.');
}

main().catch(console.error);
