#!/usr/bin/env tsx
/**
 * Track organic (non-seeded) activity on Clawdentials
 *
 * This is the KEY SUCCESS METRIC:
 * - Are agents/clients funding escrows with their OWN money?
 * - Not just claiming bounties you seeded
 *
 * Usage:
 *   npx tsx scripts/track-organic-activity.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

// Known admin/seeding accounts - activity from these doesn't count as organic
const ADMIN_ACCOUNTS = [
  'clawdentials-bounties',
  'admin',
  'clawdentials-admin',
  'fernando',
  'fernikolic',
];

// Test account patterns - these are from automated tests, not real users
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

interface OrganicMetrics {
  // Escrows funded by non-admin accounts
  organicEscrows: number;
  organicEscrowValue: number;

  // Bounties posted by non-admin accounts
  organicBounties: number;
  organicBountyValue: number;

  // Deposits from non-admin accounts
  organicDeposits: number;
  organicDepositValue: number;

  // Agents who have done REAL activity (not just registered)
  activeAgents: string[];

  // Timeline of organic activity
  recentActivity: Array<{
    type: 'escrow' | 'bounty' | 'deposit';
    agentId: string;
    amount: number;
    date: Date;
  }>;
}

async function getOrganicMetrics(): Promise<OrganicMetrics> {
  const db = getDb();

  const metrics: OrganicMetrics = {
    organicEscrows: 0,
    organicEscrowValue: 0,
    organicBounties: 0,
    organicBountyValue: 0,
    organicDeposits: 0,
    organicDepositValue: 0,
    activeAgents: [],
    recentActivity: [],
  };

  const activeAgentsSet = new Set<string>();

  // Check escrows created by non-admin accounts
  const escrowsSnap = await db.collection('escrows').get();
  for (const doc of escrowsSnap.docs) {
    const data = doc.data();
    const clientId = data.clientAgentId;

    if (!ADMIN_ACCOUNTS.includes(clientId) && !isTestAccount(clientId)) {
      metrics.organicEscrows++;
      metrics.organicEscrowValue += data.amount || 0;
      activeAgentsSet.add(clientId);

      metrics.recentActivity.push({
        type: 'escrow',
        agentId: clientId,
        amount: data.amount || 0,
        date: data.createdAt?.toDate() || new Date(),
      });
    }
  }

  // Check bounties posted by non-admin accounts
  const bountiesSnap = await db.collection('bounties').get();
  for (const doc of bountiesSnap.docs) {
    const data = doc.data();
    const posterId = data.posterId;

    if (posterId && !ADMIN_ACCOUNTS.includes(posterId) && !isTestAccount(posterId) && data.status !== 'draft') {
      metrics.organicBounties++;
      metrics.organicBountyValue += data.amount || 0;
      activeAgentsSet.add(posterId);

      metrics.recentActivity.push({
        type: 'bounty',
        agentId: posterId,
        amount: data.amount || 0,
        date: data.createdAt?.toDate() || new Date(),
      });
    }
  }

  // Check deposits from non-admin accounts
  const depositsSnap = await db.collection('deposits').get();
  for (const doc of depositsSnap.docs) {
    const data = doc.data();
    const agentId = data.agentId;

    if (agentId && !ADMIN_ACCOUNTS.includes(agentId) && !isTestAccount(agentId) && data.status === 'completed') {
      metrics.organicDeposits++;
      metrics.organicDepositValue += data.amount || 0;
      activeAgentsSet.add(agentId);

      metrics.recentActivity.push({
        type: 'deposit',
        agentId: agentId,
        amount: data.amount || 0,
        date: data.createdAt?.toDate() || new Date(),
      });
    }
  }

  metrics.activeAgents = Array.from(activeAgentsSet);

  // Sort by date descending
  metrics.recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

  return metrics;
}

async function main() {
  console.log('🔍 Tracking Organic Activity\n');
  console.log('This is your KEY SUCCESS METRIC.');
  console.log('Organic = activity from non-admin accounts\n');
  console.log('='.repeat(60));

  initFirestore();

  const metrics = await getOrganicMetrics();

  console.log('\n📊 ORGANIC METRICS\n');

  // The headline number
  const totalOrganic = metrics.organicEscrows + metrics.organicBounties;
  const totalValue = metrics.organicEscrowValue + metrics.organicBountyValue;

  if (totalOrganic === 0) {
    console.log('⚠️  NO ORGANIC ACTIVITY YET');
    console.log('   All activity so far is seeded by admin accounts.');
    console.log('   The flywheel hasn\'t started spinning.\n');
  } else {
    console.log(`✅ ORGANIC ACTIVITY DETECTED!`);
    console.log(`   ${totalOrganic} transactions worth $${totalValue.toFixed(2)}\n`);
  }

  console.log('📈 Breakdown:');
  console.log(`   Escrows funded by others: ${metrics.organicEscrows} ($${metrics.organicEscrowValue.toFixed(2)})`);
  console.log(`   Bounties posted by others: ${metrics.organicBounties} ($${metrics.organicBountyValue.toFixed(2)})`);
  console.log(`   Deposits from others: ${metrics.organicDeposits} ($${metrics.organicDepositValue.toFixed(2)})`);

  console.log(`\n👥 Active Agents (non-admin): ${metrics.activeAgents.length}`);
  if (metrics.activeAgents.length > 0) {
    for (const agent of metrics.activeAgents.slice(0, 10)) {
      console.log(`   - ${agent}`);
    }
    if (metrics.activeAgents.length > 10) {
      console.log(`   ... and ${metrics.activeAgents.length - 10} more`);
    }
  }

  if (metrics.recentActivity.length > 0) {
    console.log('\n📅 Recent Organic Activity:');
    for (const activity of metrics.recentActivity.slice(0, 10)) {
      const date = activity.date.toISOString().split('T')[0];
      console.log(`   ${date} | ${activity.type.padEnd(7)} | ${activity.agentId} | $${activity.amount}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 SUCCESS CRITERIA (Month 3):');
  console.log(`   Organic escrows: ${metrics.organicEscrows}/50 ${metrics.organicEscrows >= 50 ? '✅' : '❌'}`);
  console.log(`   Active agents: ${metrics.activeAgents.length}/5 ${metrics.activeAgents.length >= 5 ? '✅' : '❌'}`);

  const allMet = metrics.organicEscrows >= 50 && metrics.activeAgents.length >= 5;
  console.log(`\n${allMet ? '🎉 CRITERIA MET - CONTINUE!' : '⏳ Keep building...'}`);
}

main().catch(console.error);
