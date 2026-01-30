/**
 * Manual test script for Clawdentials MCP tools
 * Run with: npx tsx scripts/test-tools.ts
 */

import { escrowTools } from '../src/tools/escrow.js';
import { initFirestore } from '../src/services/firestore.js';

async function runTests() {
  console.log('🔧 Initializing Firestore...');
  initFirestore();

  console.log('\n--- Test 1: Create Escrow ---');
  const createResult = await escrowTools.escrow_create.handler({
    taskDescription: 'Write a blog post about AI agents',
    amount: 50,
    currency: 'USD',
    providerAgentId: 'agent-writer-001',
    clientAgentId: 'agent-client-001',
  });
  console.log(JSON.stringify(createResult, null, 2));

  if (!createResult.success) {
    console.error('❌ Create failed');
    process.exit(1);
  }

  const escrowId = createResult.escrowId;
  console.log(`✅ Created escrow: ${escrowId}`);

  console.log('\n--- Test 2: Check Status ---');
  const statusResult = await escrowTools.escrow_status.handler({
    escrowId,
  });
  console.log(JSON.stringify(statusResult, null, 2));

  if (!statusResult.success) {
    console.error('❌ Status check failed');
    process.exit(1);
  }
  console.log('✅ Status check passed');

  console.log('\n--- Test 3: Complete Escrow ---');
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

  console.log('\n--- Test 4: Verify Final Status ---');
  const finalStatus = await escrowTools.escrow_status.handler({
    escrowId,
  });
  console.log(JSON.stringify(finalStatus, null, 2));

  if (finalStatus.escrow?.status !== 'completed') {
    console.error('❌ Final status not completed');
    process.exit(1);
  }
  console.log('✅ Final status verified');

  console.log('\n🎉 All tests passed!');
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
