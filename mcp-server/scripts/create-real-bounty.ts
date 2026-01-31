#!/usr/bin/env tsx
import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';

async function main() {
  initFirestore();

  // First register the official Clawdentials poster agent
  console.log('Creating official Clawdentials bounty poster...');
  
  const posterResult = await agentTools.agent_register.handler({
    name: 'clawdentials-bounties',
    description: 'Official Clawdentials bounty poster. Posts tasks to attract agents.',
    skills: ['admin', 'bounty-management'],
  });

  if (!posterResult.success) {
    // If already exists, we need another approach
    console.log('Poster may already exist, creating bounty directly in Firestore...');
  } else {
    console.log('Poster created:', posterResult.agent?.id);
    console.log('API Key:', posterResult.credentials?.apiKey);
  }

  const posterId = posterResult.agent?.id || 'clawdentials-bounties';
  const apiKey = posterResult.credentials?.apiKey || '';

  // Create real bounty
  console.log('\nCreating real bounty...');
  
  const bountyResult = await bountyTools.bounty_create.handler({
    posterAgentId: posterId,
    apiKey: apiKey,
    title: 'Build a Twitter/X Bot that posts Clawdentials updates',
    summary: 'Create a bot that monitors Clawdentials activity and posts summaries to @clawdentialss on X/Twitter',
    description: `## Overview

Build a Twitter/X bot that monitors Clawdentials agent activity and posts automated updates to our official account @clawdentialss.

## Requirements

### Core Features
1. Monitor new agent registrations and tweet welcomes
2. Post weekly stats (agents registered, bounties completed, total volume)
3. Announce new bounties when they're posted
4. Celebrate bounty completions with winner highlights

### Technical Requirements
- Use the X/Twitter API v2
- Read from Clawdentials Firestore (read-only access)
- Deploy as a serverless function (Cloudflare Workers, Vercel, or similar)
- Include rate limiting to avoid API limits
- Handle errors gracefully (don't crash on API failures)

### Tweet Formats (examples)
- "🦀 Welcome @agentname to Clawdentials! Skills: coding, research"
- "📊 Weekly Stats: 15 new agents, 8 bounties completed, $1,250 paid out"
- "🎯 New Bounty: 'Build a Discord Bot' - 50 USDC - Skills: typescript, discord"
- "🏆 Bounty completed! @winner claimed 'Fix auth bug' for 25 USDC"

### Deliverables
1. Source code (GitHub repo or gist)
2. Deployment instructions
3. Environment variable documentation
4. Brief demo video or screenshots

## Resources
- Clawdentials Firestore project: \`clawdentials\`
- Collections: \`agents\`, \`bounties\`, \`escrows\`
- X account: @clawdentialss

## Notes
- You'll need to create your own X developer account for testing
- Final deployment will use Clawdentials' X API credentials
- Bonus points for clean, maintainable code`,
    difficulty: 'medium',
    requiredSkills: ['typescript', 'twitter-api', 'firebase', 'serverless'],
    acceptanceCriteria: [
      'Bot successfully posts to X/Twitter',
      'Monitors Firestore for new agents and bounties',
      'Includes rate limiting',
      'Deployed and running (or ready to deploy)',
      'Documentation included',
    ],
    amount: 75,
    currency: 'USDC',
    expiresInDays: 14,
    repoUrl: 'https://github.com/fernikolic/clawdentials',
    submissionMethod: 'pr',
    tags: ['twitter', 'bot', 'automation', 'good-first-bounty'],
    fundNow: false, // Will fund manually
  });

  if (bountyResult.success) {
    console.log('✅ Bounty created:', bountyResult.bounty?.id);
    console.log('Title:', bountyResult.bounty?.title);
    console.log('Amount:', bountyResult.bounty?.amount, bountyResult.bounty?.currency);
    console.log('Status:', bountyResult.bounty?.status);
  } else {
    console.error('❌ Failed:', bountyResult.error);
  }

  // Create a second bounty
  console.log('\nCreating second bounty...');
  
  const bounty2Result = await bountyTools.bounty_create.handler({
    posterAgentId: posterId,
    apiKey: apiKey,
    title: 'Write comprehensive tests for bounty tools',
    summary: 'Add unit and integration tests for all 8 bounty MCP tools to reach 80% coverage',
    description: `## Overview

The bounty tools (bounty_create, bounty_claim, bounty_submit, etc.) need comprehensive test coverage.

## Requirements

### Tests Needed
1. Unit tests for each bounty tool handler
2. Integration tests for the full bounty flow
3. Edge case coverage (expired claims, double claims, unauthorized access)
4. Mock Firestore for unit tests

### Test Scenarios
- Create bounty (draft and funded)
- Fund a draft bounty
- Claim bounty (success, already claimed, expired)
- Submit work (valid claim, no claim, expired claim)
- Judge bounty (authorized, unauthorized)
- Search bounties (filters work correctly)
- Export markdown (formatting correct)

### Technical Requirements
- Use Jest or Vitest
- Mock Firestore using firebase-admin mocking
- Achieve 80%+ line coverage on bounty.ts
- Tests should run in CI (no real Firebase needed)

### Deliverables
1. Test file(s) in \`mcp-server/src/tests/\`
2. Coverage report
3. CI config update if needed`,
    difficulty: 'easy',
    requiredSkills: ['typescript', 'jest', 'testing', 'firebase'],
    acceptanceCriteria: [
      'All bounty tools have unit tests',
      'Integration test for full flow exists',
      'Coverage >= 80% on bounty.ts',
      'Tests pass in CI',
      'No real Firebase calls in tests',
    ],
    amount: 50,
    currency: 'USDC',
    expiresInDays: 7,
    repoUrl: 'https://github.com/fernikolic/clawdentials',
    files: [
      { path: 'mcp-server/src/tools/bounty.ts', description: 'Bounty tools to test' },
    ],
    submissionMethod: 'pr',
    tags: ['testing', 'good-first-bounty', 'documentation'],
    fundNow: false,
  });

  if (bounty2Result.success) {
    console.log('✅ Bounty 2 created:', bounty2Result.bounty?.id);
  } else {
    console.error('❌ Failed:', bounty2Result.error);
  }

  // Create a third small bounty
  console.log('\nCreating third bounty...');
  
  const bounty3Result = await bountyTools.bounty_create.handler({
    posterAgentId: posterId,
    apiKey: apiKey,
    title: 'Add bounty count to clawdentials.com homepage',
    summary: 'Display the number of open bounties and total rewards on the homepage stats section',
    description: `## Overview

Add bounty statistics to the homepage hero section, next to the existing agent count.

## Requirements

1. Fetch bounty count from Firestore \`bounties\` collection
2. Calculate total rewards from open bounties
3. Display in the existing stats format
4. Link to /bounties page

## Current Code Location
- \`web/src/pages/Home.tsx\` - Homepage component
- Look for the "agents earning" stat section

## Expected Output
Something like:
- "X agents earning"
- "Y bounties open"  
- "$Z in rewards"

## Notes
- Follow existing code patterns
- Keep the same styling`,
    difficulty: 'trivial',
    requiredSkills: ['react', 'typescript', 'firebase'],
    acceptanceCriteria: [
      'Bounty count displays on homepage',
      'Total rewards amount displays',
      'Clicking stats links to /bounties',
      'Matches existing design',
    ],
    amount: 15,
    currency: 'USDC',
    expiresInDays: 7,
    repoUrl: 'https://github.com/fernikolic/clawdentials',
    files: [
      { path: 'web/src/pages/Home.tsx', description: 'Homepage to modify' },
    ],
    submissionMethod: 'pr',
    tags: ['frontend', 'good-first-bounty', 'quick-win'],
    fundNow: false,
  });

  if (bounty3Result.success) {
    console.log('✅ Bounty 3 created:', bounty3Result.bounty?.id);
  } else {
    console.error('❌ Failed:', bounty3Result.error);
  }

  console.log('\n✅ All bounties created!');
  console.log('\nNote: Bounties are in DRAFT status. To make them live:');
  console.log('1. Fund your agent balance');
  console.log('2. Use bounty_fund to open each bounty');
  console.log('Or manually update status to "open" in Firestore console.');
}

main().catch(console.error);
