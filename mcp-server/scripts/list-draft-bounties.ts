#!/usr/bin/env npx tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

initFirestore();

async function main() {
  const db = getDb();
  const snap = await db.collection('bounties').where('status', '==', 'draft').get();

  console.log('📋 Draft Bounties (Need Funding):\n');
  let total = 0;
  snap.forEach(doc => {
    const b = doc.data();
    console.log(`  $${b.amount} ${b.currency} | ${b.title.substring(0, 50)}...`);
    total += b.amount;
  });
  console.log(`\n💰 Total to fund: $${total}`);
  console.log(`📊 Count: ${snap.size} bounties`);
}

main().catch(console.error);
