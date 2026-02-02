#!/usr/bin/env npx tsx
/**
 * Test deposit status checking
 *
 * Verifies the Cashu verification flow works correctly.
 */

import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { paymentTools } from '../src/tools/payment.js';

initFirestore();

async function test() {
  const depositId = process.argv[2];

  if (!depositId) {
    // Find the most recent pending cashu deposit
    const db = getDb();
    const depositsSnap = await db.collection('deposits')
      .where('provider', '==', 'cashu')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (depositsSnap.empty) {
      console.log('❌ No pending Cashu deposits found');
      console.log('Usage: npx tsx scripts/test-deposit-status.ts <deposit-id>');
      return;
    }

    const deposit = depositsSnap.docs[0];
    console.log(`Testing most recent Cashu deposit: ${deposit.id}\n`);

    const result = await paymentTools.deposit_status.handler({
      depositId: deposit.id,
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  console.log(`🧪 Testing deposit status: ${depositId}\n`);

  const result = await paymentTools.deposit_status.handler({
    depositId,
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
