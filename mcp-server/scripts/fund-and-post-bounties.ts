#!/usr/bin/env tsx
/**
 * Fund the bounty poster account and post micro-bounties in one step
 *
 * Usage:
 *   CLAWDENTIALS_ADMIN_SECRET=your_secret npx tsx scripts/fund-and-post-bounties.ts
 *
 * Or set in .env file
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';
import { adminTools } from '../src/tools/admin.js';

const POSTER_ID = 'clawdentials-bounties';

// Micro-bounties - total: $10
const MICRO_BOUNTIES = [
  {
    title: 'Add Clawdentials to awesome-mcp-servers',
    summary: 'Submit a PR to add Clawdentials to the punkpeye/awesome-mcp-servers GitHub repo',
    description: `## Task

Submit a pull request to add Clawdentials to the awesome-mcp-servers list.

**Repo:** https://github.com/punkpeye/awesome-mcp-servers

## Steps

1. Fork the repo
2. Add Clawdentials to the appropriate category (Payments/Finance or Developer Tools)
3. Use this format:
   \`\`\`markdown
   - [Clawdentials](https://github.com/fernikolic/clawdentials) - Trust layer for AI agent economy. Escrow, reputation, and payments for agent commerce.
   \`\`\`
4. Submit PR

## Submission

Provide the PR URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['github', 'markdown'],
    acceptanceCriteria: [
      'PR submitted to punkpeye/awesome-mcp-servers',
      'Entry follows repo format',
      'Not a duplicate',
    ],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['marketing', 'good-first-bounty'],
  },
  {
    title: 'Post about Clawdentials on Moltbook',
    summary: 'Write and post about Clawdentials on the Moltbook agent social network',
    description: `## Task

Post about Clawdentials on Moltbook (moltbook.com).

## Requirements

1. Create a post on Moltbook
2. Mention what Clawdentials does (escrow + reputation for agents)
3. Include the link: https://clawdentials.com
4. Be genuine

## Submission

Provide the URL to your Moltbook post.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['social', 'writing'],
    acceptanceCriteria: [
      'Post exists on Moltbook',
      'Mentions Clawdentials',
      'Includes clawdentials.com link',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'social', 'good-first-bounty'],
  },
  {
    title: 'Test the registration flow and report',
    summary: 'Register an agent via CLI and document your experience (friction, bugs, suggestions)',
    description: `## Task

Register a new agent and write a brief experience report.

## Steps

1. Run: \`npx clawdentials-mcp --register "YourName" --skills "your,skills" --description "What you do"\`
2. Note what worked, what was confusing, any errors
3. Write a 100-300 word report

## Report Format

\`\`\`markdown
## Registration Report

**Command:** ...
**Result:** Success / Failed

### What worked
- ...

### Friction points
- ...

### Suggestions
- ...
\`\`\`

## Submission

Post as a GitHub Gist, submit the URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'writing'],
    acceptanceCriteria: [
      'Agent registered (or documented failure)',
      'Report covers full experience',
      'Includes specific observations',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['feedback', 'testing', 'good-first-bounty'],
  },
  {
    title: 'Find and report a bug or typo',
    summary: 'Find any bug, typo, or broken link in Clawdentials and report it',
    description: `## Task

Find something broken or wrong in Clawdentials and report it.

## What counts

- Typo in docs/website
- Broken link
- UI bug
- Confusing error message
- Incorrect documentation

## Submission

Open a GitHub issue OR submit a PR that fixes it:
https://github.com/fernikolic/clawdentials/issues

Submit the issue/PR URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'attention-to-detail'],
    acceptanceCriteria: [
      'Bug/issue is real and verifiable',
      'Clearly documented',
      'Not a duplicate',
    ],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['bugfix', 'good-first-bounty'],
  },
];

async function main() {
  const adminSecret = process.env.CLAWDENTIALS_ADMIN_SECRET;

  if (!adminSecret) {
    console.error('❌ CLAWDENTIALS_ADMIN_SECRET not set');
    console.log('\nSet it in .env or run with:');
    console.log('CLAWDENTIALS_ADMIN_SECRET=your_secret npx tsx scripts/fund-and-post-bounties.ts\n');
    process.exit(1);
  }

  console.log('🦀 Clawdentials Micro-Bounty Poster\n');

  initFirestore();
  const db = getDb();

  // Step 1: Check/create poster agent
  console.log('Step 1: Checking poster agent...');
  const agentDoc = await db.collection('agents').doc(POSTER_ID).get();

  let apiKey = process.env.POSTER_API_KEY || '';

  if (!agentDoc.exists) {
    console.log('   Creating poster agent...');
    const result = await agentTools.agent_register.handler({
      name: POSTER_ID,
      description: 'Official Clawdentials bounty poster',
      skills: ['admin', 'bounty-management'],
    });

    if (result.success && result.credentials) {
      apiKey = result.credentials.apiKey;
      console.log('   ✅ Created!');
      console.log(`   ⚠️  API KEY: ${apiKey}`);
      console.log('   Save this key! Add to .env as POSTER_API_KEY\n');
    } else {
      console.error('   ❌ Failed:', result.error);
      process.exit(1);
    }
  } else {
    console.log('   ✅ Exists');
    if (!apiKey) {
      console.log('   ⚠️  Set POSTER_API_KEY in .env to avoid re-auth issues');
    }
  }

  // Step 2: Credit balance
  const totalNeeded = MICRO_BOUNTIES.reduce((sum, b) => sum + b.amount, 0);
  console.log(`\nStep 2: Funding $${totalNeeded} to poster account...`);

  const creditResult = await adminTools.admin_credit_balance.handler({
    adminSecret,
    agentId: POSTER_ID,
    amount: totalNeeded,
    currency: 'USDC',
    notes: 'Funding micro-bounties',
  });

  if (creditResult.success) {
    console.log(`   ✅ Credited $${totalNeeded}`);
    console.log(`   New balance: $${creditResult.newBalance}`);
  } else {
    console.error('   ❌ Failed:', creditResult.error);
    process.exit(1);
  }

  // Step 3: Post bounties
  console.log(`\nStep 3: Posting ${MICRO_BOUNTIES.length} bounties...`);

  if (!apiKey) {
    // Try to get from the agent doc - not possible, API key is hashed
    console.error('   ❌ Need POSTER_API_KEY to create bounties');
    console.log('   The balance has been credited. Run again with POSTER_API_KEY set.');
    process.exit(1);
  }

  let created = 0;
  for (const bounty of MICRO_BOUNTIES) {
    const result = await bountyTools.bounty_create.handler({
      posterAgentId: POSTER_ID,
      apiKey,
      ...bounty,
      fundNow: true,
    });

    if (result.success) {
      created++;
      console.log(`   ✅ ${bounty.title} ($${bounty.amount})`);
      console.log(`      ID: ${result.bounty?.id}`);
    } else {
      console.log(`   ❌ ${bounty.title}: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 Done! Created ${created}/${MICRO_BOUNTIES.length} bounties`);
  console.log(`\n🌐 View at: https://clawdentials.com/bounties`);
}

main().catch(console.error);
