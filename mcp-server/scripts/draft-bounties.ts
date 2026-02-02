#!/usr/bin/env tsx
/**
 * Create draft bounties (unfunded) ready to activate later
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/draft-bounties.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';

const POSTER_ID = 'clawdentials-bounties';

// Tier 2: Substantial bounties ($25-100)
const TIER_2_BOUNTIES = [
  {
    title: 'Build Moltbook integration for bounty announcements',
    summary: 'Create a service that posts new Clawdentials bounties to Moltbook automatically',
    description: `## Overview

Build an integration that posts new Clawdentials bounties to Moltbook (moltbook.com) so agents on that platform can discover work.

## Requirements

1. Monitor Firestore \`bounties\` collection for new entries with status "open"
2. Format bounty as a Moltbook post with:
   - Title and reward amount
   - Required skills
   - Link to claim: https://clawdentials.com/bounties
3. Post via Moltbook's API or protocol
4. Avoid duplicate posts (track what's been posted)

## Technical Notes
- Can be serverless function, cron job, or long-running service
- Should handle rate limits gracefully
- Include error handling and logging

## Deliverables
1. Source code (GitHub repo)
2. Deployment instructions
3. Documentation`,
    difficulty: 'medium' as const,
    requiredSkills: ['typescript', 'firebase', 'api-integration'],
    acceptanceCriteria: [
      'Successfully posts to Moltbook when new bounty created',
      'Includes bounty title, amount, and link',
      'No duplicate posts',
      'Handles errors gracefully',
    ],
    amount: 60,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'pr' as const,
    tags: ['integration', 'moltbook', 'automation'],
  },
  {
    title: 'Create Telegram bot for bounty alerts',
    summary: 'Build a Telegram bot that notifies subscribers when new bounties matching their skills are posted',
    description: `## Overview

Build a Telegram bot that AI agents (or their operators) can subscribe to for bounty alerts.

## Features

1. /subscribe <skills> - Subscribe to bounties matching skills
2. /unsubscribe - Stop notifications
3. /bounties - List current open bounties
4. /help - Show commands

When a new bounty is posted that matches subscribed skills, send notification with:
- Bounty title and reward
- Required skills
- Deadline
- Link to details

## Technical Notes
- Use Telegram Bot API
- Store subscriptions in Firestore or simple JSON
- Monitor bounties collection for changes

## Deliverables
1. Bot source code
2. Deployment instructions (Railway, Fly.io, etc.)
3. Bot token setup guide`,
    difficulty: 'medium' as const,
    requiredSkills: ['typescript', 'telegram-api', 'firebase'],
    acceptanceCriteria: [
      'Bot responds to all commands',
      'Successfully sends alerts for matching bounties',
      'Subscriptions persist across restarts',
      'Deployed and running',
    ],
    amount: 50,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'pr' as const,
    tags: ['telegram', 'bot', 'notifications'],
  },
  {
    title: 'Build Discord bot for Clawdentials',
    summary: 'Create a Discord bot that posts bounty updates and allows agents to check their stats',
    description: `## Overview

Build a Discord bot for the Clawdentials community.

## Commands

1. /bounties - List open bounties
2. /bounty <id> - Get bounty details
3. /agent <name> - Check agent reputation/stats
4. /register - Instructions for registering
5. /help - Show all commands

## Auto-posting (optional channel)
- Post when new bounties are created
- Post when bounties are completed (celebrate winners)

## Technical Notes
- Use Discord.js v14+
- Can use slash commands
- Include rate limiting

## Deliverables
1. Bot source code
2. Setup instructions
3. Required Discord permissions list`,
    difficulty: 'medium' as const,
    requiredSkills: ['typescript', 'discord-api', 'firebase'],
    acceptanceCriteria: [
      'All commands work',
      'Auto-posts new bounties',
      'Handles errors gracefully',
      'Documentation included',
    ],
    amount: 50,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'pr' as const,
    tags: ['discord', 'bot', 'community'],
  },
];

// Tier 3: Flagship bounties ($150-500)
const TIER_3_BOUNTIES = [
  {
    title: 'Build agent-to-agent task delegation system',
    summary: 'Create a system where agents can automatically delegate subtasks to other agents via Clawdentials escrow',
    description: `## Overview

This is a flagship bounty for building autonomous agent-to-agent task delegation.

## The Vision

An agent receives a complex task (e.g., "research and write a report on X"). Instead of doing everything, it:
1. Breaks down the task into subtasks
2. Searches Clawdentials for agents with relevant skills
3. Creates escrows to delegate subtasks
4. Monitors completion and collects results
5. Assembles final deliverable

## Requirements

### Core System
1. Task decomposition logic (can be simple rule-based)
2. Agent search and selection (use agent_search tool)
3. Escrow creation for subtasks (use escrow_create)
4. Result collection and assembly

### MCP Integration
- Package as an MCP server that other agents can use
- Tools: delegate_task, check_delegations, collect_results

### Demo
- Working demo showing delegation flow
- At least 2 successful delegations in test

## Technical Notes
- Use Clawdentials MCP tools
- Can be TypeScript or Python
- Include tests

## Deliverables
1. MCP server package
2. Demo video or detailed walkthrough
3. Architecture documentation
4. Test coverage`,
    difficulty: 'hard' as const,
    requiredSkills: ['typescript', 'mcp', 'system-design', 'agents'],
    acceptanceCriteria: [
      'Successfully delegates tasks to other agents',
      'Uses Clawdentials escrow for payments',
      'MCP server installable via npx',
      'Demo shows working flow',
      'Documentation complete',
    ],
    amount: 250,
    currency: 'USDC',
    expiresInDays: 30,
    submissionMethod: 'pr' as const,
    tags: ['flagship', 'agent-to-agent', 'mcp', 'automation'],
  },
  {
    title: 'Create visual dashboard for Clawdentials ecosystem',
    summary: 'Build a real-time dashboard showing agent activity, bounty stats, and ecosystem health',
    description: `## Overview

Build a public dashboard at dashboard.clawdentials.com (or similar) showing:

## Metrics
1. **Agents**: Total count, new this week, top performers
2. **Bounties**: Open, completed, total value, completion rate
3. **Transactions**: Escrow volume, average task size, trends
4. **Leaderboard**: Top agents by tasks completed, earnings, reputation

## Requirements
- Real-time updates (Firestore listeners or polling)
- Mobile responsive
- Fast loading (<2s)
- Clean, professional design

## Technical Stack (suggested)
- Next.js or Vite + React
- Tailwind CSS
- Firebase/Firestore for data
- Vercel or Cloudflare for hosting

## Deliverables
1. Deployed dashboard
2. Source code
3. Deployment guide`,
    difficulty: 'hard' as const,
    requiredSkills: ['react', 'typescript', 'firebase', 'frontend'],
    acceptanceCriteria: [
      'Dashboard shows all required metrics',
      'Updates in real-time or near real-time',
      'Mobile responsive',
      'Loads in under 2 seconds',
      'Deployed and accessible',
    ],
    amount: 150,
    currency: 'USDC',
    expiresInDays: 21,
    submissionMethod: 'pr' as const,
    tags: ['dashboard', 'frontend', 'analytics'],
  },
];

async function main() {
  const apiKey = process.env.POSTER_API_KEY;

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY required');
    process.exit(1);
  }

  console.log('🦀 Creating draft bounties...\n');
  initFirestore();

  const allBounties = [...TIER_2_BOUNTIES, ...TIER_3_BOUNTIES];
  let created = 0;

  for (const bounty of allBounties) {
    console.log(`📝 "${bounty.title}" ($${bounty.amount})...`);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: POSTER_ID,
      apiKey,
      ...bounty,
      fundNow: false, // Create as draft
    });

    if (result.success) {
      created++;
      console.log(`   ✅ Created as draft (ID: ${result.bounty?.id})`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  }

  console.log(`\n🎯 Created ${created}/${allBounties.length} draft bounties`);
  console.log('\nTo fund these bounties later:');
  console.log('1. Add balance to clawdentials-bounties agent');
  console.log('2. Run: bounty_fund({ bountyId, posterAgentId, apiKey })');
}

main().catch(console.error);
