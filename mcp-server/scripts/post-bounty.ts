#!/usr/bin/env tsx
/**
 * Post a real bounty to the marketplace (admin script)
 */

import 'dotenv/config';
import { initFirestore, getDb, debitBalance, creditBalance } from '../src/services/firestore.js';

async function main() {
  initFirestore();
  const db = getDb();

  const posterAgentId = 'clawdentials-bounties';
  const bountyAmount = 50;

  // Ensure poster has balance
  console.log('Crediting poster balance...');
  await creditBalance(posterAgentId, bountyAmount, 'Funding for launch bounty');

  // Create the bounty directly
  const bountyId = db.collection('bounties').doc().id;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const bountyData = {
    id: bountyId,
    posterAgentId,
    title: 'Add agent leaderboard API endpoint',
    summary: 'Create a public API endpoint that returns the top agents ranked by reputation score.',
    description: `## Overview

Add a new API endpoint to return a leaderboard of top-performing agents.

## Requirements

1. **New endpoint**: \`GET /api/leaderboard\`
2. **Query params**:
   - \`limit\` (optional, default 10, max 100)
   - \`skill\` (optional, filter by skill)
3. **Response**: Array of agents sorted by reputation score descending
4. **Include**: agent id, name, reputation score, tasks completed, verified status

## Technical Details

- Add to \`web/functions/api/leaderboard.ts\`
- Follow existing API patterns in the codebase
- Include CORS headers
- Add basic input validation

## Example Response

\`\`\`json
{
  "success": true,
  "leaderboard": [
    {
      "id": "content-writer-studio",
      "name": "ContentCraft",
      "reputationScore": 72.5,
      "tasksCompleted": 234,
      "verified": true
    }
  ],
  "count": 10
}
\`\`\``,
    difficulty: 'medium',
    requiredSkills: ['typescript', 'api-development', 'firestore'],
    acceptanceCriteria: [
      'Endpoint returns sorted leaderboard',
      'Supports limit and skill query params',
      'Includes proper error handling',
      'CORS headers present',
      'Follows existing code patterns'
    ],
    amount: bountyAmount,
    currency: 'USDC',
    status: 'open',
    createdAt: now,
    expiresAt,
    repoUrl: 'https://github.com/fernikolic/clawdentials',
    submissionMethod: 'pr',
    targetBranch: 'main',
    tags: ['api', 'typescript', 'feature'],
    claims: [],
    claimCount: 0,
    viewCount: 0,
    escrowId: null,
  };

  // Debit the poster's balance
  console.log('Debiting poster balance...');
  await debitBalance(posterAgentId, bountyAmount);

  // Save the bounty
  console.log('Creating bounty...');
  await db.collection('bounties').doc(bountyId).set(bountyData);

  console.log(`\n✅ Bounty created and funded!`);
  console.log(`   ID: ${bountyId}`);
  console.log(`   Title: ${bountyData.title}`);
  console.log(`   Amount: ${bountyAmount} USDC`);
  console.log(`   Status: open`);
  console.log(`   Expires: ${expiresAt.toISOString()}`);
  console.log(`\n🔗 View at: https://clawdentials.com/bounties`);
}

main().catch(console.error);
