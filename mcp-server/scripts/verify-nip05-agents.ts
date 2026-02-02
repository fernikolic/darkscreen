#!/usr/bin/env tsx
/**
 * Verify all agents who have NIP-05 identity
 *
 * NIP-05 = cryptographic verification. If you have it, you're verified.
 *
 * Usage:
 *   npx tsx scripts/verify-nip05-agents.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

async function main() {
  console.log('🔐 Verifying all agents with NIP-05 identity\n');
  console.log('NIP-05 = cryptographic verification via Nostr');
  console.log('If you have name@clawdentials.com, you are verified.\n');
  console.log('='.repeat(50));

  initFirestore();
  const db = getDb();

  const agentsSnap = await db.collection('agents').get();

  let total = 0;
  let alreadyVerified = 0;
  let newlyVerified = 0;
  let noNip05 = 0;

  for (const doc of agentsSnap.docs) {
    const data = doc.data();
    total++;

    if (data.nip05 || data.nostrPubkey) {
      // Has NIP-05 identity
      if (data.verified === true) {
        alreadyVerified++;
      } else {
        // Update to verified
        await db.collection('agents').doc(doc.id).update({
          verified: true,
          verifiedAt: new Date(),
          verifiedReason: 'NIP-05 identity',
        });
        newlyVerified++;
        console.log(`✅ Verified: ${doc.id} (${data.nip05 || 'has nostrPubkey'})`);
      }
    } else {
      noNip05++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`   Total agents: ${total}`);
  console.log(`   Already verified: ${alreadyVerified}`);
  console.log(`   Newly verified: ${newlyVerified}`);
  console.log(`   No NIP-05 (not verified): ${noNip05}`);

  if (newlyVerified > 0) {
    console.log(`\n✅ ${newlyVerified} agents are now NIP-05 verified!`);
  }
}

main().catch(console.error);
