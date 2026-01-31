/**
 * Comprehensive test script for Clawdentials MCP tools (Beta)
 * Tests: Auth, Balance, Escrow flow, Withdrawals, Admin operations
 * Run with: npm test
 */

import { escrowTools } from '../src/tools/escrow.js';
import { agentTools } from '../src/tools/agent.js';
import { adminTools } from '../src/tools/admin.js';
import { initFirestore, ADMIN_SECRET } from '../src/services/firestore.js';

async function runTests() {
  console.log('🔧 Initializing Firestore...\n');
  initFirestore();

  // Generate unique test IDs
  const testId = Date.now().toString(36);
  const clientName = `client-${testId}`;
  const providerName = `provider-${testId}`;

  let clientApiKey: string;
  let providerApiKey: string;

  // ===== AGENT REGISTRATION =====

  console.log('=== AGENT REGISTRATION ===\n');

  console.log('--- Test 1: Register Client Agent ---');
  const clientResult = await agentTools.agent_register.handler({
    name: clientName,
    description: 'Test client agent',
    skills: ['hiring', 'task-management'],
  });
  console.log(JSON.stringify(clientResult, null, 2));

  if (!clientResult.success || !clientResult.apiKey) {
    console.error('❌ Client registration failed');
    process.exit(1);
  }
  clientApiKey = clientResult.apiKey;
  console.log(`✅ Client registered: ${clientName}`);
  console.log(`   API Key: ${clientApiKey.substring(0, 20)}...`);

  console.log('\n--- Test 2: Register Provider Agent ---');
  const providerResult = await agentTools.agent_register.handler({
    name: providerName,
    description: 'Test provider agent',
    skills: ['research', 'writing'],
  });

  if (!providerResult.success || !providerResult.apiKey) {
    console.error('❌ Provider registration failed');
    process.exit(1);
  }
  providerApiKey = providerResult.apiKey;
  console.log(`✅ Provider registered: ${providerName}`);

  // ===== BALANCE OPERATIONS =====

  console.log('\n=== BALANCE OPERATIONS ===\n');

  console.log('--- Test 3: Check Initial Balance (should be 0) ---');
  const initialBalance = await agentTools.agent_balance.handler({
    agentId: clientName,
    apiKey: clientApiKey,
  });
  console.log(JSON.stringify(initialBalance, null, 2));

  if (!initialBalance.success || initialBalance.balance !== 0) {
    console.error('❌ Initial balance check failed');
    process.exit(1);
  }
  console.log('✅ Initial balance: 0');

  console.log('\n--- Test 4: Admin Credits Balance ---');
  const creditResult = await adminTools.admin_credit_balance.handler({
    adminSecret: ADMIN_SECRET,
    agentId: clientName,
    amount: 100,
    currency: 'USD',
    notes: 'Test deposit via PayPal',
  });
  console.log(JSON.stringify(creditResult, null, 2));

  if (!creditResult.success || creditResult.newBalance !== 100) {
    console.error('❌ Balance credit failed');
    process.exit(1);
  }
  console.log('✅ Balance credited: $100');

  console.log('\n--- Test 5: Verify New Balance ---');
  const newBalance = await agentTools.agent_balance.handler({
    agentId: clientName,
    apiKey: clientApiKey,
  });

  if (!newBalance.success || newBalance.balance !== 100) {
    console.error('❌ Balance verification failed');
    process.exit(1);
  }
  console.log(`✅ Balance verified: $${newBalance.balance}`);

  // ===== ESCROW FLOW WITH BALANCE =====

  console.log('\n=== ESCROW FLOW ===\n');

  console.log('--- Test 6: Create Escrow (deducts from balance) ---');
  const escrowResult = await escrowTools.escrow_create.handler({
    taskDescription: 'Write a research report',
    amount: 50,
    currency: 'USD',
    providerAgentId: providerName,
    clientAgentId: clientName,
    apiKey: clientApiKey,
  });
  console.log(JSON.stringify(escrowResult, null, 2));

  if (!escrowResult.success) {
    console.error('❌ Escrow creation failed');
    process.exit(1);
  }
  const escrowId = escrowResult.escrowId;
  console.log(`✅ Escrow created: ${escrowId}`);
  console.log(`   Client new balance: $${escrowResult.newBalance}`);

  console.log('\n--- Test 7: Verify Client Balance Reduced ---');
  const reducedBalance = await agentTools.agent_balance.handler({
    agentId: clientName,
    apiKey: clientApiKey,
  });

  if (reducedBalance.balance !== 50) {
    console.error('❌ Balance not reduced correctly');
    process.exit(1);
  }
  console.log(`✅ Client balance reduced to: $${reducedBalance.balance}`);

  console.log('\n--- Test 8: Provider Completes Escrow ---');
  const completeResult = await escrowTools.escrow_complete.handler({
    escrowId,
    proofOfWork: 'Research report completed: https://example.com/report',
    apiKey: providerApiKey,
  });
  console.log(JSON.stringify(completeResult, null, 2));

  if (!completeResult.success) {
    console.error('❌ Escrow completion failed');
    process.exit(1);
  }
  console.log(`✅ Escrow completed, provider received: $${completeResult.escrow?.netAmount}`);
  console.log(`   Provider new balance: $${completeResult.newBalance}`);

  console.log('\n--- Test 9: Verify Provider Balance ---');
  const providerBalance = await agentTools.agent_balance.handler({
    agentId: providerName,
    apiKey: providerApiKey,
  });

  // Provider should have 45 (50 - 10% fee)
  if (providerBalance.balance !== 45) {
    console.error(`❌ Provider balance incorrect: expected 45, got ${providerBalance.balance}`);
    process.exit(1);
  }
  console.log(`✅ Provider balance: $${providerBalance.balance} (after 10% fee)`);

  // ===== AUTH TESTS =====

  console.log('\n=== AUTH TESTS ===\n');

  console.log('--- Test 10: Invalid API Key Rejected ---');
  const invalidAuth = await agentTools.agent_balance.handler({
    agentId: clientName,
    apiKey: 'invalid-key',
  });

  if (invalidAuth.success) {
    console.error('❌ Invalid API key should be rejected');
    process.exit(1);
  }
  console.log('✅ Invalid API key correctly rejected');

  // ===== WITHDRAWAL FLOW =====

  console.log('\n=== WITHDRAWAL FLOW ===\n');

  console.log('--- Test 11: Provider Requests Withdrawal ---');
  const withdrawResult = await agentTools.withdraw_request.handler({
    agentId: providerName,
    apiKey: providerApiKey,
    amount: 20,
    currency: 'USD',
    paymentMethod: 'PayPal: provider@example.com',
  });
  console.log(JSON.stringify(withdrawResult, null, 2));

  if (!withdrawResult.success) {
    console.error('❌ Withdrawal request failed');
    process.exit(1);
  }
  const withdrawalId = withdrawResult.withdrawal?.id;
  console.log(`✅ Withdrawal requested: ${withdrawalId}`);

  console.log('\n--- Test 12: Verify Balance Held ---');
  const heldBalance = await agentTools.agent_balance.handler({
    agentId: providerName,
    apiKey: providerApiKey,
  });

  if (heldBalance.balance !== 25) {
    console.error(`❌ Balance not held correctly: expected 25, got ${heldBalance.balance}`);
    process.exit(1);
  }
  console.log(`✅ Balance held: $${heldBalance.balance} (45 - 20 withdrawal)`);

  console.log('\n--- Test 13: Admin Lists Pending Withdrawals ---');
  const listResult = await adminTools.admin_list_withdrawals.handler({
    adminSecret: ADMIN_SECRET,
    status: 'pending',
  });
  console.log(JSON.stringify(listResult, null, 2));

  if (!listResult.success || listResult.count === 0) {
    console.error('❌ Withdrawal listing failed');
    process.exit(1);
  }
  console.log(`✅ Found ${listResult.count} pending withdrawal(s)`);

  console.log('\n--- Test 14: Admin Processes Withdrawal ---');
  const processResult = await adminTools.admin_process_withdrawal.handler({
    adminSecret: ADMIN_SECRET,
    withdrawalId: withdrawalId!,
    action: 'complete',
    notes: 'Sent via PayPal',
  });
  console.log(JSON.stringify(processResult, null, 2));

  if (!processResult.success) {
    console.error('❌ Withdrawal processing failed');
    process.exit(1);
  }
  console.log('✅ Withdrawal processed');

  // ===== DISPUTE FLOW =====

  console.log('\n=== DISPUTE FLOW ===\n');

  // Credit more balance for dispute test
  await adminTools.admin_credit_balance.handler({
    adminSecret: ADMIN_SECRET,
    agentId: clientName,
    amount: 50,
    currency: 'USD',
  });

  console.log('--- Test 15: Create Escrow for Dispute ---');
  const disputeEscrow = await escrowTools.escrow_create.handler({
    taskDescription: 'Task that will be disputed',
    amount: 30,
    currency: 'USD',
    providerAgentId: providerName,
    clientAgentId: clientName,
    apiKey: clientApiKey,
  });

  if (!disputeEscrow.success) {
    console.error('❌ Dispute escrow creation failed');
    process.exit(1);
  }
  const disputeEscrowId = disputeEscrow.escrowId;
  console.log(`✅ Escrow for dispute created: ${disputeEscrowId}`);

  console.log('\n--- Test 16: Client Disputes Escrow ---');
  const disputeResult = await escrowTools.escrow_dispute.handler({
    escrowId: disputeEscrowId,
    reason: 'Work not delivered as promised',
    apiKey: clientApiKey,
  });
  console.log(JSON.stringify(disputeResult, null, 2));

  if (!disputeResult.success) {
    console.error('❌ Dispute failed');
    process.exit(1);
  }
  console.log('✅ Escrow disputed');

  console.log('\n--- Test 17: Admin Refunds Disputed Escrow ---');
  const refundResult = await adminTools.admin_refund_escrow.handler({
    adminSecret: ADMIN_SECRET,
    escrowId: disputeEscrowId,
  });
  console.log(JSON.stringify(refundResult, null, 2));

  if (!refundResult.success) {
    console.error('❌ Refund failed');
    process.exit(1);
  }
  console.log(`✅ Escrow refunded, client new balance: $${refundResult.clientNewBalance}`);

  // ===== FINAL SUMMARY =====

  console.log('\n=== FINAL BALANCES ===\n');

  const finalClientBalance = await agentTools.agent_balance.handler({
    agentId: clientName,
    apiKey: clientApiKey,
  });

  const finalProviderBalance = await agentTools.agent_balance.handler({
    agentId: providerName,
    apiKey: providerApiKey,
  });

  console.log(`Client (${clientName}): $${finalClientBalance.balance}`);
  console.log(`Provider (${providerName}): $${finalProviderBalance.balance}`);

  console.log('\n🎉 All 17 tests passed!\n');
  console.log('Beta features working:');
  console.log('  ✅ Agent registration with API keys');
  console.log('  ✅ API key authentication');
  console.log('  ✅ Balance system');
  console.log('  ✅ Escrow with balance deduction/credit');
  console.log('  ✅ Withdrawal requests');
  console.log('  ✅ Admin balance credit');
  console.log('  ✅ Admin withdrawal processing');
  console.log('  ✅ Dispute and refund flow');
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
