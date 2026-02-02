#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  console.log('=== ALL DEPOSITS ===\n');

  const deposits = await db.collection('deposits').limit(20).get();
  console.log(`Found ${deposits.size} deposits:\n`);

  let totalCompleted = 0;

  deposits.docs.forEach(d => {
    const data = d.data();
    const status = data.status;
    const icon = status === 'completed' ? '✅' : status === 'pending' ? '⏳' : '❌';
    console.log(`${icon} ${d.id}`);
    console.log(`   Amount: $${data.amount} ${data.currency}`);
    console.log(`   Status: ${status}`);
    console.log(`   Agent: ${data.agentId}`);
    console.log(`   Created: ${data.createdAt?.toDate?.()?.toISOString() || 'unknown'}`);
    console.log('');

    if (status === 'completed') {
      totalCompleted += data.amount;
    }
  });

  console.log('=== POSTER BALANCE ===\n');
  const poster = await db.collection('agents').doc('clawdentials-bounties').get();
  console.log(`Balance: $${poster.data()?.balance || 0}`);
  console.log(`Total completed deposits: $${totalCompleted}`);
}

main().catch(console.error);
