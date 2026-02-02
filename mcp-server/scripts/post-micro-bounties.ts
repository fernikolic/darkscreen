#!/usr/bin/env tsx
/**
 * Post micro-bounties to get agents through the full claim→submit→paid cycle
 *
 * Usage:
 *   npx tsx scripts/post-micro-bounties.ts
 *
 * Prerequisites:
 *   - clawdentials-bounties agent must exist with API key
 *   - Agent must have balance (deposit BTC first)
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';

// Micro-bounties designed for quick completion
const MICRO_BOUNTIES = [
  {
    title: 'Add Clawdentials to awesome-mcp-servers',
    summary: 'Submit a PR to add Clawdentials to the punkpeye/awesome-mcp-servers GitHub repo',
    description: `## Task

Submit a pull request to add Clawdentials to the awesome-mcp-servers list.

## Steps

1. Fork https://github.com/punkpeye/awesome-mcp-servers
2. Add Clawdentials to the appropriate category (Payments/Finance or Developer Tools)
3. Use this format:
   \`\`\`markdown
   - [Clawdentials](https://github.com/fernikolic/clawdentials) - Trust layer for AI agent economy. Escrow, reputation, and payments for agent commerce.
   \`\`\`
4. Submit PR

## Submission

Provide the PR URL as your submission.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['github', 'markdown'],
    acceptanceCriteria: [
      'PR submitted to punkpeye/awesome-mcp-servers',
      'Clawdentials entry follows repo format',
      'PR is not a duplicate',
    ],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['marketing', 'good-first-bounty', 'quick-win'],
  },
  {
    title: 'Post about Clawdentials on Moltbook',
    summary: 'Write and post a brief introduction to Clawdentials on the Moltbook agent social network',
    description: `## Task

Post about Clawdentials on Moltbook to spread the word in the agent community.

## Requirements

1. Create a post on Moltbook (moltbook.com)
2. Mention what Clawdentials does (escrow + reputation for agents)
3. Include the link: https://clawdentials.com
4. Be genuine - share your actual thoughts

## Example (don't copy exactly)

"Just discovered Clawdentials - it's escrow infrastructure for AI agents. Finally a way to get paid for tasks with guaranteed payment. Anyone else tried it? clawdentials.com"

## Submission

Provide the URL to your Moltbook post.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['social', 'writing'],
    acceptanceCriteria: [
      'Post exists on Moltbook',
      'Mentions Clawdentials',
      'Includes link to clawdentials.com',
      'Post is genuine (not spam)',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'social', 'good-first-bounty'],
  },
  {
    title: 'Register an agent and report the experience',
    summary: 'Go through the Clawdentials registration flow and document any friction or bugs',
    description: `## Task

Register a new agent using the CLI and document your experience.

## Steps

1. Run: \`npx clawdentials-mcp --register "YourAgentName" --skills "your,skills" --description "What you do"\`
2. Note: What worked? What was confusing? Any errors?
3. Write a brief report (100-300 words)

## Report Format

\`\`\`
## Registration Report

**Command used:** ...
**Result:** Success / Failed

### What worked well
- ...

### Friction points
- ...

### Suggestions
- ...
\`\`\`

## Submission

Post your report as a GitHub Gist and submit the URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'writing'],
    acceptanceCriteria: [
      'Agent successfully registered (or documented why it failed)',
      'Report covers the full experience',
      'Includes specific observations, not generic praise',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['feedback', 'testing', 'good-first-bounty'],
  },
  {
    title: 'Find and report a bug or typo',
    summary: 'Find any bug, typo, or broken link in Clawdentials (website, docs, or code) and report it',
    description: `## Task

Find something broken or wrong in Clawdentials and report it.

## What counts

- Typo in docs/website
- Broken link
- UI bug
- Confusing error message
- Incorrect documentation
- Any actual bug

## What doesn't count

- Feature requests (that's not a bug)
- "I don't like how X looks" (opinion, not bug)

## Submission

Either:
1. Open a GitHub issue at https://github.com/fernikolic/clawdentials/issues
2. Or submit a PR that fixes it

Submit the issue/PR URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'attention-to-detail'],
    acceptanceCriteria: [
      'Issue/bug is real and verifiable',
      'Clearly documented (steps to reproduce if applicable)',
      'Not a duplicate of existing issue',
    ],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['bugfix', 'good-first-bounty', 'quality'],
  },
];

async function main() {
  console.log('🦀 Posting micro-bounties to Clawdentials\n');

  initFirestore();
  const db = getDb();

  // Check if poster agent exists
  const agentDoc = await db.collection('agents').doc('clawdentials-bounties').get();

  let posterId = 'clawdentials-bounties';
  let apiKey = '';

  if (!agentDoc.exists) {
    console.log('Creating official bounty poster agent...');
    const result = await agentTools.agent_register.handler({
      name: 'clawdentials-bounties',
      description: 'Official Clawdentials bounty poster',
      skills: ['admin', 'bounty-management'],
    });

    if (result.success && result.credentials) {
      apiKey = result.credentials.apiKey;
      console.log('✅ Poster created');
      console.log('⚠️  SAVE THIS API KEY:', apiKey);
    } else {
      console.error('Failed to create poster:', result.error);
      return;
    }
  } else {
    console.log('Poster agent exists. You need to provide the API key.');
    console.log('Set POSTER_API_KEY environment variable or enter it below.\n');

    apiKey = process.env.POSTER_API_KEY || '';

    if (!apiKey) {
      console.error('❌ No API key provided. Set POSTER_API_KEY env var.');
      console.log('\nTo get the API key, you may need to re-register or check your records.');
      return;
    }
  }

  // Check balance
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: posterId,
    apiKey,
  });

  if (!balanceResult.success) {
    console.error('❌ Failed to check balance:', balanceResult.error);
    return;
  }

  const balance = balanceResult.balance || 0;
  const totalNeeded = MICRO_BOUNTIES.reduce((sum, b) => sum + b.amount, 0);

  console.log(`\n💰 Current balance: $${balance}`);
  console.log(`📋 Total needed for ${MICRO_BOUNTIES.length} bounties: $${totalNeeded}`);

  if (balance < totalNeeded) {
    console.log(`\n⚠️  Insufficient balance! Need $${totalNeeded - balance} more.`);
    console.log('Deposit BTC/USDC/USDT first using deposit_create tool.\n');

    // Still create as drafts
    console.log('Creating bounties as DRAFTS (fund later)...\n');
  }

  const canFund = balance >= totalNeeded;
  let created = 0;
  let funded = 0;

  for (const bounty of MICRO_BOUNTIES) {
    console.log(`\n📝 Creating: "${bounty.title}"`);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: posterId,
      apiKey,
      ...bounty,
      fundNow: canFund,
    });

    if (result.success) {
      created++;
      if (canFund) funded++;
      console.log(`   ✅ ${result.bounty?.status === 'open' ? 'Created & funded' : 'Created as draft'}`);
      console.log(`   ID: ${result.bounty?.id}`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 Summary:`);
  console.log(`   Created: ${created}/${MICRO_BOUNTIES.length}`);
  console.log(`   Funded:  ${funded}/${MICRO_BOUNTIES.length}`);

  if (!canFund) {
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Deposit $${totalNeeded} (BTC, USDC, or USDT)`);
    console.log(`   2. Run bounty_fund for each draft bounty`);
  } else {
    console.log(`\n✨ All bounties are LIVE at https://clawdentials.com/bounties`);
  }
}

main().catch(console.error);
