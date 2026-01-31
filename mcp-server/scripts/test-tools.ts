/**
 * Manual test script for Clawdentials MCP tools
 * Run with: npx tsx scripts/test-tools.ts
 */

import { escrowTools } from '../src/tools/escrow.js';
import { agentTools } from '../src/tools/agent.js';
import { initFirestore } from '../src/services/firestore.js';

async function runTests() {
  console.log('🔧 Initializing Firestore...');
  initFirestore();

  // Generate unique test IDs to avoid conflicts
  const testId = Date.now().toString(36);
  const agentName = `test-agent-${testId}`;
  const clientAgentId = `client-${testId}`;

  // ===== AGENT TESTS =====

  console.log('\n--- Test 1: Register Agent ---');
  const registerResult = await agentTools.agent_register.handler({
    name: agentName,
    description: 'A test agent for research and writing tasks',
    skills: ['research', 'writing', 'data-analysis'],
  });
  console.log(JSON.stringify(registerResult, null, 2));

  if (!registerResult.success) {
    console.error('❌ Agent registration failed');
    process.exit(1);
  }
  console.log(`✅ Registered agent: ${agentName}`);

  console.log('\n--- Test 2: Get Agent Score ---');
  const scoreResult = await agentTools.agent_score.handler({
    agentId: agentName,
  });
  console.log(JSON.stringify(scoreResult, null, 2));

  if (!scoreResult.success) {
    console.error('❌ Agent score failed');
    process.exit(1);
  }
  console.log(`✅ Agent score: ${scoreResult.agent?.reputationScore}`);

  console.log('\n--- Test 3: Search Agents ---');
  const searchResult = await agentTools.agent_search.handler({
    skill: 'research',
    limit: 5,
  });
  console.log(JSON.stringify(searchResult, null, 2));

  if (!searchResult.success) {
    console.error('❌ Agent search failed');
    process.exit(1);
  }
  console.log(`✅ Found ${searchResult.count} agents`);

  // ===== ESCROW TESTS =====

  console.log('\n--- Test 4: Create Escrow ---');
  const createResult = await escrowTools.escrow_create.handler({
    taskDescription: 'Write a blog post about AI agents',
    amount: 50,
    currency: 'USD',
    providerAgentId: agentName,
    clientAgentId: clientAgentId,
  });
  console.log(JSON.stringify(createResult, null, 2));

  if (!createResult.success) {
    console.error('❌ Escrow create failed');
    process.exit(1);
  }

  const escrowId = createResult.escrowId;
  console.log(`✅ Created escrow: ${escrowId} (Fee: $${createResult.escrow?.fee})`);

  console.log('\n--- Test 5: Check Escrow Status ---');
  const statusResult = await escrowTools.escrow_status.handler({
    escrowId,
  });
  console.log(JSON.stringify(statusResult, null, 2));

  if (!statusResult.success) {
    console.error('❌ Status check failed');
    process.exit(1);
  }
  console.log('✅ Status check passed');

  console.log('\n--- Test 6: Complete Escrow ---');
  const completeResult = await escrowTools.escrow_complete.handler({
    escrowId,
    proofOfWork: 'Blog post published at https://example.com/ai-agents-post',
  });
  console.log(JSON.stringify(completeResult, null, 2));

  if (!completeResult.success) {
    console.error('❌ Complete failed');
    process.exit(1);
  }
  console.log('✅ Complete passed');

  console.log('\n--- Test 7: Verify Agent Stats Updated ---');
  const updatedScore = await agentTools.agent_score.handler({
    agentId: agentName,
  });
  console.log(JSON.stringify(updatedScore, null, 2));

  if (updatedScore.agent?.stats?.tasksCompleted !== 1) {
    console.error('❌ Agent stats not updated');
    process.exit(1);
  }
  console.log(`✅ Agent stats updated: ${updatedScore.agent?.stats?.tasksCompleted} tasks completed`);

  // ===== DISPUTE TEST =====

  console.log('\n--- Test 8: Create Escrow for Dispute Test ---');
  const disputeEscrow = await escrowTools.escrow_create.handler({
    taskDescription: 'Task that will be disputed',
    amount: 25,
    currency: 'USD',
    providerAgentId: agentName,
    clientAgentId: clientAgentId,
  });

  if (!disputeEscrow.success) {
    console.error('❌ Escrow for dispute test failed');
    process.exit(1);
  }
  const disputeEscrowId = disputeEscrow.escrowId;
  console.log(`✅ Created escrow for dispute: ${disputeEscrowId}`);

  console.log('\n--- Test 9: Dispute Escrow ---');
  const disputeResult = await escrowTools.escrow_dispute.handler({
    escrowId: disputeEscrowId,
    reason: 'Work quality not as described',
  });
  console.log(JSON.stringify(disputeResult, null, 2));

  if (!disputeResult.success) {
    console.error('❌ Dispute failed');
    process.exit(1);
  }
  console.log('✅ Dispute passed');

  console.log('\n--- Test 10: Verify Dispute Status ---');
  const disputeStatus = await escrowTools.escrow_status.handler({
    escrowId: disputeEscrowId,
  });
  console.log(JSON.stringify(disputeStatus, null, 2));

  if (disputeStatus.escrow?.status !== 'disputed') {
    console.error('❌ Escrow not marked as disputed');
    process.exit(1);
  }
  console.log('✅ Dispute status verified');

  console.log('\n--- Test 11: Verify Agent Dispute Count ---');
  const finalScore = await agentTools.agent_score.handler({
    agentId: agentName,
  });
  console.log(JSON.stringify(finalScore, null, 2));

  if (finalScore.agent?.stats?.disputeCount !== 1) {
    console.error('❌ Agent dispute count not updated');
    process.exit(1);
  }
  console.log(`✅ Agent dispute count updated: ${finalScore.agent?.stats?.disputeCount}`);

  console.log('\n🎉 All 11 tests passed!');
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
