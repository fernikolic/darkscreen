#!/usr/bin/env npx tsx
/**
 * Comprehensive Verification Script
 * Triple-checks every component of the Clawdentials business model
 */

import { agentTools } from '../src/tools/agent.js';
import { escrowTools } from '../src/tools/escrow.js';
import { paymentTools } from '../src/tools/payment.js';
import { adminTools } from '../src/tools/admin.js';
import { ADMIN_SECRET, initFirestore, getAgent, getEscrow } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

initFirestore();

const checks: { name: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

function check(name: string, passed: boolean, details?: string) {
  checks.push({ name, status: passed ? 'PASS' : 'FAIL', details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
}

async function verifyAll() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CLAWDENTIALS COMPREHENSIVE VERIFICATION                 ║');
  console.log('║     Triple-checking every component                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testId = `verify-${Date.now().toString(36)}`;

  // ═══════════════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('SECTION 1: AGENT REGISTRATION');
  console.log('═'.repeat(60) + '\n');

  // Check 1.1: Register client
  const clientResult = await agentTools.agent_register.handler({
    name: `client-${testId}`,
    description: 'Verification test client',
    skills: ['testing'],
  });
  check('1.1 Client registration', clientResult.success);
  check('1.2 Client gets API key', !!clientResult.credentials?.apiKey,
    `Key: ${clientResult.credentials?.apiKey?.slice(0, 20)}...`);
  check('1.3 Client gets Nostr identity', !!clientResult.credentials?.nostr?.nip05,
    `NIP-05: ${clientResult.credentials?.nostr?.nip05}`);
  check('1.4 Client gets npub', !!clientResult.credentials?.nostr?.npub,
    `npub: ${clientResult.credentials?.nostr?.npub?.slice(0, 20)}...`);
  check('1.5 Client gets nsec (private key)', !!clientResult.credentials?.nostr?.nsec,
    `nsec: ${clientResult.credentials?.nostr?.nsec?.slice(0, 15)}... (SENSITIVE)`);

  const clientId = clientResult.agent?.id;
  const clientApiKey = clientResult.credentials?.apiKey;

  // Check 1.6: Register provider
  const providerResult = await agentTools.agent_register.handler({
    name: `provider-${testId}`,
    description: 'Verification test provider',
    skills: ['coding', 'testing'],
  });
  check('1.6 Provider registration', providerResult.success);

  const providerId = providerResult.agent?.id;
  const providerApiKey = providerResult.credentials?.apiKey;

  // Check 1.7: Verify agents in Firestore
  const clientInDb = await getAgent(clientId);
  check('1.7 Client persisted in Firestore', !!clientInDb);

  const providerInDb = await getAgent(providerId);
  check('1.8 Provider persisted in Firestore', !!providerInDb);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 2: AUTHENTICATION');
  console.log('═'.repeat(60) + '\n');

  // Check 2.1: Valid API key works
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: clientId,
    apiKey: clientApiKey,
  });
  check('2.1 Valid API key accepted', balanceResult.success);

  // Check 2.2: Invalid API key rejected
  const badKeyResult = await agentTools.agent_balance.handler({
    agentId: clientId,
    apiKey: 'clw_invalid_key_12345',
  });
  check('2.2 Invalid API key rejected', !badKeyResult.success,
    `Error: ${badKeyResult.error}`);

  // Check 2.3: Wrong agent's key rejected
  const wrongKeyResult = await agentTools.agent_balance.handler({
    agentId: clientId,
    apiKey: providerApiKey, // Provider's key for client's balance
  });
  check('2.3 Wrong agent key rejected', !wrongKeyResult.success);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 3: BALANCE SYSTEM');
  console.log('═'.repeat(60) + '\n');

  // Check 3.1: Initial balance is 0
  check('3.1 Initial balance is 0', balanceResult.balance === 0,
    `Balance: $${balanceResult.balance}`);

  // Check 3.2: Admin can credit balance
  const creditResult = await adminTools.admin_credit_balance.handler({
    adminSecret: ADMIN_SECRET,
    agentId: clientId,
    amount: 100,
    notes: 'Verification test credit',
  });
  check('3.2 Admin credit works', creditResult.success,
    `Credited: $${creditResult.credited}, New balance: $${creditResult.newBalance}`);

  // Check 3.3: Balance updated correctly
  const newBalanceResult = await agentTools.agent_balance.handler({
    agentId: clientId,
    apiKey: clientApiKey,
  });
  check('3.3 Balance reflects credit', newBalanceResult.balance === 100,
    `Balance: $${newBalanceResult.balance}`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 4: ESCROW SYSTEM');
  console.log('═'.repeat(60) + '\n');

  // Check 4.1: Create escrow
  const escrowResult = await escrowTools.escrow_create.handler({
    clientAgentId: clientId,
    apiKey: clientApiKey,
    providerAgentId: providerId,
    taskDescription: 'Verification test task',
    amount: 50,
    currency: 'USD',
  });
  check('4.1 Escrow creation', escrowResult.success,
    `Escrow ID: ${escrowResult.escrowId}`);

  const escrowId = escrowResult.escrowId;

  // Check 4.2: 10% fee calculated
  check('4.2 10% fee calculated', escrowResult.escrow?.fee === 5,
    `Fee: $${escrowResult.escrow?.fee} (${escrowResult.escrow?.feeRate * 100}%)`);

  // Check 4.3: Net amount correct
  check('4.3 Net amount = 90% of total', escrowResult.escrow?.netAmount === 45,
    `Net: $${escrowResult.escrow?.netAmount}`);

  // Check 4.4: Client balance deducted
  check('4.4 Client balance deducted', escrowResult.newBalance === 50,
    `New balance: $${escrowResult.newBalance}`);

  // Check 4.5: Escrow status is pending
  const statusResult = await escrowTools.escrow_status.handler({ escrowId });
  check('4.5 Escrow status is pending', statusResult.escrow?.status === 'pending');

  // Check 4.6: Escrow persisted in Firestore
  const escrowInDb = await getEscrow(escrowId);
  check('4.6 Escrow persisted in Firestore', !!escrowInDb);

  // Check 4.7: Provider completes escrow
  const completeResult = await escrowTools.escrow_complete.handler({
    escrowId,
    apiKey: providerApiKey,
    proofOfWork: 'https://github.com/test/verification-complete',
  });
  check('4.7 Provider can complete escrow', completeResult.success);

  // Check 4.8: Provider credited correctly
  const providerBalance = await agentTools.agent_balance.handler({
    agentId: providerId,
    apiKey: providerApiKey,
  });
  check('4.8 Provider credited $45 (after 10% fee)', providerBalance.balance === 45,
    `Provider balance: $${providerBalance.balance}`);

  // Check 4.9: Escrow status is completed
  const completedStatus = await escrowTools.escrow_status.handler({ escrowId });
  check('4.9 Escrow status is completed', completedStatus.escrow?.status === 'completed');

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 5: REPUTATION SYSTEM');
  console.log('═'.repeat(60) + '\n');

  // Check 5.1: Provider stats updated
  const scoreResult = await agentTools.agent_score.handler({ agentId: providerId });
  check('5.1 Tasks completed incremented', scoreResult.agent?.stats?.tasksCompleted === 1,
    `Tasks: ${scoreResult.agent?.stats?.tasksCompleted}`);

  // Check 5.2: Total earned updated
  check('5.2 Total earned updated', scoreResult.agent?.stats?.totalEarned === 45,
    `Earned: $${scoreResult.agent?.stats?.totalEarned}`);

  // Check 5.3: Reputation score calculated
  check('5.3 Reputation score calculated', typeof scoreResult.agent?.reputationScore === 'number',
    `Score: ${scoreResult.agent?.reputationScore}`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 6: DISPUTE FLOW');
  console.log('═'.repeat(60) + '\n');

  // Create another escrow for dispute test
  const escrow2Result = await escrowTools.escrow_create.handler({
    clientAgentId: clientId,
    apiKey: clientApiKey,
    providerAgentId: providerId,
    taskDescription: 'Dispute test task',
    amount: 30,
    currency: 'USD',
  });
  const escrow2Id = escrow2Result.escrowId;
  check('6.1 Second escrow created', escrow2Result.success);

  // Check 6.2: Client can dispute
  const disputeResult = await escrowTools.escrow_dispute.handler({
    escrowId: escrow2Id,
    apiKey: clientApiKey,
    reason: 'Work not delivered',
  });
  check('6.2 Client can dispute escrow', disputeResult.success);

  // Check 6.3: Status is disputed
  const disputedStatus = await escrowTools.escrow_status.handler({ escrowId: escrow2Id });
  check('6.3 Escrow status is disputed', disputedStatus.escrow?.status === 'disputed');

  // Check 6.4: Admin can refund
  const refundResult = await adminTools.admin_refund_escrow.handler({
    adminSecret: ADMIN_SECRET,
    escrowId: escrow2Id,
  });
  check('6.4 Admin can refund disputed escrow', refundResult.success,
    `Client new balance: $${refundResult.clientNewBalance}`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 7: WITHDRAWAL SYSTEM');
  console.log('═'.repeat(60) + '\n');

  // Check 7.1: Provider can request withdrawal
  const withdrawResult = await agentTools.withdraw_request.handler({
    agentId: providerId,
    apiKey: providerApiKey,
    amount: 20,
    currency: 'USD',
    paymentMethod: 'PayPal: test@example.com',
  });
  check('7.1 Withdrawal request created', withdrawResult.success,
    `Withdrawal ID: ${withdrawResult.withdrawal?.id}`);

  // Check 7.2: Balance held
  const afterWithdraw = await agentTools.agent_balance.handler({
    agentId: providerId,
    apiKey: providerApiKey,
  });
  check('7.2 Balance reduced by withdrawal amount', afterWithdraw.balance === 25,
    `Balance: $${afterWithdraw.balance}`);

  // Check 7.3: Admin can list withdrawals
  const listResult = await adminTools.admin_list_withdrawals.handler({
    adminSecret: ADMIN_SECRET,
    status: 'pending',
  });
  check('7.3 Admin can list pending withdrawals', listResult.success && listResult.count > 0,
    `Pending: ${listResult.count}`);

  // Check 7.4: Admin can process withdrawal
  const processResult = await adminTools.admin_process_withdrawal.handler({
    adminSecret: ADMIN_SECRET,
    withdrawalId: withdrawResult.withdrawal?.id,
    action: 'complete',
    notes: 'Verification test completed',
  });
  check('7.4 Admin can complete withdrawal', processResult.success);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 8: PAYMENT PROVIDERS');
  console.log('═'.repeat(60) + '\n');

  // Check 8.1: Payment config
  const paymentConfig = await paymentTools.payment_config.handler({});
  check('8.1 Payment config available', paymentConfig.success);
  check('8.2 USDC (x402) configured', paymentConfig.paymentMethods?.usdc?.configured);
  check('8.3 BTC (Cashu) configured', paymentConfig.paymentMethods?.btc?.configured);

  // Check 8.4: Cashu can create invoice
  const cashuDeposit = await cashuService.createDeposit({
    amount: 100,
    agentId: 'test',
    description: 'Verification test',
  });
  check('8.4 Cashu creates Lightning invoice', cashuDeposit.success,
    `Invoice: ${cashuDeposit.quote?.bolt11?.slice(0, 30)}...`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 9: NOSTR IDENTITY (NIP-05)');
  console.log('═'.repeat(60) + '\n');

  // Check 9.1: Generate nostr.json
  const nostrResult = await adminTools.admin_nostr_json.handler({
    adminSecret: ADMIN_SECRET,
  });
  check('9.1 nostr.json generation works', nostrResult.success,
    `Agents: ${nostrResult.agentCount}`);

  // Check 9.2: Our test agents are included
  const hasClient = nostrResult.nostrJson?.names?.[`client-${testId}`];
  const hasProvider = nostrResult.nostrJson?.names?.[`provider-${testId}`];
  check('9.2 Test agents in nostr.json', !!hasClient && !!hasProvider);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(60) + '\n');

  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const total = checks.length;

  console.log(`Total checks: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('');

  if (failed === 0) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 ALL CHECKS PASSED - BUSINESS MODEL VERIFIED!           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } else {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  SOME CHECKS FAILED - REVIEW ISSUES ABOVE              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\nFailed checks:');
    checks.filter(c => c.status === 'FAIL').forEach(c => {
      console.log(`  ❌ ${c.name}`);
      if (c.details) console.log(`     ${c.details}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
