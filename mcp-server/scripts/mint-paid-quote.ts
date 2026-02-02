#!/usr/bin/env tsx
/**
 * Mint proofs for a paid quote with the correct amount
 */
import 'dotenv/config';
import { initFirestore, getDb, creditBalance } from '../src/services/firestore.js';
import { CashuMint, CashuWallet } from '@cashu/cashu-ts';

const MINT_URL = process.env.CASHU_MINT_URL || 'https://mint.minibits.cash/Bitcoin';

async function main() {
  console.log('🔍 Checking and minting paid quotes\n');

  initFirestore();
  const db = getDb();

  const mint = new CashuMint(MINT_URL);
  const wallet = new CashuWallet(mint);
  await wallet.loadMint();

  // Get all pending cashu deposits
  const deposits = await db.collection('deposits')
    .where('provider', '==', 'cashu')
    .where('status', '==', 'pending')
    .get();

  console.log('Found', deposits.size, 'pending deposits\n');

  for (const doc of deposits.docs) {
    const data = doc.data();
    const quoteId = doc.id;

    try {
      const quote = await wallet.checkMintQuote(quoteId);
      console.log('Quote:', quoteId);
      console.log('  State:', quote.state);
      console.log('  DB Amount: $', data.amount);

      if (quote.state === 'PAID') {
        console.log('  🎉 PAID! Attempting mint...');

        // The quote.amount is the actual amount that was paid
        // @ts-ignore - quote.amount exists in response
        const quoteAmount = (quote as any).amount;
        console.log('  Quote amount from mint:', quoteAmount);

        // Try with different amounts
        const amountsToTry = [
          quoteAmount, // Mint's reported amount
          data.amountSats,
          data.amount * 1000,
          5000,  // $5 at 1000 sats/$
          10000, // $10
          12000, // The invoice
        ].filter(Boolean);

        // Remove duplicates
        const uniqueAmounts = [...new Set(amountsToTry)];

        for (const amount of uniqueAmounts) {
          console.log('  Trying amount:', amount, 'sats');
          try {
            const proofs = await wallet.mintProofs(amount, quoteId);
            const totalSats = proofs.reduce((s, p) => s + p.amount, 0);

            console.log('  ✅ SUCCESS! Minted', totalSats, 'sats');
            console.log('  Proofs:', proofs.length);

            // Save to Firestore
            await doc.ref.update({
              status: 'completed',
              completedAt: new Date(),
              proofs: proofs,
              amountSats: totalSats,
              recoveredAt: new Date(),
              recoveryMethod: 'mint-paid-quote script',
            });

            // Credit the balance
            const usdValue = totalSats / 1000; // Rough estimate
            console.log('  Crediting $', usdValue.toFixed(2), 'to', data.agentId);
            await creditBalance(data.agentId, usdValue);

            // Get new balance
            const agentDoc = await db.collection('agents').doc(data.agentId).get();
            console.log('  New balance: $', agentDoc.data()?.balance);

            console.log('  ✅ RECOVERED!\n');
            break;
          } catch (e) {
            console.log('  Failed:', e instanceof Error ? e.message : e);
          }
        }
      } else if (quote.state === 'ISSUED') {
        console.log('  Already issued');
        if (data.proofs?.length > 0) {
          console.log('  Proofs stored ✓');
        } else {
          console.log('  ⚠️  No proofs stored - may be lost');
        }
      } else {
        console.log('  Not paid');
      }
    } catch (e) {
      console.log('Quote:', quoteId, '- Error:', e instanceof Error ? e.message : e);
    }
    console.log('');
  }

  console.log('Done');
}

main().catch(console.error);
