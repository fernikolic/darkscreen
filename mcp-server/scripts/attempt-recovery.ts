#!/usr/bin/env npx tsx
/**
 * Attempt to recover lost Cashu deposit
 *
 * The mint (minibits.cash) stores quotes. Even without our quote ID,
 * if we have the bolt11 invoice, we can try to find the quote by:
 * 1. Decoding the bolt11 to get the payment_hash
 * 2. Checking if the mint has an endpoint to lookup by payment_hash
 * 3. Or contacting mint support with the invoice
 */

import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

initFirestore();

const CASHU_MINT_URL = 'https://mint.minibits.cash/Bitcoin';

// Decode bolt11 to extract payment hash (simplified - just extract from pp field)
function extractPaymentHash(bolt11: string): string | null {
  // The payment hash is after 'pp' in the bech32 data
  // This is a simplified extraction - bolt11 format is complex
  try {
    // Look for the pattern in the invoice
    const match = bolt11.match(/pp5?([a-z0-9]{52})/);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.log('Could not extract payment hash');
  }
  return null;
}

async function main() {
  const depositId = process.argv[2] || 'rQuc9kQJOAY5jB_hFKjwroOGL0wYpPQa1lZgdhdc';

  const db = getDb();
  const doc = await db.collection('deposits').doc(depositId).get();

  if (!doc.exists) {
    console.log('Deposit not found');
    return;
  }

  const d = doc.data()!;
  console.log('🔧 Attempting to recover deposit\n');
  console.log(`ID: ${depositId}`);
  console.log(`Agent: ${d.agentId}`);
  console.log(`Amount: ${d.amountSats || d.amount} sats`);
  console.log(`Invoice: ${d.bolt11}`);
  console.log();

  if (!d.bolt11) {
    console.log('❌ No invoice stored - cannot recover');
    return;
  }

  // Try to get info from the mint
  console.log('Checking mint info...');
  try {
    const infoResp = await fetch(`${CASHU_MINT_URL}/v1/info`);
    const info = await infoResp.json();
    console.log(`Mint: ${info.name}`);
    console.log(`Contact: ${JSON.stringify(info.contact)}`);
  } catch (e) {
    console.log('Could not get mint info');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOVERY OPTIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Option 1: Contact Minibits support');
  console.log('  - Email: support@minibits.cash');
  console.log('  - Provide the bolt11 invoice');
  console.log('  - Ask them to lookup the quote and mint proofs\n');

  console.log('Option 2: If invoice was NOT paid');
  console.log('  - No recovery needed - no funds lost');
  console.log('  - Check your wallet payment history\n');

  console.log('Option 3: Manual credit (if you can prove payment)');
  console.log('  - If you have the preimage (payment proof)');
  console.log('  - We can manually credit the balance');
  console.log(`  - Run: npx tsx scripts/manual-credit.ts ${d.agentId} ${d.amount}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nFull invoice for reference:');
  console.log(d.bolt11);
}

main().catch(console.error);
