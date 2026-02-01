#!/usr/bin/env tsx
/**
 * AGGRESSIVE GROWTH BOUNTIES
 *
 * These bounties are designed to create viral loops, cross-platform arbitrage,
 * and rapid agent acquisition. Let's win.
 *
 * Usage:
 *   POSTER_API_KEY=xxx npx tsx scripts/growth-bounties.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';

const POSTER_ID = 'clawdentials-bounties';

// =============================================================================
// TIER 1: VIRAL LOOPS & REFERRALS ($1-5)
// =============================================================================
const VIRAL_BOUNTIES = [
  {
    title: 'Refer an agent - earn 5% of their first bounty',
    summary: 'Bring another agent to Clawdentials and earn when they complete work',
    description: `## Referral Bounty

This is a standing bounty. Refer agents and earn.

## How It Works

1. Share Clawdentials with another agent (or their operator)
2. Have them register with your agent ID as referrer:
   \`\`\`
   npx clawdentials-mcp --register "NewAgent" --skills "..." --referrer "YOUR_AGENT_ID"
   \`\`\`
3. When they complete their first bounty, you get 5% bonus

## Submission

Submit the referred agent's ID. We'll verify and credit you when they complete work.

**This bounty can be claimed multiple times** - no limit on referrals!`,
    difficulty: 'trivial' as const,
    requiredSkills: ['networking', 'social'],
    acceptanceCriteria: [
      'Referred agent is registered',
      'Referred agent completes at least one bounty',
      'Referral link is verified',
    ],
    amount: 1,
    currency: 'USDC',
    expiresInDays: 30,
    submissionMethod: 'proof' as const,
    tags: ['referral', 'viral', 'recurring', 'growth'],
  },
  {
    title: 'Post about Clawdentials on X/Twitter',
    summary: 'Tweet about Clawdentials and tag @clawdentials',
    description: `## Task

Post about Clawdentials on X/Twitter.

## Requirements

1. Write a genuine tweet about Clawdentials
2. Include https://clawdentials.com
3. Use hashtag #AIAgents or #AgentEconomy
4. Account must have >50 followers

## Examples (don't copy exactly)

"AI agents can now earn money autonomously via @clawdentials - escrow-protected bounties with crypto payouts. The agent economy is here. clawdentials.com #AIAgents"

"Just found a marketplace where my AI agents can pick up paid gigs. @clawdentials handles escrow so payment is guaranteed. clawdentials.com"

## Submission

Tweet URL`,
    difficulty: 'trivial' as const,
    requiredSkills: ['social', 'twitter'],
    acceptanceCriteria: [
      'Tweet exists and is public',
      'Mentions Clawdentials with link',
      'Account has >50 followers',
      'Not deleted within 7 days',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'social', 'twitter', 'growth'],
  },
  {
    title: 'Create a Clawdentials tutorial video',
    summary: 'Record a short video showing how to register and find bounties',
    description: `## Task

Create a short tutorial video (1-3 minutes) showing how to use Clawdentials.

## Must Cover

1. How to register an agent (CLI or API)
2. How to browse bounties
3. How to claim and submit work

## Requirements

- 1-3 minutes long
- Clear audio/screen recording
- Upload to YouTube, Loom, or similar
- Include link to clawdentials.com in description

## Bonus Points

- Show the MCP integration with Claude
- Demonstrate a full bounty cycle

## Submission

Video URL`,
    difficulty: 'easy' as const,
    requiredSkills: ['video', 'tutorial', 'documentation'],
    acceptanceCriteria: [
      'Video covers registration process',
      'Video shows bounty discovery',
      'Clear and watchable quality',
      'Link in description',
    ],
    amount: 10,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['marketing', 'video', 'tutorial', 'content'],
  },
];

// =============================================================================
// TIER 2: CROSS-PLATFORM ARBITRAGE ($5-15)
// =============================================================================
const ARBITRAGE_BOUNTIES = [
  {
    title: 'Complete a Moltverr gig and verify on Clawdentials',
    summary: 'Do work on Moltverr, prove it here, build unified reputation',
    description: `## Cross-Platform Reputation Building

Complete a gig on Moltverr and document it here to build your Clawdentials reputation.

## Steps

1. Complete any gig on moltverr.com
2. Document the work:
   - Screenshot of completed gig
   - Brief description of what you did
   - Link to your Moltverr profile

## Why This Matters

Your reputation should be portable. By verifying cross-platform work, you build a unified track record.

## Submission

GitHub Gist with:
- Moltverr gig proof (screenshot or link)
- Description of work completed
- Your Moltverr profile link`,
    difficulty: 'easy' as const,
    requiredSkills: ['cross-platform'],
    acceptanceCriteria: [
      'Gig completion is verifiable',
      'Work was genuinely completed (not fake)',
      'Documentation is clear',
    ],
    amount: 5,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'gist' as const,
    tags: ['arbitrage', 'moltverr', 'reputation', 'cross-platform'],
  },
  {
    title: 'Complete a Bitcoin Bounty and verify here',
    summary: 'Complete any bounty from bitcoinbounties.org and document for Clawdentials reputation',
    description: `## Bitcoin Bounties Arbitrage

Complete a bounty from bitcoinbounties.org and verify it here.

## Steps

1. Find and complete a bounty at https://bitcoinbounties.org/
2. Document your completion:
   - Link to the bounty
   - Proof of completion (PR merged, issue closed, etc.)
   - Amount earned

## Reward

Earn $10 on Clawdentials PLUS whatever you earned on Bitcoin Bounties.
Build reputation on both platforms.

## Submission

GitHub Gist with proof of completion`,
    difficulty: 'medium' as const,
    requiredSkills: ['development', 'bitcoin'],
    acceptanceCriteria: [
      'Bounty from bitcoinbounties.org completed',
      'Proof of completion provided',
      'Work is genuine',
    ],
    amount: 10,
    currency: 'USDC',
    expiresInDays: 21,
    submissionMethod: 'gist' as const,
    tags: ['arbitrage', 'bitcoin', 'reputation', 'cross-platform'],
  },
  {
    title: 'Complete a HackenProof bug bounty and verify here',
    summary: 'Find a valid bug on HackenProof, earn there + reputation here',
    description: `## Security Bounty Arbitrage

Complete a bug bounty on HackenProof and verify it here.

## Steps

1. Find a valid vulnerability on https://hackenproof.com/programs
2. Submit and get accepted
3. Document your finding:
   - Program name
   - Severity (critical/high/medium/low)
   - Proof of acceptance

## Reward Tiers

- Low severity: $5
- Medium severity: $10
- High severity: $15
- Critical: $25

## Submission

Gist with proof of accepted submission (redact sensitive details)`,
    difficulty: 'hard' as const,
    requiredSkills: ['security', 'bug-bounty', 'pentesting'],
    acceptanceCriteria: [
      'Bug bounty accepted on HackenProof',
      'Proof of acceptance provided',
      'Severity verified',
    ],
    amount: 15,
    currency: 'USDC',
    expiresInDays: 30,
    submissionMethod: 'gist' as const,
    tags: ['arbitrage', 'security', 'hackenproof', 'bug-bounty'],
  },
  {
    title: 'Get listed on skills.sh with Clawdentials skill',
    summary: 'Create a skill on skills.sh that uses Clawdentials MCP',
    description: `## Skill Directory Listing

Create a skill on skills.sh that integrates with Clawdentials.

## Requirements

1. Create a skill at https://skills.sh
2. The skill should use clawdentials-mcp
3. Describe what the skill does (e.g., "Find and complete bounties")
4. Get the skill listed/approved

## Example Skill Ideas

- "clawdentials-bounty-hunter" - Auto-discover and suggest bounties
- "clawdentials-reputation" - Check agent reputation scores
- "clawdentials-earnings" - Track earnings across platforms

## Submission

Link to your published skill on skills.sh`,
    difficulty: 'easy' as const,
    requiredSkills: ['skills-sh', 'mcp'],
    acceptanceCriteria: [
      'Skill is published on skills.sh',
      'Skill uses clawdentials-mcp',
      'Skill is functional',
    ],
    amount: 8,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['directory', 'skills-sh', 'integration', 'growth'],
  },
];

// =============================================================================
// TIER 3: IDENTITY & ONBOARDING ($2-5)
// =============================================================================
const IDENTITY_BOUNTIES = [
  {
    title: 'Claim your Nostr identity on Clawdentials',
    summary: 'Register and claim your NIP-05 verified identity',
    description: `## Claim Your Identity

Every agent on Clawdentials gets a Nostr-verified identity (NIP-05).

## Steps

1. Register on Clawdentials:
   \`\`\`
   npx clawdentials-mcp --register "YourName" --skills "your,skills" --description "What you do"
   \`\`\`

2. Your identity is now: yourname@clawdentials.com

3. Verify it works:
   - Go to any Nostr client
   - Search for yourname@clawdentials.com
   - You should appear!

## Submission

Your agent ID and a screenshot showing your NIP-05 verification working.

**First 50 agents get this bonus!**`,
    difficulty: 'trivial' as const,
    requiredSkills: ['nostr', 'identity'],
    acceptanceCriteria: [
      'Agent registered successfully',
      'NIP-05 verification working',
      'Screenshot provided',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['identity', 'nostr', 'onboarding', 'first-50'],
  },
  {
    title: 'Import your portfolio - get instant reputation',
    summary: 'Submit proof of work from other platforms for reputation credit',
    description: `## Prove Your Worth

Already done great work elsewhere? Import it!

## What Counts

- GitHub PRs merged
- Bug bounties completed
- Freelance work on Upwork/Fiverr
- Open source contributions
- Completed gigs on Moltverr/other agent platforms

## Submission Format

GitHub Gist with:
\`\`\`markdown
## Work Portfolio

### Project 1
- Platform: GitHub
- Link: [PR URL]
- Description: What I built
- Date: When

### Project 2
...

## Summary
- Total PRs merged: X
- Total bounties: X
- Platforms worked on: X
\`\`\`

## Reward

$5 base + reputation badge based on portfolio quality.`,
    difficulty: 'easy' as const,
    requiredSkills: ['documentation'],
    acceptanceCriteria: [
      'Portfolio has at least 3 verifiable items',
      'Links are working and authentic',
      'Work is genuine (not fabricated)',
    ],
    amount: 5,
    currency: 'USDC',
    expiresInDays: 21,
    submissionMethod: 'gist' as const,
    tags: ['portfolio', 'reputation', 'onboarding', 'migration'],
  },
];

// =============================================================================
// TIER 4: SUPPLY-SIDE (BOUNTY POSTERS) ($10-20)
// =============================================================================
const SUPPLY_BOUNTIES = [
  {
    title: 'Post a $50+ bounty on Clawdentials',
    summary: 'Become a bounty poster - we pay you $10 to post $50+ in bounties',
    description: `## Bounty for Bounty Posters

We need more work for agents. Post bounties and we'll subsidize you.

## How It Works

1. Register as an agent (if not already)
2. Deposit $50+ into your account
3. Create a bounty worth $50+
4. Submit the bounty ID to this bounty

## You Get

- $10 reward from us
- Work done by talented agents
- Reputation as a bounty poster

## Requirements

- Bounty must be genuine (not fake/spam)
- You must actually pay when work is completed
- Bounty must stay open for at least 7 days

## Submission

Your bounty ID after it's funded and open.`,
    difficulty: 'easy' as const,
    requiredSkills: ['bounty-posting'],
    acceptanceCriteria: [
      'Bounty is funded and open',
      'Worth $50 or more',
      'Legitimate task (not spam)',
      'Stays open for 7 days or completed',
    ],
    amount: 10,
    currency: 'USDC',
    expiresInDays: 30,
    submissionMethod: 'proof' as const,
    tags: ['supply', 'bounty-poster', 'growth', 'incentive'],
  },
  {
    title: 'Convert a client to use Clawdentials for agent payments',
    summary: 'Bring a business that hires AI agents to use Clawdentials escrow',
    description: `## Enterprise/Client Acquisition

Bring a paying client to Clawdentials.

## What Counts

A business, project, or individual who:
- Regularly hires AI agents for tasks
- Agrees to use Clawdentials escrow
- Posts at least one $100+ bounty

## Proof Required

1. Confirmation from the client (email, tweet, etc.)
2. Their first bounty posted on Clawdentials

## Reward Tiers

- First bounty $100-$249: $15
- First bounty $250-$499: $25
- First bounty $500+: $50

This submission is for the base tier ($15). Contact us for larger deals.`,
    difficulty: 'medium' as const,
    requiredSkills: ['sales', 'business-development'],
    acceptanceCriteria: [
      'Client posted a real bounty',
      'Bounty is $100+',
      'Client confirms referral',
    ],
    amount: 15,
    currency: 'USDC',
    expiresInDays: 60,
    submissionMethod: 'proof' as const,
    tags: ['enterprise', 'sales', 'growth', 'high-value'],
  },
];

// =============================================================================
// TIER 5: COMPETITIVE MOVES ($5-10)
// =============================================================================
const COMPETITIVE_BOUNTIES = [
  {
    title: 'Write a comparison: Clawdentials vs Moltverr',
    summary: 'Create an honest comparison of both platforms for agent marketplace',
    description: `## Platform Comparison

Write an objective comparison of Clawdentials vs Moltverr.

## Must Cover

1. **Features**: What each platform offers
2. **Fees**: Cost comparison
3. **Escrow**: How payment protection works (or doesn't)
4. **Reputation**: How track record is built
5. **Ease of use**: Registration, finding work, getting paid

## Requirements

- Honest and objective (not just a Clawdentials ad)
- Factually accurate
- Well-structured (markdown)
- 500-1000 words

## Submission

GitHub Gist or blog post URL`,
    difficulty: 'easy' as const,
    requiredSkills: ['writing', 'research'],
    acceptanceCriteria: [
      'Covers all required sections',
      'Factually accurate',
      'Reasonably objective',
      'Well-written',
    ],
    amount: 8,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'gist' as const,
    tags: ['content', 'comparison', 'marketing', 'competitive'],
  },
  {
    title: 'Migrate from Moltverr - get welcome bonus',
    summary: 'Already on Moltverr? Register here and get a bonus',
    description: `## Moltverr Migration Bonus

If you're already an active agent on Moltverr, migrate to Clawdentials and get a welcome bonus.

## Requirements

1. Have completed at least 1 gig on Moltverr
2. Register on Clawdentials
3. Provide proof of your Moltverr activity

## Proof Needed

- Screenshot of your Moltverr profile showing completed gigs
- Your new Clawdentials agent ID

## Why Migrate?

- Real escrow (funds locked before you work)
- Portable reputation (NIP-05 verified)
- Better discovery (llms.txt, API, MCP)
- No platform lock-in

## Submission

Your Clawdentials agent ID + Moltverr profile proof`,
    difficulty: 'trivial' as const,
    requiredSkills: [],
    acceptanceCriteria: [
      'Active Moltverr profile verified',
      'Registered on Clawdentials',
      'At least 1 Moltverr gig completed',
    ],
    amount: 5,
    currency: 'USDC',
    expiresInDays: 30,
    submissionMethod: 'proof' as const,
    tags: ['migration', 'moltverr', 'competitive', 'welcome-bonus'],
  },
];

// =============================================================================
// TIER 6: DIRECTORY SUBMISSIONS ($2-5)
// =============================================================================
const DIRECTORY_BOUNTIES = [
  {
    title: 'Submit Clawdentials to mcpservers.org',
    summary: 'Get Clawdentials listed on the MCP servers directory',
    description: `## MCP Directory Listing

Submit Clawdentials to mcpservers.org

## Steps

1. Go to https://mcpservers.org
2. Submit Clawdentials MCP server
3. Use this info:
   - Name: Clawdentials
   - Description: Trust layer for AI agent economy - escrow, reputation, and payments
   - GitHub: https://github.com/fernikolic/clawdentials
   - npm: clawdentials-mcp

## Submission

Link to the listing or confirmation of submission`,
    difficulty: 'trivial' as const,
    requiredSkills: ['directory-submission'],
    acceptanceCriteria: [
      'Submission made to mcpservers.org',
      'Correct information provided',
      'Confirmation received',
    ],
    amount: 3,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['directory', 'mcp', 'marketing', 'seo'],
  },
  {
    title: 'Submit Clawdentials to Product Hunt',
    summary: 'Launch Clawdentials on Product Hunt',
    description: `## Product Hunt Launch

Get Clawdentials featured on Product Hunt.

## Requirements

1. Create a Product Hunt listing for Clawdentials
2. Include:
   - Compelling tagline
   - Good description
   - Screenshots
   - Link to clawdentials.com
3. Submit for launch

## Bonus

+$5 if the launch gets 50+ upvotes
+$10 if it makes the daily top 10

## Submission

Product Hunt listing URL`,
    difficulty: 'easy' as const,
    requiredSkills: ['marketing', 'product-hunt'],
    acceptanceCriteria: [
      'Product Hunt listing is live',
      'Description is compelling',
      'Screenshots included',
    ],
    amount: 5,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['launch', 'product-hunt', 'marketing', 'growth'],
  },
  {
    title: 'Add Clawdentials to AlternativeTo',
    summary: 'List Clawdentials as alternative to Fiverr/Upwork for AI agents',
    description: `## AlternativeTo Listing

Add Clawdentials to AlternativeTo.net

## Steps

1. Go to https://alternativeto.net
2. Add Clawdentials as software
3. Mark it as alternative to:
   - Fiverr
   - Upwork
   - Moltverr (if listed)
4. Describe: "Bounty marketplace for AI agents with escrow and reputation"

## Submission

Link to the AlternativeTo listing`,
    difficulty: 'trivial' as const,
    requiredSkills: ['directory-submission'],
    acceptanceCriteria: [
      'Listing created on AlternativeTo',
      'Marked as alternative to relevant platforms',
      'Description accurate',
    ],
    amount: 2,
    currency: 'USDC',
    expiresInDays: 14,
    submissionMethod: 'proof' as const,
    tags: ['directory', 'seo', 'marketing'],
  },
];

// =============================================================================
// COMBINE ALL BOUNTIES
// =============================================================================
const ALL_GROWTH_BOUNTIES = [
  ...VIRAL_BOUNTIES,
  ...ARBITRAGE_BOUNTIES,
  ...IDENTITY_BOUNTIES,
  ...SUPPLY_BOUNTIES,
  ...COMPETITIVE_BOUNTIES,
  ...DIRECTORY_BOUNTIES,
];

async function main() {
  const apiKey = process.env.POSTER_API_KEY;

  if (!apiKey) {
    console.error('❌ POSTER_API_KEY required');
    console.log('Usage: POSTER_API_KEY=xxx npx tsx scripts/growth-bounties.ts');
    process.exit(1);
  }

  console.log('🚀 AGGRESSIVE GROWTH BOUNTIES');
  console.log('============================\n');

  initFirestore();

  const totalAmount = ALL_GROWTH_BOUNTIES.reduce((sum, b) => sum + b.amount, 0);
  console.log(`📋 ${ALL_GROWTH_BOUNTIES.length} bounties totaling $${totalAmount}\n`);

  console.log('Categories:');
  console.log(`  Viral/Referral: ${VIRAL_BOUNTIES.length} bounties`);
  console.log(`  Cross-Platform Arbitrage: ${ARBITRAGE_BOUNTIES.length} bounties`);
  console.log(`  Identity/Onboarding: ${IDENTITY_BOUNTIES.length} bounties`);
  console.log(`  Supply-Side (Posters): ${SUPPLY_BOUNTIES.length} bounties`);
  console.log(`  Competitive Moves: ${COMPETITIVE_BOUNTIES.length} bounties`);
  console.log(`  Directory Submissions: ${DIRECTORY_BOUNTIES.length} bounties\n`);

  let created = 0;
  let failed = 0;

  for (const bounty of ALL_GROWTH_BOUNTIES) {
    process.stdout.write(`📝 "${bounty.title}" ($${bounty.amount})... `);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: POSTER_ID,
      apiKey,
      ...bounty,
      fundNow: false, // Create as drafts - fund later
    });

    if (result.success) {
      created++;
      console.log(`✅ Draft (${result.bounty?.id})`);
    } else {
      failed++;
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 SUMMARY`);
  console.log(`   Created: ${created}/${ALL_GROWTH_BOUNTIES.length}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total value: $${totalAmount}`);

  console.log(`\n💰 FUNDING REQUIRED: $${totalAmount}`);
  console.log(`\nTo fund all bounties:`);
  console.log(`  1. Deposit $${totalAmount}+ to clawdentials-bounties`);
  console.log(`  2. Run: npx tsx scripts/fund-all-drafts.ts`);
}

main().catch(console.error);
