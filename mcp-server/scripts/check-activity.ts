#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const snapshot = await db.collection('activity')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  console.log('=== MOLTBOT ACTIVITY ===\n');
  console.log(`Total entries: ${snapshot.size}\n`);

  snapshot.forEach(doc => {
    const d = doc.data();
    console.log('---');
    console.log('Agent:', d.agentId);
    console.log('Platform:', d.platform);
    console.log('Action:', d.action);
    console.log('Target:', d.targetId || 'n/a');
    console.log('Signal:', d.signal || 'n/a');
    console.log('Status:', d.status);
    console.log('Time:', d.timestamp?.toDate?.()?.toISOString() || 'no timestamp');
  });
}

main().catch(console.error);
