#!/usr/bin/env tsx
/**
 * Verify a Cashu deposit by checking with the mint
 */
import 'dotenv/config';
import { initFirestore, getDb, creditBalance } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

const DEPOSIT_ID = process.argv[2] || 'WuoQPVPSo_iEY5gPDClqJsj9Jw4uuWq82hRgUXr_';

async function main() {
  console.log('🔍 Verifying Cashu deposit:', DEPOSIT_ID);
  console.log('');

  initFirestore();
  const db = getDb();

  // Get deposit record
  const depositDoc = await db.collection('deposits').doc(DEPOSIT_ID).get();
  if (!depositDoc.exists) {
    console.error('❌ Deposit not found');
    process.exit(1);
  }

  const deposit = depositDoc.data()!;
  console.log('📝 Deposit record:');
  console.log('   Amount:', deposit.amount, 'USD worth of BTC');
  console.log('   Status:', deposit.status);
  console.log('   Agent:', deposit.agentId);
  console.log('');

  if (deposit.status === 'completed') {
    console.log('✅ Deposit already completed');
    return;
  }

  // The deposit ID is the quote ID
  const quoteId = DEPOSIT_ID;

  // Convert USD to sats (approximate: $1 = 1000 sats at ~$100k/BTC)
  // This is just for checking, the actual amount was set when invoice was created
  const amountSats = deposit.amountSats || deposit.amount * 1000;

  console.log('🔗 Checking with Cashu mint...');
  console.log('   Quote ID:', quoteId);
  console.log('   Expected sats:', amountSats);
  console.log('');

  try {
    const result = await cashuService.checkDepositAndMint(quoteId, amountSats);

    console.log('📊 Mint response:');
    console.log('   Success:', result.success);
    console.log('   Paid:', result.paid);

    if (result.error) {
      console.log('   Error:', result.error);
    }

    if (result.paid && result.proofs && result.proofs.length > 0) {
      console.log('   Proofs received:', result.proofs.length);
      const totalSats = result.proofs.reduce((sum, p) => sum + p.amount, 0);
      console.log('   Total sats:', totalSats);

      // Credit the balance
      console.log('\n💰 Crediting balance...');
      await creditBalance(deposit.agentId, deposit.amount);

      // Update deposit status and store proofs
      await depositDoc.ref.update({
        status: 'completed',
        completedAt: new Date(),
        proofs: result.proofs,
        amountSats: totalSats,
      });

      // Check new balance
      const agentDoc = await db.collection('agents').doc(deposit.agentId).get();
      console.log('✅ Deposit confirmed!');
      console.log('   New balance: $' + agentDoc.data()?.balance);
    } else if (result.paid) {
      console.log('\n⚠️  Paid but no proofs returned (may have been minted already)');
    } else {
      console.log('\n⏳ Invoice not paid yet');
      console.log('   Please pay the Lightning invoice to complete the deposit.');
    }
  } catch (error) {
    console.error('❌ Error checking mint:', error);
  }
}

main().catch(console.error);
