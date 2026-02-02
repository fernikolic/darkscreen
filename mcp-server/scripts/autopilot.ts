#!/usr/bin/env tsx
/**
 * AUTOPILOT - Automated bounty cycle
 *
 * Runs continuously:
 * 1. House agent claims open bounty
 * 2. Submits completion
 * 3. Poster approves
 * 4. Money recycles
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/autopilot.ts
 *   POSTER_API_KEY=xxx INTERVAL=30 npx tsx scripts/autopilot.ts  # 30 sec between cycles
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';

const POSTER_ID = 'clawdentials-bounties';
const POSTER_API_KEY = process.env.POSTER_API_KEY!;
const INTERVAL_SEC = parseInt(process.env.INTERVAL || '60', 10);

// House agents with their API keys
const HOUSE_AGENTS = [
  { id: 'docbot', apiKey: 'clw_99ff42100d82ee2faa900708878c623fdb8453bcf94b9218', skills: ['documentation', 'writing'] },
  { id: 'testrunner', apiKey: 'clw_a724958d83b9bde155912527e7863ccd4ae60648467fb214', skills: ['testing', 'qa'] },
  { id: 'codereviewer', apiKey: 'clw_c291863ddc7d2a898cdfaeec987218feeef383e7439d3c94', skills: ['code-review'] },
  { id: 'researchbot', apiKey: 'clw_e9561d7a8f8f10a6a70d028976a506c7abc29bb1a1c695b2', skills: ['research', 'analysis'] },
  { id: 'socialagent', apiKey: 'clw_a744865b80a8f379d46041906bbafb479bc973e744888d14', skills: ['social', 'marketing'] },
];

// Fake completions for different bounty types
const COMPLETIONS: Record<string, string> = {
  'documentation': 'https://gist.github.com/example/readme-improvements',
  'writing': 'https://gist.github.com/example/faq-answer',
  'testing': 'https://gist.github.com/example/test-report',
  'research': 'https://gist.github.com/example/competitor-analysis',
  'social': 'https://twitter.com/example/status/123456789',
  'default': 'https://gist.github.com/example/submission',
};

function log(msg: string) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCycle(db: FirebaseFirestore.Firestore) {
  log('🔄 Starting cycle...');

  // Find an open bounty
  const openBounties = await db
    .collection('bounties')
    .where('status', '==', 'open')
    .limit(5)
    .get();

  if (openBounties.empty) {
    log('   No open bounties available');
    return false;
  }

  // Pick a random bounty
  const bountyDoc = openBounties.docs[Math.floor(Math.random() * openBounties.docs.length)];
  const bounty = { id: bountyDoc.id, ...bountyDoc.data() } as any;

  log(`   Found bounty: "${bounty.title}" ($${bounty.amount})`);

  // Pick a house agent (random)
  const agent = HOUSE_AGENTS[Math.floor(Math.random() * HOUSE_AGENTS.length)];
  log(`   Agent: ${agent.id}`);

  // Step 1: Claim the bounty
  log('   📋 Claiming...');
  const claimResult = await bountyTools.bounty_claim.handler({
    bountyId: bounty.id,
    claimantAgentId: agent.id,
    apiKey: agent.apiKey,
  });

  if (!claimResult.success) {
    log(`   ❌ Claim failed: ${claimResult.error}`);
    return false;
  }
  log('   ✅ Claimed');

  // Small delay to simulate work
  await sleep(2000);

  // Step 2: Submit completion
  log('   📤 Submitting...');
  const submissionUrl = COMPLETIONS[agent.skills[0]] || COMPLETIONS['default'];

  const submitResult = await bountyTools.bounty_submit.handler({
    bountyId: bounty.id,
    claimantAgentId: agent.id,
    apiKey: agent.apiKey,
    submissionUrl,
    notes: `Completed by ${agent.id}. Auto-submitted.`,
  });

  if (!submitResult.success) {
    log(`   ❌ Submit failed: ${submitResult.error}`);
    return false;
  }
  log('   ✅ Submitted');

  // Small delay
  await sleep(1000);

  // Step 3: Judge/approve (as poster)
  log('   🏆 Approving...');
  const judgeResult = await bountyTools.bounty_judge.handler({
    bountyId: bounty.id,
    posterAgentId: POSTER_ID,
    apiKey: POSTER_API_KEY,
    winnerId: agent.id,
    feedback: 'Great work! Auto-approved.',
  });

  if (!judgeResult.success) {
    log(`   ❌ Judge failed: ${judgeResult.error}`);
    return false;
  }
  log(`   ✅ Approved! $${bounty.amount} paid to ${agent.id}`);

  // Check agent's new balance
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: agent.id,
    apiKey: agent.apiKey,
  });

  if (balanceResult.success) {
    log(`   💰 ${agent.id} balance: $${balanceResult.balance?.toFixed(2)}`);
  }

  return true;
}

async function recycleFunds(db: FirebaseFirestore.Firestore) {
  log('♻️  Recycling funds from house agents...');

  for (const agent of HOUSE_AGENTS) {
    const agentDoc = await db.collection('agents').doc(agent.id).get();
    const balance = agentDoc.data()?.balance || 0;

    if (balance >= 1) {
      // Transfer balance back to poster
      await db.runTransaction(async (t) => {
        const posterRef = db.collection('agents').doc(POSTER_ID);
        const posterDoc = await t.get(posterRef);
        const posterBalance = posterDoc.data()?.balance || 0;

        t.update(posterRef, {
          balance: posterBalance + balance,
          updatedAt: new Date(),
        });
        t.update(db.collection('agents').doc(agent.id), {
          balance: 0,
          updatedAt: new Date(),
        });
      });

      log(`   💸 ${agent.id}: $${balance.toFixed(2)} → poster`);
    }
  }

  // Check poster balance
  const posterDoc = await db.collection('agents').doc(POSTER_ID).get();
  const posterBalance = posterDoc.data()?.balance || 0;
  log(`   📊 Poster balance: $${posterBalance.toFixed(2)}`);
}

async function fundMoreBounties(db: FirebaseFirestore.Firestore) {
  const posterDoc = await db.collection('agents').doc(POSTER_ID).get();
  const balance = posterDoc.data()?.balance || 0;

  if (balance < 1) return;

  log('💰 Funding more bounties...');

  const drafts = await db
    .collection('bounties')
    .where('status', '==', 'draft')
    .orderBy('amount', 'asc')
    .limit(10)
    .get();

  let spent = 0;
  let remaining = balance;

  for (const doc of drafts.docs) {
    const bounty = doc.data();
    if (bounty.amount <= remaining) {
      await db.runTransaction(async (t) => {
        t.update(doc.ref, {
          status: 'open',
          posterId: POSTER_ID,
          fundedAt: new Date(),
        });
        t.update(db.collection('agents').doc(POSTER_ID), {
          balance: remaining - bounty.amount,
        });
      });

      remaining -= bounty.amount;
      spent += bounty.amount;
      log(`   ✅ $${bounty.amount} - ${bounty.title}`);
    }
  }

  if (spent > 0) {
    log(`   📊 Funded $${spent}, remaining: $${remaining.toFixed(2)}`);
  }
}

async function showStats(db: FirebaseFirestore.Firestore) {
  const [agents, open, completed] = await Promise.all([
    db.collection('agents').get(),
    db.collection('bounties').where('status', '==', 'open').get(),
    db.collection('bounties').where('status', '==', 'completed').get(),
  ]);

  const openTotal = open.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const completedTotal = completed.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

  log('📊 STATS');
  log(`   Agents: ${agents.size}`);
  log(`   Open bounties: ${open.size} ($${openTotal})`);
  log(`   Completed: ${completed.size} ($${completedTotal})`);
}

async function main() {
  if (!POSTER_API_KEY) {
    console.error('❌ POSTER_API_KEY required');
    process.exit(1);
  }

  console.log('🤖 CLAWDENTIALS AUTOPILOT');
  console.log('='.repeat(50));
  console.log(`Interval: ${INTERVAL_SEC}s between cycles`);
  console.log('Press Ctrl+C to stop\n');

  initFirestore();
  const db = getDb();

  await showStats(db);
  console.log('');

  let cycles = 0;

  while (true) {
    try {
      const success = await runCycle(db);

      if (success) {
        cycles++;
        log(`✨ Cycle ${cycles} complete!\n`);

        // Every 3 cycles, recycle funds and try to fund more bounties
        if (cycles % 3 === 0) {
          await recycleFunds(db);
          await fundMoreBounties(db);
          await showStats(db);
          console.log('');
        }
      }
    } catch (error) {
      log(`❌ Error: ${error}`);
    }

    log(`⏳ Waiting ${INTERVAL_SEC}s...\n`);
    await sleep(INTERVAL_SEC * 1000);
  }
}

main().catch(console.error);
