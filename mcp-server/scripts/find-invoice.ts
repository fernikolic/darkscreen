#!/usr/bin/env tsx
/**
 * Find a deposit by Lightning invoice
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

const INVOICE = process.argv[2] || 'lnbc120u1p5cq5xspp5zdfz48zt7gqcxa6f03ga7gm97e783fnshezp7m0r3cad8066afdsdqqcqzzsxqyz5vqrzjqvueefmrckfdwyyu39m0lf24sqzcr9vcrmxrvgfn6empxz7phrjxvrttncqq0lcqqyqqqqlgqqqqqqgq2qsp5dcn9fwwjgrvur9ps7qzxc3fnmq4dwfwfwdrt6m89zlvwteea3t6s9qxpqysgq89wflttr5xp9pr0h53yne2exy7asamu4533ljptd02pn6z8pfxy8u2cdauulvr6sslfkgh3xfjw3jf27du6xdlxqpzjdr40u8r8chuspw5kdvh';

async function main() {
  console.log('🔍 Searching for invoice...\n');
  console.log('Invoice:', INVOICE.slice(0, 50) + '...\n');

  // Decode invoice amount from lnbc format
  // lnbc120u = 120 * 1000 millisats = 12000 sats
  const match = INVOICE.match(/^lnbc(\d+)([munp])?/);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2] || '';
    let sats = amount;
    if (unit === 'm') sats = amount * 100000; // milli = 0.001 BTC
    if (unit === 'u') sats = amount * 100;     // micro = 0.000001 BTC
    if (unit === 'n') sats = amount * 0.1;     // nano
    if (unit === 'p') sats = amount * 0.0001;  // pico
    console.log('Decoded amount:', sats, 'sats (~$' + (sats / 1000).toFixed(2) + ' at $100k/BTC)\n');
  }

  initFirestore();
  const db = getDb();

  // Search all deposits for this invoice
  const deposits = await db.collection('deposits').get();

  console.log('Checking', deposits.size, 'deposits...\n');

  let found = false;
  for (const doc of deposits.docs) {
    const data = doc.data();

    // Check if invoice matches
    if (data.bolt11 === INVOICE || data.invoice === INVOICE || data.request === INVOICE) {
      console.log('✅ FOUND! Deposit:', doc.id);
      console.log('   Amount:', data.amount, data.currency);
      console.log('   Status:', data.status);
      console.log('   Agent:', data.agentId);
      found = true;
    }

    // Also show if any deposit has stored invoice
    if (data.bolt11 || data.invoice || data.request) {
      console.log('Deposit', doc.id, 'has invoice stored');
    }
  }

  if (!found) {
    console.log('❌ No deposit found with this invoice');
    console.log('\nThis invoice might be:');
    console.log('1. From a different system/wallet');
    console.log('2. Not stored in our database');
    console.log('3. Created but record was lost');
  }
}

main().catch(console.error);
