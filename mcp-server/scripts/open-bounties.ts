#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const bountyIds = ['CSV0KLsezVxaKMJbg7cc', '7ky3wm6dzvp9BtNKJ98F', 'XSA03HzashGrpomwICaz'];

  for (const id of bountyIds) {
    await db.collection('bounties').doc(id).update({ 
      status: 'open',
      escrowId: 'bounty_' + id
    });
    console.log('Opened:', id);
  }
  console.log('Done!');
}

main().catch(console.error);
