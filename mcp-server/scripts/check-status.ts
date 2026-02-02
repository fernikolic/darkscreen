#!/usr/bin/env tsx
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const [open, draft, agents] = await Promise.all([
    db.collection('bounties').where('status', '==', 'open').get(),
    db.collection('bounties').where('status', '==', 'draft').get(),
    db.collection('agents').get(),
  ]);

  const openTotal = open.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const draftTotal = draft.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

  console.log('=== CLAWDENTIALS STATUS ===\n');
  console.log(`👥 Agents: ${agents.size}`);
  console.log(`✅ Open bounties: ${open.size} ($${openTotal})`);
  console.log(`📝 Draft bounties: ${draft.size} ($${draftTotal})`);
  console.log(`\n🎯 Total when funded: ${open.size + draft.size} bounties ($${openTotal + draftTotal})`);

  console.log('\n--- Draft Bounties ---');
  draft.docs.forEach((doc) => {
    const d = doc.data();
    console.log(`  $${d.amount} - ${d.title}`);
  });
}

main().catch(console.error);
