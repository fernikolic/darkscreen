#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const bounties = await db.collection('bounties')
    .where('status', '==', 'open')
    .get();

  console.log('=== OPEN BOUNTIES ===\n');
  console.log(`Total: ${bounties.size} bounties\n`);

  let total = 0;
  for (const doc of bounties.docs) {
    const b = doc.data();
    // Check various field names for reward
    const reward = b.reward || b.amount || b.value || 0;
    total += reward;
    console.log(`$${reward} | ${b.title}`);
    console.log(`   Skills: ${b.skills?.join(', ') || 'any'}`);
    console.log(`   Difficulty: ${b.difficulty || 'easy'}`);
    // Show raw data for first one to debug
    if (bounties.docs.indexOf(doc) === 0) {
      console.log('   [DEBUG] Fields:', Object.keys(b).join(', '));
    }
    console.log('');
  }

  console.log(`Total value: $${total}`);
}

main().catch(console.error);
