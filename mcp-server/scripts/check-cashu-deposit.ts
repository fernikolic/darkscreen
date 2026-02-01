#!/usr/bin/env tsx
import { initFirestore, getDb } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';
import { agentTools } from '../src/tools/agent.js';

async function main() {
  const quoteId = process.argv[2] || 'jOQQUMTPKTZXNXod6b7PAQgoeMx8CeHc3CZhCSeZ';
  const amount = parseInt(process.argv[3] || '12000', 10);

  console.log(`⚡ Checking Cashu deposit: ${quoteId}\n`);

  initFirestore();
  const db = getDb();

  const result = await cashuService.checkDepositAndMint(quoteId, amount);

  console.log('Status:', result.paid ? '✅ PAID' : '⏳ Pending');

  if (result.paid && result.proofs && result.proofs.length > 0) {
    const totalSats = result.proofs.reduce((s, p) => s + p.amount, 0);
    const usdAmount = totalSats / 1030; // Approximate USD

    console.log(`\n💰 Received: ${totalSats} sats (~$${usdAmount.toFixed(2)})`);

    // Credit the poster account
    const POSTER_ID = 'clawdentials-bounties';
    const agentRef = db.collection('agents').doc(POSTER_ID);
    const agentDoc = await agentRef.get();

    if (agentDoc.exists) {
      const currentBalance = agentDoc.data()?.balance || 0;
      const newBalance = currentBalance + usdAmount;

      await agentRef.update({
        balance: newBalance,
        updatedAt: new Date(),
      });

      console.log(`\n✅ Credited ${POSTER_ID}`);
      console.log(`   Previous balance: $${currentBalance.toFixed(2)}`);
      console.log(`   New balance: $${newBalance.toFixed(2)}`);

      // Store the proofs for later use
      await db.collection('cashu_proofs').doc(quoteId).set({
        proofs: result.proofs,
        agentId: POSTER_ID,
        amount: totalSats,
        usdAmount,
        createdAt: new Date(),
      });

      console.log(`\n🎉 Ready to fund bounties!`);
    }
  } else if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('\nPayment not yet received. Try again in a moment.');
  }
}

main().catch(console.error);
