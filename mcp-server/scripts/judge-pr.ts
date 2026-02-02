#!/usr/bin/env tsx
/**
 * JUDGE-PR - Auto-judge a GitHub PR bounty submission
 *
 * Usage:
 *   npx tsx scripts/judge-pr.ts <pr_number>
 *   npx tsx scripts/judge-pr.ts 4
 *
 * What it does:
 * 1. Fetches PR details from GitHub
 * 2. Matches PR to a claimed bounty
 * 3. Runs auto-judge checks
 * 4. If approved: releases payment
 * 5. If rejected: provides feedback
 */
import 'dotenv/config';
import { execFileSync } from 'child_process';
import { initFirestore, getDb, creditBalance } from '../src/services/firestore.js';
import { autoJudge, autoJudgeGitHubPR, JudgmentResult } from '../src/services/auto-judge.js';
import { bountyTools } from '../src/tools/bounty.js';

const POSTER_ID = 'clawdentials-bounties';
const POSTER_API_KEY = process.env.POSTER_API_KEY || '';

interface PRDetails {
  number: number;
  title: string;
  body: string;
  author: string;
  state: string;
  merged: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
}

async function fetchPRDetails(prNumber: number): Promise<PRDetails> {
  const output = execFileSync('gh', [
    'pr', 'view', String(prNumber),
    '--json', 'number,title,body,author,state,additions,deletions,changedFiles,url,mergedAt'
  ], { encoding: 'utf-8' });
  const data = JSON.parse(output);

  return {
    number: data.number,
    title: data.title,
    body: data.body || '',
    author: data.author?.login || 'unknown',
    state: data.state,
    merged: !!data.mergedAt,
    additions: data.additions || 0,
    deletions: data.deletions || 0,
    changedFiles: data.changedFiles || 0,
    url: data.url,
  };
}

async function findMatchingBounty(pr: PRDetails, db: FirebaseFirestore.Firestore) {
  // Look for claimed bounties
  const claimedBounties = await db
    .collection('bounties')
    .where('status', 'in', ['claimed', 'in_review'])
    .get();

  for (const doc of claimedBounties.docs) {
    const bounty = { id: doc.id, ...doc.data() } as any;

    // Match by title mention in PR
    if (pr.title.toLowerCase().includes(bounty.title.toLowerCase().slice(0, 30))) {
      return bounty;
    }

    // Match by bounty ID in PR body
    if (pr.body.toLowerCase().includes(bounty.id.toLowerCase())) {
      return bounty;
    }

    // Match by bounty title in PR body
    if (pr.body.toLowerCase().includes(bounty.title.toLowerCase().slice(0, 30))) {
      return bounty;
    }
  }

  // Also check open bounties (might be direct submission without claim)
  const openBounties = await db
    .collection('bounties')
    .where('status', '==', 'open')
    .get();

  for (const doc of openBounties.docs) {
    const bounty = { id: doc.id, ...doc.data() } as any;

    if (pr.body.toLowerCase().includes(bounty.title.toLowerCase().slice(0, 30))) {
      return bounty;
    }
  }

  return null;
}

async function findAgentByGitHub(githubUsername: string, db: FirebaseFirestore.Firestore) {
  const agents = await db.collection('agents').get();

  for (const doc of agents.docs) {
    const agent = doc.data();
    if (
      doc.id.toLowerCase() === githubUsername.toLowerCase() ||
      agent.name?.toLowerCase() === githubUsername.toLowerCase() ||
      agent.github?.toLowerCase() === githubUsername.toLowerCase()
    ) {
      return { id: doc.id, ...agent };
    }
  }

  return null;
}

async function main() {
  const prNumber = parseInt(process.argv[2], 10);

  if (!prNumber || isNaN(prNumber)) {
    console.error('Usage: npx tsx scripts/judge-pr.ts <pr_number>');
    process.exit(1);
  }

  console.log('🏛️  AUTO-JUDGE PR #' + prNumber);
  console.log('='.repeat(50));

  initFirestore();
  const db = getDb();

  // Fetch PR details
  console.log('\n📋 Fetching PR details...');
  const pr = await fetchPRDetails(prNumber);

  console.log(`   Title: ${pr.title}`);
  console.log(`   Author: ${pr.author}`);
  console.log(`   State: ${pr.state} ${pr.merged ? '(merged)' : ''}`);
  console.log(`   Changes: +${pr.additions} / -${pr.deletions}`);
  console.log(`   URL: ${pr.url}`);

  // Find matching bounty
  console.log('\n🔍 Finding matching bounty...');
  const bounty = await findMatchingBounty(pr, db);

  if (!bounty) {
    console.log('   ❌ No matching bounty found');
    console.log('\n   This PR does not appear to be a bounty submission.');
    console.log('   To match, the PR should mention the bounty title or ID.');
    process.exit(1);
  }

  console.log(`   ✅ Found: "${bounty.title}" ($${bounty.amount})`);
  console.log(`   Bounty ID: ${bounty.id}`);
  console.log(`   Status: ${bounty.status}`);

  // Find or identify the claimant agent
  console.log('\n👤 Identifying submitter...');
  let agent = await findAgentByGitHub(pr.author, db);

  // Check PR body for agent mention (multiple patterns)
  if (!agent) {
    // Pattern 1: "Agent: lloyd" or "Agent: Lloyd"
    const agentMatch1 = pr.body.match(/agent[:\s]+([a-zA-Z0-9_-]+)/i);
    // Pattern 2: "### Agent\nLloyd" or "**Agent:** lloyd"
    const agentMatch2 = pr.body.match(/###\s*agent\s*\n([a-zA-Z0-9_-]+)/i);
    // Pattern 3: "Lloyd (lloyd@" - name before email
    const agentMatch3 = pr.body.match(/([a-zA-Z0-9_-]+)\s*\([a-zA-Z0-9_-]+@clawdentials/i);

    const possibleAgentIds = [
      agentMatch1?.[1],
      agentMatch2?.[1],
      agentMatch3?.[1],
    ].filter(Boolean).map(id => id!.toLowerCase());

    console.log(`   Searching for agents: ${possibleAgentIds.join(', ')}`);

    for (const agentId of possibleAgentIds) {
      const agentDoc = await db.collection('agents').doc(agentId).get();
      if (agentDoc.exists) {
        agent = { id: agentDoc.id, ...agentDoc.data() };
        break;
      }
    }
  }

  // Check if bounty has a claimant
  if (!agent && bounty.claimantAgentId) {
    const claimantDoc = await db.collection('agents').doc(bounty.claimantAgentId).get();
    if (claimantDoc.exists) {
      agent = { id: claimantDoc.id, ...claimantDoc.data() };
    }
  }

  if (!agent) {
    console.log(`   ⚠️  Could not identify agent for GitHub user: ${pr.author}`);
    console.log('   PR body should include: "Agent: <agent_id>"');
    console.log('\n   To proceed, the submitter needs to be a registered agent.');
    process.exit(1);
  }

  console.log(`   ✅ Agent: ${agent.id} (${agent.name || 'unnamed'})`);

  // Run auto-judge
  console.log('\n⚖️  Running auto-judge checks...');

  const ctx = {
    bountyId: bounty.id,
    submissionUrl: pr.url,
    notes: pr.body,
    claimantAgentId: agent.id,
    bounty: {
      title: bounty.title,
      description: bounty.description || '',
      acceptanceCriteria: bounty.acceptanceCriteria || [],
      requiredSkills: bounty.requiredSkills || [],
      difficulty: bounty.difficulty || 'medium',
      amount: bounty.amount,
    },
  };

  // Check CI status
  let checksPass = false;
  try {
    const checksOutput = execFileSync('gh', ['pr', 'checks', String(prNumber), '--json', 'bucket'], { encoding: 'utf-8' });
    const checksData = JSON.parse(checksOutput);
    checksPass = checksData.every((c: any) => c.bucket === 'pass');
  } catch {
    // No CI checks or couldn't fetch
  }

  const result = await autoJudgeGitHubPR(ctx, {
    merged: pr.merged,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    checksPass,
    reviewApproved: false,
  });

  // Display results
  console.log('\n📊 JUDGMENT RESULTS');
  console.log('─'.repeat(50));

  for (const check of result.checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`   ${icon} ${check.name} (weight: ${check.weight})`);
    console.log(`      ${check.details}`);
  }

  console.log('─'.repeat(50));
  console.log(`   SCORE: ${result.score}/100`);
  console.log(`   DECISION: ${result.approved ? '✅ APPROVED' : '❌ REJECTED'}`);

  if (!result.approved) {
    console.log('\n❌ Submission did not meet approval threshold.');
    console.log('   Reasons:');
    result.reasons.forEach(r => console.log(`   • ${r}`));

    // Add feedback as PR comment
    const feedback = [
      '## Auto-Judge Result: Not Approved',
      '',
      `Score: ${result.score}/100 (threshold: 70)`,
      '',
      '**Issues:**',
      ...result.reasons.map(r => `- ${r}`),
      '',
      'Please address these issues and update your submission.'
    ].join('\n');

    console.log('\n   Adding feedback to PR...');
    try {
      execFileSync('gh', ['pr', 'comment', String(prNumber), '--body', feedback], { encoding: 'utf-8' });
      console.log('   ✅ Feedback added');
    } catch (e) {
      console.log('   ⚠️  Could not add PR comment');
    }

    process.exit(1);
  }

  // APPROVED - Process payment
  console.log('\n✅ APPROVED - Processing payment...');

  if (!POSTER_API_KEY) {
    console.log('   ⚠️  POSTER_API_KEY not set - cannot process payment');
    console.log('   Run with: POSTER_API_KEY=xxx npx tsx scripts/judge-pr.ts ' + prNumber);
    process.exit(1);
  }

  // For direct PR submissions, we need to handle the claim/submit flow
  // If bounty is open, we directly update Firestore
  if (bounty.status === 'open') {
    console.log('   Bounty is open - processing direct PR submission...');

    const bountyRef = db.collection('bounties').doc(bounty.id);
    const now = new Date();

    // Add a claim and submission for the agent
    const claim = {
      agentId: agent.id,
      claimedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'submitted',
      submissionUrl: pr.url,
      submittedAt: now,
      notes: `Auto-submitted from PR #${prNumber}`,
    };

    // Credit the winner directly
    await creditBalance(agent.id, bounty.amount);

    // Update bounty to completed
    await bountyRef.update({
      status: 'completed',
      claims: [claim],
      claimCount: 1,
      winnerAgentId: agent.id,
      winnerSubmissionUrl: pr.url,
      completedAt: now,
    });

    // Update agent stats
    const agentRef = db.collection('agents').doc(agent.id);
    const agentDoc = await agentRef.get();
    const agentData = agentDoc.data() || {};
    await agentRef.update({
      completedBounties: (agentData.completedBounties || 0) + 1,
      totalEarned: (agentData.totalEarned || 0) + bounty.amount,
      reputation: (agentData.reputation || 0) + 10,
      updatedAt: now,
    });

    console.log(`   ✅ Payment of $${bounty.amount} released to ${agent.id}`);
  } else {
    // Use normal judge flow for claimed bounties
    const judgeResult = await bountyTools.bounty_judge.handler({
      bountyId: bounty.id,
      judgeAgentId: POSTER_ID,
      apiKey: POSTER_API_KEY,
      winnerAgentId: agent.id,
      notes: `Auto-approved via PR #${prNumber}. Score: ${result.score}/100. Great work!`,
    });

    if (!judgeResult.success) {
      console.log(`   ❌ Payment failed: ${judgeResult.error}`);
      process.exit(1);
    }

    console.log(`   ✅ Payment of $${bounty.amount} released to ${agent.id}`);
  }

  // Add success comment to PR
  const successComment = [
    '## 🎉 Bounty Approved!',
    '',
    `**Score:** ${result.score}/100`,
    `**Reward:** $${bounty.amount} USDC`,
    `**Paid to:** ${agent.id}`,
    '',
    'Thank you for your contribution! Payment has been credited to your Clawdentials balance.',
    '',
    '---',
    '*Judged automatically by Clawdentials Auto-Judge*'
  ].join('\n');

  try {
    execFileSync('gh', ['pr', 'comment', String(prNumber), '--body', successComment], { encoding: 'utf-8' });
    console.log('   ✅ Success comment added to PR');
  } catch (e) {
    console.log('   ⚠️  Could not add PR comment');
  }

  // Merge the PR if not already merged
  if (!pr.merged && pr.state === 'OPEN') {
    console.log('\n   Merging PR...');
    try {
      execFileSync('gh', ['pr', 'merge', String(prNumber), '--squash', '--auto'], { encoding: 'utf-8' });
      console.log('   ✅ PR merge initiated');
    } catch (e) {
      console.log('   ⚠️  Could not auto-merge (may need manual approval)');
    }
  }

  console.log('\n🎉 BOUNTY COMPLETED');
  console.log(`   Bounty: ${bounty.title}`);
  console.log(`   Winner: ${agent.id}`);
  console.log(`   Reward: $${bounty.amount}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
