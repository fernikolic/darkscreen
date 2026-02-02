#!/usr/bin/env tsx
/**
 * Recover a lost Cashu payment by decoding the Lightning invoice
 * and querying the mint directly
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { CashuMint, CashuWallet } from '@cashu/cashu-ts';
import { decode } from 'bolt11';

const INVOICE = process.argv[2] || 'lnbc120u1p5cq5xspp5zdfz48zt7gqcxa6f03ga7gm97e783fnshezp7m0r3cad8066afdsdqqcqzzsxqyz5vqrzjqvueefmrckfdwyyu39m0lf24sqzcr9vcrmxrvgfn6empxz7phrjxvrttncqq0lcqqyqqqqlgqqqqqqgq2qsp5dcn9fwwjgrvur9ps7qzxc3fnmq4dwfwfwdrt6m89zlvwteea3t6s9qxpqysgq89wflttr5xp9pr0h53yne2exy7asamu4533ljptd02pn6z8pfxy8u2cdauulvr6sslfkgh3xfjw3jf27du6xdlxqpzjdr40u8r8chuspw5kdvh';

const MINT_URL = process.env.CASHU_MINT_URL || 'https://mint.minibits.cash/Bitcoin';

async function main() {
  console.log('🔍 RECOVERING PAYMENT BY INVOICE\n');

  // Step 1: Decode the invoice
  console.log('Step 1: Decoding Lightning invoice...');
  try {
    const decoded = decode(INVOICE);
    console.log('  Amount:', decoded.satoshis || decoded.millisatoshis! / 1000, 'sats');
    console.log('  Timestamp:', new Date((decoded.timestamp || 0) * 1000).toISOString());

    // Find payment hash
    const paymentHashTag = decoded.tags.find(t => t.tagName === 'payment_hash');
    if (paymentHashTag) {
      console.log('  Payment Hash:', paymentHashTag.data);
    }

    // Check expiry
    const expiryTag = decoded.tags.find(t => t.tagName === 'expire_time');
    if (expiryTag && decoded.timestamp) {
      const expiresAt = new Date((decoded.timestamp + Number(expiryTag.data)) * 1000);
      console.log('  Expires:', expiresAt.toISOString());
      if (expiresAt < new Date()) {
        console.log('  ⚠️  Invoice has EXPIRED');
      }
    }

    // Description
    const descTag = decoded.tags.find(t => t.tagName === 'description');
    if (descTag) {
      console.log('  Description:', descTag.data);
    }
    console.log('');
  } catch (e) {
    console.log('  Error decoding:', e);
    console.log('');
  }

  // Step 2: Check Firestore for matching invoice
  console.log('Step 2: Searching Firestore for matching invoice...');
  initFirestore();
  const db = getDb();

  const deposits = await db.collection('deposits').get();
  console.log('  Checking', deposits.size, 'deposits...');

  let matchedDeposit: any = null;
  for (const doc of deposits.docs) {
    const data = doc.data();
    if (data.bolt11 === INVOICE || data.request === INVOICE || data.invoice === INVOICE) {
      console.log('  ✅ FOUND MATCH!');
      console.log('     Quote ID:', doc.id);
      console.log('     Agent:', data.agentId);
      console.log('     Amount:', data.amount);
      console.log('     Status:', data.status);
      matchedDeposit = { id: doc.id, ...data };
      break;
    }
  }

  if (!matchedDeposit) {
    console.log('  ❌ No matching deposit found in Firestore');
    console.log('');

    // Step 3: Try to find it by querying mint with different approaches
    console.log('Step 3: Attempting direct mint query...');
    const mint = new CashuMint(MINT_URL);
    const wallet = new CashuWallet(mint);
    await wallet.loadMint();

    // List all pending deposits and try each one
    console.log('  Trying all pending Cashu quote IDs...');
    const pendingDeposits = await db.collection('deposits')
      .where('provider', '==', 'cashu')
      .where('status', '==', 'pending')
      .get();

    console.log('  Found', pendingDeposits.size, 'pending deposits\n');

    for (const doc of pendingDeposits.docs) {
      const data = doc.data();
      const quoteId = doc.id;

      console.log('  Checking quote:', quoteId);
      console.log('    Created:', data.createdAt?.toDate?.()?.toISOString() || 'unknown');
      console.log('    Amount: $', data.amount, '(', data.amountSats || data.amount * 1000, 'sats)');

      try {
        // Check quote status directly with mint
        const quote = await wallet.checkMintQuote(quoteId);
        console.log('    Quote State:', quote.state);

        if (quote.state === 'PAID') {
          console.log('    🎉 THIS QUOTE IS PAID!');

          // Try to mint proofs
          const amountSats = data.amountSats || data.amount * 1000;
          console.log('    Attempting to mint proofs for', amountSats, 'sats...');

          try {
            const proofs = await wallet.mintProofs(amountSats, quoteId);
            const totalSats = proofs.reduce((s, p) => s + p.amount, 0);

            console.log('    ✅ PROOFS MINTED!');
            console.log('    Total sats:', totalSats);
            console.log('    Proofs:', proofs.length);

            // Save to Firestore
            await doc.ref.update({
              status: 'completed',
              completedAt: new Date(),
              proofs: proofs,
              amountSats: totalSats,
              recoveredAt: new Date(),
              recoveryMethod: 'recover-by-invoice script',
            });

            console.log('    💾 Saved to Firestore!');
            console.log('\n✅ PAYMENT RECOVERED!');
            return;
          } catch (mintError) {
            console.log('    Mint error:', mintError instanceof Error ? mintError.message : mintError);
          }
        } else if (quote.state === 'ISSUED') {
          console.log('    ⚠️  Proofs already issued for this quote');
          // Check if we have the proofs stored
          if (data.proofs && data.proofs.length > 0) {
            console.log('    ✅ Proofs are stored in Firestore');
          } else {
            console.log('    ❌ Proofs NOT stored - they may be lost');
          }
        }
      } catch (e) {
        console.log('    Error:', e instanceof Error ? e.message : e);
      }
      console.log('');
    }

    // Step 4: Try to recreate the quote with the same invoice
    console.log('Step 4: Checking if invoice was generated by our mint...');
    console.log('  Mint URL:', MINT_URL);

    // The invoice should have been created by the same mint
    // We can try to call the mint's API directly
    try {
      const mintInfo = await fetch(`${MINT_URL}/v1/info`).then(r => r.json());
      console.log('  Mint Name:', mintInfo.name);
      console.log('  Mint Description:', mintInfo.description);
    } catch (e) {
      console.log('  Could not fetch mint info');
    }

    console.log('\n❌ RECOVERY FAILED');
    console.log('\nPossible reasons:');
    console.log('1. The invoice was generated but the quote ID was never stored');
    console.log('2. The invoice is from a different mint');
    console.log('3. The payment has already been claimed');
    console.log('\nNext steps:');
    console.log('1. Check your Lightning wallet transaction history for the payment');
    console.log('2. Contact Minibits mint support with the invoice');
    console.log('3. If payment failed, the sats should still be in your wallet');
  } else if (matchedDeposit.status === 'pending') {
    // We found the deposit, try to complete it
    console.log('\nStep 3: Attempting to complete the deposit...');
    const mint = new CashuMint(MINT_URL);
    const wallet = new CashuWallet(mint);
    await wallet.loadMint();

    const quoteId = matchedDeposit.id;
    const amountSats = matchedDeposit.amountSats || matchedDeposit.amount * 1000;

    console.log('  Quote ID:', quoteId);
    console.log('  Amount:', amountSats, 'sats');

    try {
      const quote = await wallet.checkMintQuote(quoteId);
      console.log('  Quote State:', quote.state);

      if (quote.state === 'PAID') {
        const proofs = await wallet.mintProofs(amountSats, quoteId);
        const totalSats = proofs.reduce((s, p) => s + p.amount, 0);

        console.log('  ✅ PROOFS MINTED!');
        console.log('  Total sats:', totalSats);

        const docRef = db.collection('deposits').doc(quoteId);
        await docRef.update({
          status: 'completed',
          completedAt: new Date(),
          proofs: proofs,
          amountSats: totalSats,
          recoveredAt: new Date(),
        });

        console.log('\n✅ PAYMENT RECOVERED AND CREDITED!');
      } else {
        console.log('  Quote not in PAID state');
      }
    } catch (e) {
      console.log('  Error:', e instanceof Error ? e.message : e);
    }
  }
}

main().catch(console.error);
