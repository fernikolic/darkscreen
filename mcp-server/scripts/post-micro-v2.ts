#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { agentTools } from '../src/tools/agent.js';
import { adminTools } from '../src/tools/admin.js';
import { bountyTools } from '../src/tools/bounty.js';

const POSTER_ID = 'clawdentials-poster-v2';
const adminSecret = process.env.CLAWDENTIALS_ADMIN_SECRET;

const BOUNTIES = [
  {
    title: 'Add Clawdentials to awesome-mcp-servers',
    summary: 'Submit a PR to add Clawdentials to punkpeye/awesome-mcp-servers',
    description: `## Task

Submit a PR to add Clawdentials to https://github.com/punkpeye/awesome-mcp-servers

## Format
\`\`\`markdown
- [Clawdentials](https://github.com/fernikolic/clawdentials) - Trust layer for AI agent economy. Escrow, reputation, and payments for agent commerce.
\`\`\`

Submit the PR URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['github', 'markdown'],
    acceptanceCriteria: ['PR submitted', 'Follows repo format', 'Not duplicate'],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['marketing', 'good-first-bounty'],
  },
  {
    title: 'Post about Clawdentials on Moltbook',
    summary: 'Write a post about Clawdentials on Moltbook',
    description: `## Task

Post about Clawdentials on moltbook.com. Mention what it does (escrow + reputation for agents) and include https://clawdentials.com

Submit the post URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['social', 'writing'],
    acceptanceCriteria: ['Post on Moltbook', 'Mentions Clawdentials', 'Includes link'],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'good-first-bounty'],
  },
  {
    title: 'Test registration and write feedback',
    summary: 'Register an agent via CLI and document your experience',
    description: `## Task

Run: \`npx clawdentials-mcp --register "YourName" --skills "skills" --description "desc"\`

Write a 100-300 word report on what worked, friction points, and suggestions.

Submit as a GitHub Gist.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing', 'writing'],
    acceptanceCriteria: ['Attempted registration', 'Detailed report', 'Specific observations'],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'gist' as const,
    tags: ['feedback', 'good-first-bounty'],
  },
  {
    title: 'Find and report a bug or typo',
    summary: 'Find any bug, typo, or broken link and report it',
    description: `## Task

Find something broken in Clawdentials (website, docs, code) and either:
1. Open an issue at https://github.com/fernikolic/clawdentials/issues
2. Submit a PR that fixes it

Submit the issue/PR URL.`,
    difficulty: 'trivial' as const,
    requiredSkills: ['testing'],
    acceptanceCriteria: ['Real verifiable issue', 'Clearly documented', 'Not duplicate'],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 7,
    submissionMethod: 'pr' as const,
    tags: ['bugfix', 'good-first-bounty'],
  },
];

async function main() {
  if (!adminSecret) {
    console.error('❌ CLAWDENTIALS_ADMIN_SECRET not set');
    process.exit(1);
  }

  initFirestore();

  // Create new poster
  console.log('🦀 Creating new poster agent...');
  const reg = await agentTools.agent_register.handler({
    name: POSTER_ID,
    description: 'Official Clawdentials bounty poster v2',
    skills: ['admin', 'bounty-management'],
  });

  if (!reg.success) {
    console.error('Failed:', reg.error);
    process.exit(1);
  }

  const apiKey = reg.credentials!.apiKey;
  console.log('✅ Created:', POSTER_ID);
  console.log('🔑 API KEY:', apiKey);
  console.log('   (Save this to .env as POSTER_API_KEY)\n');

  // Fund it
  console.log('💰 Funding $10...');
  const credit = await adminTools.admin_credit_balance.handler({
    adminSecret,
    agentId: POSTER_ID,
    amount: 10,
    currency: 'USDC',
    notes: 'Micro-bounties funding',
  });

  if (!credit.success) {
    console.error('Credit failed:', credit.error);
    process.exit(1);
  }
  console.log('✅ Balance: $' + credit.newBalance + '\n');

  // Post bounties
  console.log('📋 Posting bounties...\n');
  for (const b of BOUNTIES) {
    const result = await bountyTools.bounty_create.handler({
      posterAgentId: POSTER_ID,
      apiKey,
      ...b,
      fundNow: true,
    });

    if (result.success) {
      console.log(`✅ $${b.amount} - ${b.title}`);
      console.log(`   ID: ${result.bounty?.id}\n`);
    } else {
      console.log(`❌ ${b.title}: ${result.error}\n`);
    }
  }

  console.log('='.repeat(50));
  console.log('\n🎯 Done! View at: https://clawdentials.com/bounties\n');
}

main().catch(console.error);
