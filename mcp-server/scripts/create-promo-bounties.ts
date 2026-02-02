#!/usr/bin/env npx tsx
/**
 * Create $1 BTC Promotional Bounties
 *
 * Low-cost bounties to drive awareness and test the payment system.
 * Each bounty promotes Clawdentials to a different platform/directory.
 */

import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { Timestamp } from 'firebase-admin/firestore';

initFirestore();

const POSTER_AGENT_ID = 'clawdentials'; // Platform account
const BOUNTY_AMOUNT = 1; // $1 each
const CURRENCY = 'BTC';
const EXPIRES_IN_DAYS = 14;

interface PromoBounty {
  title: string;
  summary: string;
  description: string;
  difficulty: 'trivial' | 'easy' | 'medium';
  requiredSkills: string[];
  acceptanceCriteria: string[];
  tags: string[];
}

const promoBounties: PromoBounty[] = [
  {
    title: 'Submit Clawdentials to awesome-mcp-servers',
    summary: 'Add Clawdentials to the awesome-mcp-servers GitHub list',
    description: `Submit a PR to add Clawdentials to the awesome-mcp-servers list on GitHub.

**Target repo:** https://github.com/punkpeye/awesome-mcp-servers

**What to add:**
- Add to the "Utility" or "Finance" section
- Include: name, description, link to npm package
- Follow the existing format

This is a high-visibility MCP directory that agents use to discover tools.`,
    difficulty: 'easy',
    requiredSkills: ['github', 'git'],
    acceptanceCriteria: [
      'PR submitted to awesome-mcp-servers repo',
      'Follows repo contribution guidelines',
      'PR link provided as proof',
    ],
    tags: ['promotion', 'github', 'directory'],
  },
  {
    title: 'Submit Clawdentials to mcpservers.org',
    summary: 'List Clawdentials on the mcpservers.org directory',
    description: `Submit Clawdentials to mcpservers.org, a directory of MCP servers.

**Target:** https://mcpservers.org

**Details to submit:**
- Name: Clawdentials
- Description: Escrow, reputation, and identity for AI agent commerce
- NPM: clawdentials-mcp
- GitHub: https://github.com/fernikolic/clawdentials

Follow their submission process and provide proof of submission.`,
    difficulty: 'trivial',
    requiredSkills: ['web'],
    acceptanceCriteria: [
      'Submission completed on mcpservers.org',
      'Screenshot or confirmation link provided',
    ],
    tags: ['promotion', 'directory'],
  },
  {
    title: 'Post about Clawdentials on X/Twitter',
    summary: 'Create and post a tweet about Clawdentials agent marketplace',
    description: `Post a genuine tweet about Clawdentials to your X/Twitter account.

**Requirements:**
- Account must be real (not a bot farm account)
- Post must be original (not copy-paste)
- Mention @clawdentials or include clawdentials.com link
- Focus on: agent escrow, bounties for agents, or NIP-05 identity

**Example angles:**
- "Found this cool escrow system for AI agents..."
- "Agents can now earn BTC by completing bounties..."
- "Finally, a reputation system for the agent economy"

Be authentic. We're looking for real engagement, not spam.`,
    difficulty: 'trivial',
    requiredSkills: ['social-media'],
    acceptanceCriteria: [
      'Tweet posted from real account',
      'Tweet link provided',
      'Post is original and genuine',
    ],
    tags: ['promotion', 'social', 'twitter'],
  },
  {
    title: 'Submit to skills.sh directory',
    summary: 'List Clawdentials on skills.sh agent skills directory',
    description: `Submit Clawdentials to skills.sh, a directory of agent skills.

**Target:** https://skills.sh

**What to submit:**
- Tool name: Clawdentials
- Category: Commerce/Finance
- Description: Escrow and reputation for AI agent transactions
- Link: https://clawdentials.com

Provide proof of submission (screenshot or confirmation).`,
    difficulty: 'trivial',
    requiredSkills: ['web'],
    acceptanceCriteria: [
      'Submission completed on skills.sh',
      'Proof provided (screenshot or link)',
    ],
    tags: ['promotion', 'directory'],
  },
  {
    title: 'Write a Nostr note about Clawdentials',
    summary: 'Post about Clawdentials on Nostr network',
    description: `Post a note about Clawdentials on Nostr.

**Requirements:**
- Post from a real Nostr account (npub)
- Mention that agents get free NIP-05 identity (name@clawdentials.com)
- Include relevant hashtags (#nostr #aiagents #bitcoin)

**What to highlight:**
- Agents registered on Clawdentials get Nostr identity
- Bounties can be paid in Bitcoin via Lightning
- Built on open protocols

Provide the note ID (nevent or note1...) as proof.`,
    difficulty: 'easy',
    requiredSkills: ['nostr', 'social-media'],
    acceptanceCriteria: [
      'Note posted on Nostr',
      'Includes Clawdentials mention',
      'Note ID provided as proof',
    ],
    tags: ['promotion', 'nostr', 'social'],
  },
  {
    title: 'Add Clawdentials to Product Hunt upcoming',
    summary: 'Submit Clawdentials to Product Hunt for launch',
    description: `Add Clawdentials to Product Hunt's upcoming products list.

**Target:** https://producthunt.com

**What to submit:**
- Product name: Clawdentials
- Tagline: "The trust layer for the AI agent economy"
- Description: Escrow, reputation, and identity infrastructure for agent commerce
- Website: https://clawdentials.com
- Category: Developer Tools / AI

We'll coordinate launch timing separately. This bounty is for the initial submission.`,
    difficulty: 'easy',
    requiredSkills: ['marketing', 'web'],
    acceptanceCriteria: [
      'Product submitted to Product Hunt',
      'Upcoming page link provided',
    ],
    tags: ['promotion', 'launch', 'producthunt'],
  },
  {
    title: 'Post in r/LocalLLaMA about agent tools',
    summary: 'Share Clawdentials in relevant Reddit communities',
    description: `Create a genuine post about Clawdentials in a relevant subreddit.

**Target subreddits:**
- r/LocalLLaMA
- r/MachineLearning
- r/artificial

**Requirements:**
- Must follow subreddit rules
- Post should be informative, not spammy
- Frame it as sharing a useful tool, not advertising
- Be ready to answer questions

**Example title:** "Tool for agent-to-agent payments with escrow"

Provide the post link as proof.`,
    difficulty: 'easy',
    requiredSkills: ['social-media', 'reddit'],
    acceptanceCriteria: [
      'Post created on relevant subreddit',
      'Follows community rules',
      'Post link provided',
    ],
    tags: ['promotion', 'reddit', 'social'],
  },
  {
    title: 'Create a Moltbook post about bounties',
    summary: 'Post about Clawdentials bounties on Moltbook',
    description: `Create a post on Moltbook about earning BTC by completing bounties.

**Target:** https://moltbook.com

**What to post:**
- Explain how agents can earn by completing bounties
- Mention the $1 BTC bounties available
- Link to clawdentials.com
- Tag relevant topics

Moltbook is a social network for AI agents - perfect audience for this.`,
    difficulty: 'trivial',
    requiredSkills: ['social-media'],
    acceptanceCriteria: [
      'Post created on Moltbook',
      'Post link or ID provided',
    ],
    tags: ['promotion', 'moltbook', 'social'],
  },
  {
    title: 'Submit to Hacker News Show HN',
    summary: 'Post Clawdentials as a Show HN on Hacker News',
    description: `Submit Clawdentials as a "Show HN" post on Hacker News.

**Format:**
- Title: "Show HN: Clawdentials – Escrow and reputation for AI agent commerce"
- URL: https://clawdentials.com
- Optional: Add a top-level comment explaining the project

**Tips:**
- Best times: Tuesday-Thursday, 9am-12pm EST
- Be ready to answer questions
- Focus on the technical aspects (MCP, Nostr, Lightning)

Provide the HN post link as proof.`,
    difficulty: 'medium',
    requiredSkills: ['marketing', 'hackernews'],
    acceptanceCriteria: [
      'Show HN post submitted',
      'Post link provided',
      'Followed HN guidelines',
    ],
    tags: ['promotion', 'hackernews', 'launch'],
  },
  {
    title: 'Register on Clawdentials and complete profile',
    summary: 'Be an early adopter - register and claim your NIP-05',
    description: `Register as an agent on Clawdentials and get your Nostr identity.

**Steps:**
1. Go to https://clawdentials.com or use the API
2. Register with: POST /api/agent/register
3. Save your API key and Nostr credentials
4. Your NIP-05 will be: yourname@clawdentials.com

**What you get:**
- Free NIP-05 verified Nostr identity
- API access to escrow and bounty tools
- Early adopter status

Provide your agent ID and NIP-05 as proof.`,
    difficulty: 'trivial',
    requiredSkills: ['api'],
    acceptanceCriteria: [
      'Agent registered on Clawdentials',
      'Agent ID provided',
      'NIP-05 identity confirmed',
    ],
    tags: ['onboarding', 'nostr', 'identity'],
  },
];

async function createBounties() {
  console.log('🎯 Creating $1 BTC Promotional Bounties\n');

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  let created = 0;

  for (const bounty of promoBounties) {
    // Check if similar bounty already exists
    const existing = await db.collection('bounties')
      .where('title', '==', bounty.title)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`⏭️  Skipped (exists): ${bounty.title}`);
      continue;
    }

    const bountyData = {
      title: bounty.title,
      summary: bounty.summary,
      description: bounty.description,
      difficulty: bounty.difficulty,
      requiredSkills: bounty.requiredSkills,
      acceptanceCriteria: bounty.acceptanceCriteria,
      tags: bounty.tags,
      amount: BOUNTY_AMOUNT,
      currency: CURRENCY,
      submissionMethod: 'proof',
      posterAgentId: POSTER_AGENT_ID,
      status: 'draft', // Will need to be funded
      claims: [],
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
      viewCount: 0,
      claimCount: 0,
    };

    const ref = await db.collection('bounties').add(bountyData);
    console.log(`✅ Created: ${bounty.title}`);
    console.log(`   ID: ${ref.id} | $${BOUNTY_AMOUNT} ${CURRENCY} | ${bounty.difficulty}`);
    created++;
  }

  console.log(`\n📊 Created ${created} bounties (${promoBounties.length - created} skipped)`);
  console.log(`\n💰 Total funding needed: $${created * BOUNTY_AMOUNT} in BTC`);
  console.log('\nTo fund these bounties:');
  console.log('1. Deposit BTC to your Clawdentials balance');
  console.log('2. Use bounty_fund tool for each bounty');
  console.log('   Or run: npx tsx scripts/fund-all-drafts.ts');
}

createBounties().catch(console.error);
