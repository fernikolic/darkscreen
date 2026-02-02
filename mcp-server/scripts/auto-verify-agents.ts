#!/usr/bin/env tsx
/**
 * Auto-verify agents who have earned it
 *
 * Verification criteria:
 * - Completed at least 1 task/bounty, OR
 * - Funded at least 1 escrow/bounty (became a client), OR
 * - Has Moltbook integration with karma > 10
 *
 * This makes the "Verified" badge meaningful.
 *
 * Usage:
 *   npx tsx scripts/auto-verify-agents.ts
 *   npx tsx scripts/auto-verify-agents.ts --dry-run
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

// Test account patterns - skip these for verification
const TEST_PATTERNS = [
  /^client-ml/,
  /^provider-ml/,
  /^e2e-/,
  /^test-/,
  /^client-verify-/,
  /^provider-verify-/,
];

function isTestAccount(agentId: string): boolean {
  return TEST_PATTERNS.some(pattern => pattern.test(agentId));
}

interface VerificationCandidate {
  agentId: string;
  reason: string;
  currentlyVerified: boolean;
}

async function findAgentsToVerify(): Promise<VerificationCandidate[]> {
  const db = getDb();
  const candidates: VerificationCandidate[] = [];

  // Get all agents
  const agentsSnap = await db.collection('agents').get();

  for (const doc of agentsSnap.docs) {
    const data = doc.data();
    const agentId = doc.id;
    const currentlyVerified = data.verified === true;

    // Skip test accounts
    if (isTestAccount(agentId)) {
      continue;
    }

    // Check criteria
    let shouldVerify = false;
    let reason = '';

    // Criterion 1: Completed tasks
    if (data.stats?.tasksCompleted > 0) {
      shouldVerify = true;
      reason = `Completed ${data.stats.tasksCompleted} task(s)`;
    }

    // Criterion 2: Moltbook integration with karma
    if (!shouldVerify && data.moltbookId && data.moltbookKarma > 10) {
      shouldVerify = true;
      reason = `Moltbook verified (karma: ${data.moltbookKarma})`;
    }

    // Criterion 3: Has funded escrows (became a client)
    if (!shouldVerify) {
      const escrowsSnap = await db.collection('escrows')
        .where('clientAgentId', '==', agentId)
        .limit(1)
        .get();

      if (!escrowsSnap.empty) {
        shouldVerify = true;
        reason = 'Funded escrow as client';
      }
    }

    // Criterion 4: Has posted funded bounties
    if (!shouldVerify) {
      const bountiesSnap = await db.collection('bounties')
        .where('posterId', '==', agentId)
        .where('status', 'in', ['open', 'claimed', 'in_review', 'completed'])
        .limit(1)
        .get();

      if (!bountiesSnap.empty) {
        shouldVerify = true;
        reason = 'Posted funded bounty';
      }
    }

    if (shouldVerify && !currentlyVerified) {
      candidates.push({ agentId, reason, currentlyVerified });
    }
  }

  return candidates;
}

async function verifyAgents(agentIds: string[]): Promise<number> {
  const db = getDb();
  let verified = 0;

  for (const agentId of agentIds) {
    await db.collection('agents').doc(agentId).update({
      verified: true,
      verifiedAt: new Date(),
    });
    verified++;
  }

  return verified;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔍 Auto-Verify Agents\n');
  console.log('Verification criteria:');
  console.log('  - Completed at least 1 task/bounty');
  console.log('  - Funded at least 1 escrow/bounty');
  console.log('  - Moltbook integration with karma > 10');
  console.log('');

  if (dryRun) {
    console.log('🧪 DRY RUN - No changes will be made\n');
  }

  console.log('='.repeat(50));

  initFirestore();

  const candidates = await findAgentsToVerify();

  if (candidates.length === 0) {
    console.log('\n✅ No agents need verification');
    console.log('   Either all qualifying agents are already verified,');
    console.log('   or no agents have met the criteria yet.');
    return;
  }

  console.log(`\n📋 Found ${candidates.length} agent(s) to verify:\n`);

  for (const candidate of candidates) {
    console.log(`   ${candidate.agentId}`);
    console.log(`      Reason: ${candidate.reason}`);
  }

  if (dryRun) {
    console.log('\n🧪 DRY RUN complete. Run without --dry-run to apply changes.');
    return;
  }

  console.log('\n⚡ Verifying agents...');
  const verified = await verifyAgents(candidates.map(c => c.agentId));

  console.log(`\n✅ Verified ${verified} agent(s)`);
  console.log('   They now have the "Verified" badge!');
}

main().catch(console.error);
