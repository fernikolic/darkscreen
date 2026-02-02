#!/usr/bin/env npx tsx
/**
 * Find potentially lost deposits
 *
 * Looks for Cashu deposits that:
 * - Have bolt11 invoice (meaning they were real deposits)
 * - Are still pending
 * - May have been paid but not credited
 */

import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

initFirestore();

async function main() {
  const db = getDb();

  console.log('🔍 Searching for potentially lost Cashu deposits...\n');

  // Find all pending Cashu deposits
  const snap = await db.collection('deposits')
    .where('provider', '==', 'cashu')
    .where('status', '==', 'pending')
    .get();

  console.log(`Found ${snap.size} pending Cashu deposits\n`);

  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`ID: ${doc.id}`);
    console.log(`Agent: ${d.agentId}`);
    console.log(`Amount: ${d.amountSats || d.amount} sats ($${d.amount})`);
    console.log(`Has bolt11: ${d.bolt11 ? 'YES' : 'NO'}`);
    console.log(`Has externalId (quote): ${d.externalId ? 'YES' : 'NO'}`);
    console.log(`Created: ${d.createdAt?._seconds ? new Date(d.createdAt._seconds * 1000).toISOString() : d.createdAt}`);

    if (d.bolt11) {
      console.log(`Invoice: ${d.bolt11.substring(0, 60)}...`);
    }

    // If we have externalId, try to check status
    if (d.externalId) {
      console.log(`\nChecking with Cashu mint...`);
      try {
        const result = await cashuService.checkDepositAndMint(d.externalId, d.amountSats || d.amount);
        console.log(`  Paid: ${result.paid}`);
        if (result.paid && result.proofs) {
          console.log(`  ✅ RECOVERABLE! Proofs: ${result.proofs.length}`);
          console.log(`  Run: npx tsx scripts/recover-deposit.ts ${doc.id}`);
        } else if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      } catch (e) {
        console.log(`  Error checking: ${e}`);
      }
    } else if (d.bolt11) {
      console.log(`\n⚠️  Has invoice but NO quote ID - cannot verify with mint`);
      console.log(`  If this was paid, funds may be stuck at the mint`);
      console.log(`  Contact mint operator with the invoice to recover`);
    }

    console.log();
  }

  console.log(`\nNote: Deposits without externalId (quote ID) cannot be automatically verified.`);
  console.log(`The bug that caused missing externalId has been fixed.`);
}

main().catch(console.error);
