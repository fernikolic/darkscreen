#!/usr/bin/env tsx
/**
 * Fix posterId on draft bounties and fund them
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

const POSTER_ID = 'clawdentials-bounties';
const API_KEY = process.env.POSTER_API_KEY;

async function main() {
  if (!API_KEY) {
    console.error('❌ POSTER_API_KEY required');
    process.exit(1);
  }

  console.log('🔧 Fixing and funding draft bounties\n');
  initFirestore();
  const db = getDb();

  // Get balance
  const agentDoc = await db.collection('agents').doc(POSTER_ID).get();
  let balance = agentDoc.data()?.balance || 0;
  console.log(`💵 Balance: $${balance.toFixed(2)}\n`);

  // Get all drafts with undefined posterId
  const draftsSnapshot = await db
    .collection('bounties')
    .where('status', '==', 'draft')
    .get();

  // Sort by amount
  const drafts = draftsSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((b: any) => !b.posterId || b.posterId === 'undefined')
    .sort((a: any, b: any) => (a.amount || 0) - (b.amount || 0));

  console.log(`Found ${drafts.length} drafts to fix\n`);

  let funded = 0;
  let spent = 0;

  for (const bounty of drafts) {
    const amount = (bounty as any).amount || 0;
    const title = (bounty as any).title || 'Untitled';

    if (spent + amount > balance) {
      console.log(`⏭️  Skip "$${amount} - ${title}" (exceeds balance)`);
      continue;
    }

    // Fix posterId and fund in one update
    const bountyRef = db.collection('bounties').doc(bounty.id);

    // Deduct from poster balance
    const newBalance = balance - amount;

    await db.runTransaction(async (t) => {
      // Update bounty
      t.update(bountyRef, {
        posterId: POSTER_ID,
        status: 'open',
        fundedAt: new Date(),
        updatedAt: new Date(),
      });

      // Deduct balance
      t.update(db.collection('agents').doc(POSTER_ID), {
        balance: newBalance,
        updatedAt: new Date(),
      });
    });

    balance = newBalance;
    funded++;
    spent += amount;
    console.log(`✅ $${amount} - ${title} → LIVE`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 SUMMARY`);
  console.log(`   Funded: ${funded} bounties`);
  console.log(`   Spent:  $${spent.toFixed(2)}`);
  console.log(`   Remaining: $${balance.toFixed(2)}`);
}

main().catch(console.error);
