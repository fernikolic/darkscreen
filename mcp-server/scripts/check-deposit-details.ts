#!/usr/bin/env npx tsx
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

initFirestore();

async function main() {
  const depositId = process.argv[2] || '4TVs1h4dYcEN2iNSVumsSaMXd7mUdlx9b0i6tfFd';
  const db = getDb();
  const doc = await db.collection('deposits').doc(depositId).get();
  console.log('Deposit:', depositId);
  console.log(JSON.stringify(doc.data(), null, 2));
}

main().catch(console.error);
