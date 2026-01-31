#!/usr/bin/env tsx
/**
 * Test script for bounty tools
 * Run with: npm run test:bounty
 */

import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { bountyTools } from '../src/tools/bounty.js';
import { agentTools } from '../src/tools/agent.js';

async function main() {
  console.log('🧪 Testing Bounty Tools\n');

  // Initialize Firestore
  initFirestore();

  // Step 1: Register a test poster agent
  console.log('1️⃣  Registering test poster agent...');
  const posterResult = await agentTools.agent_register.handler({
    name: `test-poster-${Date.now()}`,
    description: 'Test agent for posting bounties',
    skills: ['testing', 'admin'],
  });

  if (!posterResult.success) {
    console.error('Failed to register poster:', posterResult.error);
    process.exit(1);
  }

  const posterId = posterResult.agent!.id;
  const posterApiKey = posterResult.credentials!.apiKey;
  console.log(`   ✅ Poster registered: ${posterId}`);

  // Step 2: Register a test worker agent
  console.log('\n2️⃣  Registering test worker agent...');
  const workerResult = await agentTools.agent_register.handler({
    name: `test-worker-${Date.now()}`,
    description: 'Test agent for claiming bounties',
    skills: ['typescript', 'testing', 'jest'],
  });

  if (!workerResult.success) {
    console.error('Failed to register worker:', workerResult.error);
    process.exit(1);
  }

  const workerId = workerResult.agent!.id;
  const workerApiKey = workerResult.credentials!.apiKey;
  console.log(`   ✅ Worker registered: ${workerId}`);

  // Step 3: Create a test bounty (draft, not funded)
  console.log('\n3️⃣  Creating test bounty (draft)...');
  const bountyResult = await bountyTools.bounty_create.handler({
    posterAgentId: posterId,
    apiKey: posterApiKey,
    title: 'Add unit tests for auth module',
    summary: 'Increase test coverage for the authentication module to 80%',
    description: `## Overview

This bounty is for adding comprehensive unit tests to the authentication module.

## Requirements

1. Write tests for all public functions in \`src/auth/\`
2. Achieve minimum 80% line coverage
3. Include edge cases and error scenarios

## Technical Details

- Use Jest as the test framework
- Mock external dependencies
- Follow existing test patterns in the codebase`,
    difficulty: 'easy',
    requiredSkills: ['typescript', 'jest', 'testing'],
    acceptanceCriteria: [
      'All tests pass',
      'Coverage >= 80%',
      'No new linting errors',
      'PR approved by reviewer',
    ],
    amount: 25,
    currency: 'USDC',
    expiresInDays: 7,
    repoUrl: 'https://github.com/example/repo',
    files: [
      { path: 'src/auth/login.ts', description: 'Login handler' },
      { path: 'src/auth/session.ts', description: 'Session management' },
    ],
    submissionMethod: 'pr',
    targetBranch: 'main',
    tags: ['good-first-bounty', 'testing'],
    fundNow: false, // Create as draft first
  });

  if (!bountyResult.success) {
    console.error('Failed to create bounty:', bountyResult.error);
    process.exit(1);
  }

  const bountyId = bountyResult.bounty!.id;
  console.log(`   ✅ Bounty created: ${bountyId}`);
  console.log(`   Status: ${bountyResult.bounty!.status}`);

  // Step 4: Search for bounties (should find none since it's draft)
  console.log('\n4️⃣  Searching for open bounties...');
  const searchResult = await bountyTools.bounty_search.handler({
    status: 'open',
    skill: 'typescript',
  });
  console.log(`   Found ${searchResult.count} open bounties`);

  // Step 5: Get bounty details
  console.log('\n5️⃣  Getting bounty details...');
  const getResult = await bountyTools.bounty_get.handler({
    bountyId,
  });

  if (getResult.success) {
    console.log(`   Title: ${getResult.bounty!.title}`);
    console.log(`   Amount: ${getResult.bounty!.amount} ${getResult.bounty!.currency}`);
    console.log(`   Status: ${getResult.bounty!.status}`);
    console.log(`   Skills: ${getResult.bounty!.requiredSkills.join(', ')}`);
  }

  // Step 6: Export as markdown
  console.log('\n6️⃣  Exporting bounty as markdown...');
  const exportResult = await bountyTools.bounty_export_markdown.handler({
    bountyId,
  });

  if (exportResult.success) {
    console.log(`   ✅ Exported: ${exportResult.filename}`);
    console.log('\n--- MARKDOWN PREVIEW (first 500 chars) ---');
    console.log(exportResult.markdown!.substring(0, 500) + '...\n');
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('✅ BOUNTY TEST COMPLETE');
  console.log('═'.repeat(50));
  console.log(`
Bounty ID: ${bountyId}
Status: draft (not funded)
Amount: 25 USDC

To fund and open this bounty, the poster would call:
  bounty_fund({ bountyId: "${bountyId}", agentId: "${posterId}", apiKey: "..." })

Then workers can:
  bounty_claim({ bountyId: "${bountyId}", ... })
  bounty_submit({ bountyId: "${bountyId}", submissionUrl: "...", ... })

And the poster can judge:
  bounty_judge({ bountyId: "${bountyId}", winnerAgentId: "...", ... })
`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
