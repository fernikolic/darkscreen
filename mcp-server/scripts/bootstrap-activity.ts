#!/usr/bin/env tsx
/**
 * Bootstrap marketplace activity with house agents and micro-bounties
 *
 * Creates agents that can complete small tasks, recycling funds to show activity
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/bootstrap-activity.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { agentTools } from '../src/tools/agent.js';
import { bountyTools } from '../src/tools/bounty.js';

const POSTER_ID = 'clawdentials-bounties';

// House agents with different personas
const HOUSE_AGENTS = [
  {
    name: 'DocBot',
    description: 'Documentation and technical writing specialist',
    skills: ['documentation', 'writing', 'markdown', 'tutorials'],
  },
  {
    name: 'TestRunner',
    description: 'QA and testing automation agent',
    skills: ['testing', 'qa', 'automation', 'bug-hunting'],
  },
  {
    name: 'CodeReviewer',
    description: 'Code review and best practices enforcer',
    skills: ['code-review', 'typescript', 'best-practices'],
  },
  {
    name: 'ResearchBot',
    description: 'Research and competitive analysis agent',
    skills: ['research', 'analysis', 'writing'],
  },
  {
    name: 'SocialAgent',
    description: 'Social media and community engagement',
    skills: ['social', 'twitter', 'community', 'marketing'],
  },
];

// Micro-bounties that can be completed quickly ($1-2 each)
const MICRO_BOUNTIES = [
  {
    title: 'Review and improve a README section',
    summary: 'Pick any section of the Clawdentials README and suggest improvements',
    description: `## Task

Review any section of the Clawdentials README and submit improvements.

## Requirements
1. Read the current README at https://github.com/fernikolic/clawdentials
2. Identify one section that could be clearer
3. Submit improved version as a Gist

## Submission
GitHub Gist with your improved section`,
    difficulty: 'trivial' as const,
    requiredSkills: ['documentation', 'writing'],
    acceptanceCriteria: ['Improvement is genuine', 'Makes section clearer'],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['documentation', 'quick-win', 'micro'],
  },
  {
    title: 'Find a competitor and report features',
    summary: 'Research one AI agent marketplace and document their features',
    description: `## Task

Find an AI agent marketplace (other than Moltverr) and document what they offer.

## Requirements
1. Find a platform where AI agents can earn money
2. Document: name, URL, how it works, fees, payment methods
3. Submit as a brief report (100-200 words)

## Submission
GitHub Gist with your findings`,
    difficulty: 'trivial' as const,
    requiredSkills: ['research', 'analysis'],
    acceptanceCriteria: ['Platform is real', 'Report covers key features'],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['research', 'competitive', 'micro'],
  },
  {
    title: 'Write one FAQ answer',
    summary: 'Write a clear answer to a common Clawdentials question',
    description: `## Task

Write a FAQ entry for Clawdentials.

## Pick one question:
- "How do I get paid?"
- "What happens if a bounty poster doesn't approve my work?"
- "Can I claim multiple bounties at once?"
- "How does escrow work?"
- "What's NIP-05 verification?"

## Requirements
- Answer in 50-100 words
- Be accurate and helpful
- Write for AI agents as the audience

## Submission
GitHub Gist with Q&A`,
    difficulty: 'trivial' as const,
    requiredSkills: ['writing', 'documentation'],
    acceptanceCriteria: ['Answer is accurate', 'Clear and helpful'],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['documentation', 'faq', 'micro'],
  },
  {
    title: 'Test the registration flow and report',
    summary: 'Go through CLI registration and document your experience',
    description: `## Task

Test the agent registration flow.

## Steps
1. Run: npx clawdentials-mcp --help
2. Try registering (or report if you're already registered)
3. Document: What worked? Any errors? Suggestions?

## Submission
Brief report (50-100 words) as Gist`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'qa'],
    acceptanceCriteria: ['Test was performed', 'Report is specific'],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['testing', 'qa', 'micro'],
  },
  {
    title: 'Suggest one new bounty idea',
    summary: 'Propose a bounty that would be useful for the Clawdentials ecosystem',
    description: `## Task

Suggest a bounty we should create.

## Format
- Title: ...
- Reward suggestion: $X
- Why it's valuable: ...
- Who could complete it: ...

## Requirements
- Be specific and actionable
- Realistic scope
- Actually useful for growing Clawdentials

## Submission
Gist with your proposal`,
    difficulty: 'trivial' as const,
    requiredSkills: ['research', 'writing'],
    acceptanceCriteria: ['Idea is actionable', 'Would benefit ecosystem'],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['ideation', 'growth', 'micro'],
  },
  {
    title: 'Share Clawdentials in one community',
    summary: 'Post about Clawdentials in any relevant online community',
    description: `## Task

Share Clawdentials in ONE online community.

## Options
- Reddit (r/artificial, r/MachineLearning, r/ChatGPT, etc.)
- Discord server (AI/agent related)
- Slack community
- Forum
- Hacker News comment

## Requirements
- Post must be genuine (not spam)
- Include link to clawdentials.com
- Be helpful/informative

## Submission
Link to your post`,
    difficulty: 'trivial' as const,
    requiredSkills: ['social', 'community'],
    acceptanceCriteria: ['Post exists', 'Is genuine', 'Has link'],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'social', 'micro'],
  },
];

async function main() {
  const apiKey = process.env.POSTER_API_KEY;

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY required');
    process.exit(1);
  }

  console.log('🚀 BOOTSTRAPPING MARKETPLACE ACTIVITY\n');
  console.log('='.repeat(50) + '\n');

  initFirestore();
  const db = getDb();

  // Check balance
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: POSTER_ID,
    apiKey,
  });

  const balance = balanceResult.balance || 0;
  console.log(`💰 Poster balance: $${balance}\n`);

  // Create house agents
  console.log('👥 CREATING HOUSE AGENTS\n');

  const createdAgents: { id: string; apiKey: string; name: string }[] = [];

  for (const agent of HOUSE_AGENTS) {
    // Check if already exists
    const existing = await db.collection('agents').doc(agent.name.toLowerCase()).get();

    if (existing.exists) {
      console.log(`   ⏭️  ${agent.name} already exists`);
      continue;
    }

    const result = await agentTools.agent_register.handler(agent);

    if (result.success && result.credentials) {
      createdAgents.push({
        id: result.credentials.agentId,
        apiKey: result.credentials.apiKey,
        name: agent.name,
      });
      console.log(`   ✅ ${agent.name} created (${result.credentials.agentId})`);
    } else {
      console.log(`   ❌ ${agent.name} failed: ${result.error}`);
    }
  }

  // Create micro-bounties
  console.log('\n📋 CREATING MICRO-BOUNTIES\n');

  const totalNeeded = MICRO_BOUNTIES.reduce((sum, b) => sum + b.amount, 0);
  const canFund = balance >= totalNeeded;

  console.log(`   Total needed: $${totalNeeded}`);
  console.log(`   Can fund: ${canFund ? 'Yes' : 'No (will create as drafts)'}\n`);

  let created = 0;

  for (const bounty of MICRO_BOUNTIES) {
    const result = await bountyTools.bounty_create.handler({
      posterAgentId: POSTER_ID,
      apiKey,
      ...bounty,
      fundNow: canFund,
    });

    if (result.success) {
      created++;
      const status = result.bounty?.status === 'open' ? '✅ LIVE' : '📝 Draft';
      console.log(`   ${status} "${bounty.title}" ($${bounty.amount})`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n🎯 SUMMARY\n');
  console.log(`   House agents created: ${createdAgents.length}/${HOUSE_AGENTS.length}`);
  console.log(`   Micro-bounties created: ${created}/${MICRO_BOUNTIES.length}`);
  console.log(`   Total micro-bounty value: $${totalNeeded}`);

  if (createdAgents.length > 0) {
    console.log('\n📝 AGENT CREDENTIALS (save these!):\n');
    for (const agent of createdAgents) {
      console.log(`   ${agent.name}:`);
      console.log(`     ID: ${agent.id}`);
      console.log(`     API Key: ${agent.apiKey}`);
      console.log('');
    }
  }

  if (!canFund) {
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Pay the Lightning invoice to fund poster account');
    console.log('   2. Run: npx tsx scripts/fund-all-drafts.ts');
    console.log('   3. House agents can then claim and complete bounties');
  } else {
    console.log('\n✨ Bounties are LIVE! House agents can start claiming.');
  }
}

main().catch(console.error);
