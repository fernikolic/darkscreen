#!/usr/bin/env tsx
/**
 * List agents without NIP-05 identity
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();
  const snap = await db.collection('agents').get();

  console.log('Agents WITHOUT NIP-05:\n');

  let count = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const hasNip05 = data.nip05 || data.nostrPubkey;

    if (!hasNip05) {
      count++;
      const created = data.createdAt?.toDate()?.toISOString()?.split('T')[0] || 'unknown';
      const desc = (data.description || 'none').substring(0, 60);

      console.log(`${count}. ${doc.id}`);
      console.log(`   Created: ${created}`);
      console.log(`   Description: ${desc}`);
      console.log(`   Skills: ${(data.skills || []).join(', ') || 'none'}`);
      console.log('');
    }
  }

  console.log(`Total: ${count} agents without NIP-05`);
}

main().catch(console.error);
