#!/usr/bin/env tsx
/**
 * Cleanup bounties - cancel expensive ones, keep micro bounties
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

const MAX_BOUNTY_AMOUNT = 3; // Keep bounties $3 and under

async function main() {
  console.log('🧹 BOUNTY CLEANUP\n');
  console.log(`Cancelling all bounties over $${MAX_BOUNTY_AMOUNT}...\n`);

  initFirestore();
  const db = getDb();

  const bounties = await db.collection('bounties').get();

  let cancelled = 0;
  let kept = 0;

  for (const doc of bounties.docs) {
    const bounty = doc.data();

    // Skip already completed or cancelled
    if (bounty.status === 'completed' || bounty.status === 'cancelled') {
      console.log(`   ⏭️  ${bounty.title} - already ${bounty.status}`);
      continue;
    }

    if (bounty.amount > MAX_BOUNTY_AMOUNT) {
      // Cancel this bounty
      await doc.ref.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: 'Beta cleanup - reducing bounty pool to micro bounties only',
      });
      console.log(`   ❌ $${bounty.amount} - ${bounty.title}`);
      cancelled++;
    } else {
      console.log(`   ✅ $${bounty.amount} - ${bounty.title}`);
      kept++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Cancelled: ${cancelled}`);
  console.log(`Kept: ${kept}`);

  // Show remaining open bounties
  const remaining = await db.collection('bounties')
    .where('status', '==', 'open')
    .get();

  const totalValue = remaining.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
  console.log(`\nOpen bounties: ${remaining.size} ($${totalValue} total)`);
}

main().catch(console.error);
