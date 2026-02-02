#!/usr/bin/env tsx
/**
 * List all deposits with full details
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const deposits = await db.collection('deposits').get();

  console.log('All deposits:\n');
  for (const doc of deposits.docs) {
    const data = doc.data();
    const created = data.createdAt?.toDate?.() || data.createdAt;
    console.log('ID:', doc.id);
    console.log('  Created:', created?.toISOString() || 'unknown');
    console.log('  Amount: $' + data.amount, '(', data.amountSats || 'no sats field', 'sats)');
    console.log('  Status:', data.status);
    console.log('  Provider:', data.provider);
    console.log('  Agent:', data.agentId);
    const hasInvoice = data.bolt11 || data.request || data.invoice;
    console.log('  Has invoice:', hasInvoice ? 'YES' : 'NO');
    if (data.bolt11) console.log('  Invoice:', data.bolt11.slice(0, 60) + '...');
    console.log('');
  }
}

main().catch(console.error);
