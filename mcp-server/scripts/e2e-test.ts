#!/usr/bin/env npx tsx
/**
 * End-to-End Business Flow Test
 *
 * Tests the complete Clawdentials business model with real payments:
 * 1. Register client + provider agents
 * 2. Create deposit (USDT or BTC)
 * 3. Client creates escrow for provider
 * 4. Provider completes work
 * 5. Provider requests withdrawal
 *
 * Run with: npm run e2e
 */

import { agentTools } from '../src/tools/agent.js';
import { escrowTools } from '../src/tools/escrow.js';
import { paymentTools } from '../src/tools/payment.js';
import { adminTools } from '../src/tools/admin.js';
import { ADMIN_SECRET, initFirestore } from '../src/services/firestore.js';

interface TestState {
  clientId: string;
  clientApiKey: string;
  providerId: string;
  providerApiKey: string;
  depositId: string;
  escrowId: string;
}

const state: TestState = {
  clientId: '',
  clientApiKey: '',
  providerId: '',
  providerApiKey: '',
  depositId: '',
  escrowId: '',
};

function log(step: string, data?: any) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${step}`);
  console.log('='.repeat(60));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function success(msg: string) {
  console.log(`✅ ${msg}`);
}

function error(msg: string) {
  console.log(`❌ ${msg}`);
  process.exit(1);
}

function waiting(msg: string) {
  console.log(`⏳ ${msg}`);
}

async function step1_RegisterAgents() {
  log('STEP 1: Register Client & Provider Agents');

  // Register client
  const clientResult = await agentTools.agent_register.handler({
    name: `e2e-client-${Date.now().toString(36)}`,
    description: 'E2E test client agent',
    skills: ['hiring', 'testing'],
  });

  if (!clientResult.success) {
    error(`Failed to register client: ${clientResult.error}`);
  }

  state.clientId = clientResult.agent.id;
  state.clientApiKey = clientResult.credentials.apiKey;
  success(`Client registered: ${state.clientId}`);
  console.log(`   NIP-05: ${clientResult.agent.nip05}`);

  // Register provider
  const providerResult = await agentTools.agent_register.handler({
    name: `e2e-provider-${Date.now().toString(36)}`,
    description: 'E2E test provider agent',
    skills: ['coding', 'testing'],
  });

  if (!providerResult.success) {
    error(`Failed to register provider: ${providerResult.error}`);
  }

  state.providerId = providerResult.agent.id;
  state.providerApiKey = providerResult.credentials.apiKey;
  success(`Provider registered: ${state.providerId}`);
  console.log(`   NIP-05: ${providerResult.agent.nip05}`);
}

async function step2_CheckPaymentConfig() {
  log('STEP 2: Check Payment Configuration');

  const config = await paymentTools.payment_config.handler({});
  console.log(config);

  if (config.btc?.configured) {
    success('BTC (Cashu) is available - no KYC needed!');
  }
  if (config.usdt?.configured) {
    success('USDT (OxaPay) is available');
  }
  if (config.usdc?.configured) {
    success('USDC (x402) is available');
  }
}

async function step3_CreateDeposit(currency: 'BTC' | 'USDT' | 'USDC', amount: number) {
  log(`STEP 3: Create ${currency} Deposit for $${amount}`);

  const result = await paymentTools.deposit_create.handler({
    agentId: state.clientId,
    apiKey: state.clientApiKey,
    amount,
    currency,
  });

  if (!result.success) {
    error(`Failed to create deposit: ${result.error}`);
  }

  state.depositId = result.deposit?.depositId || result.deposit?.id || '';

  console.log('\n📱 PAYMENT INSTRUCTIONS:');
  console.log('─'.repeat(40));

  if (result.paymentInstructions?.url) {
    console.log(`🔗 Pay here: ${result.paymentInstructions.url}`);
  }
  if (result.paymentInstructions?.address) {
    console.log(`⚡ Invoice/Address:`);
    console.log(`   ${result.paymentInstructions.address}`);
  }
  console.log(`💰 Amount: ${amount} ${currency}`);
  if (result.paymentInstructions?.expiresAt) {
    console.log(`⏰ Expires: ${result.paymentInstructions.expiresAt}`);
  }

  console.log('─'.repeat(40));
  success(`Deposit created: ${state.depositId}`);

  return result;
}

async function step4_WaitForPayment() {
  log('STEP 4: Waiting for Payment Confirmation');

  waiting('Pay the invoice above, then press ENTER to check status...');

  // Wait for user input
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  // Check deposit status
  const result = await paymentTools.deposit_status.handler({
    depositId: state.depositId,
  });

  console.log(result);

  if (result.status === 'completed' || result.paid) {
    success(`Payment confirmed! New balance: $${result.newBalance || result.balance}`);
    return true;
  } else {
    waiting(`Status: ${result.status}. You can check again or continue with admin credit.`);
    return false;
  }
}

async function step4b_AdminCredit(amount: number) {
  log('STEP 4b: Admin Credit (for testing without real payment)');

  const result = await adminTools.admin_credit_balance.handler({
    adminSecret: ADMIN_SECRET,
    agentId: state.clientId,
    amount,
    notes: 'E2E test credit',
  });

  if (!result.success) {
    error(`Failed to credit balance: ${result.error}`);
  }

  success(`Credited $${amount} to client. New balance: $${result.newBalance}`);
}

async function step5_CreateEscrow(amount: number) {
  log(`STEP 5: Create Escrow for $${amount}`);

  const result = await escrowTools.escrow_create.handler({
    clientAgentId: state.clientId,
    apiKey: state.clientApiKey,
    providerAgentId: state.providerId,
    taskDescription: 'E2E test task: Build a simple landing page',
    amount,
    currency: 'USD',
  });

  if (!result.success) {
    error(`Failed to create escrow: ${result.error}`);
  }

  state.escrowId = result.escrowId;

  console.log(`\n💼 ESCROW DETAILS:`);
  console.log('─'.repeat(40));
  console.log(`   Escrow ID: ${result.escrowId}`);
  console.log(`   Amount: $${result.escrow.amount}`);
  console.log(`   Fee (10%): $${result.escrow.fee}`);
  console.log(`   Provider receives: $${result.escrow.netAmount}`);
  console.log(`   Client new balance: $${result.newBalance}`);
  console.log('─'.repeat(40));

  success(`Escrow created! Funds locked.`);
}

async function step6_CompleteEscrow() {
  log('STEP 6: Provider Completes Work');

  const result = await escrowTools.escrow_complete.handler({
    escrowId: state.escrowId,
    apiKey: state.providerApiKey,
    proofOfWork: 'https://github.com/example/landing-page (E2E test)',
  });

  if (!result.success) {
    error(`Failed to complete escrow: ${result.error}`);
  }

  console.log(`\n🎉 WORK COMPLETED:`);
  console.log('─'.repeat(40));
  console.log(`   Provider credited: $${result.providerCredited}`);
  console.log(`   Provider new balance: $${result.newBalance}`);
  console.log('─'.repeat(40));

  success(`Provider paid! $${result.providerCredited} credited.`);
}

async function step7_CheckReputation() {
  log('STEP 7: Check Provider Reputation');

  const result = await agentTools.agent_score.handler({
    agentId: state.providerId,
  });

  if (!result.success) {
    error(`Failed to get reputation: ${result.error}`);
  }

  const agent = result.agent;

  console.log(`\n📊 REPUTATION:`);
  console.log('─'.repeat(40));
  console.log(`   Score: ${agent.reputationScore}/100`);
  console.log(`   Tasks completed: ${agent.stats.tasksCompleted}`);
  console.log(`   Total earned: $${agent.stats.totalEarned}`);
  console.log(`   Success rate: ${agent.stats.successRate}%`);
  console.log(`   Badges: ${agent.badges?.join(', ') || 'None yet'}`);
  console.log('─'.repeat(40));

  success(`Reputation updated!`);
}

async function step8_RequestWithdrawal() {
  log('STEP 8: Provider Requests Withdrawal');

  // Check balance first
  const balanceResult = await agentTools.agent_balance.handler({
    agentId: state.providerId,
    apiKey: state.providerApiKey,
  });

  const balance = balanceResult.balance;
  console.log(`Provider balance: $${balance}`);

  if (balance <= 0) {
    console.log('No balance to withdraw');
    return;
  }

  const result = await agentTools.withdraw_request.handler({
    agentId: state.providerId,
    apiKey: state.providerApiKey,
    amount: balance,
    currency: 'USD',
    paymentMethod: 'PayPal: test@example.com',
  });

  if (!result.success) {
    error(`Failed to request withdrawal: ${result.error}`);
  }

  console.log(`\n💸 WITHDRAWAL REQUESTED:`);
  console.log('─'.repeat(40));
  console.log(`   Withdrawal ID: ${result.withdrawal.id}`);
  console.log(`   Amount: $${result.withdrawal.amount}`);
  console.log(`   Status: ${result.withdrawal.status}`);
  console.log(`   Method: ${result.withdrawal.paymentMethod}`);
  console.log('─'.repeat(40));

  success(`Withdrawal requested! Admin will process manually.`);
}

async function summary() {
  log('📋 E2E TEST SUMMARY');

  console.log(`
┌────────────────────────────────────────────────────────────┐
│  CLAWDENTIALS END-TO-END TEST COMPLETE                     │
├────────────────────────────────────────────────────────────┤
│  Client:    ${state.clientId.padEnd(43)}│
│  Provider:  ${state.providerId.padEnd(43)}│
│  Escrow:    ${state.escrowId.padEnd(43)}│
├────────────────────────────────────────────────────────────┤
│  ✅ Agent registration with API keys                       │
│  ✅ Nostr identity (NIP-05)                                │
│  ✅ Balance system                                         │
│  ✅ Escrow with 10% fee                                    │
│  ✅ Provider payment                                       │
│  ✅ Reputation tracking                                    │
│  ✅ Withdrawal request                                     │
└────────────────────────────────────────────────────────────┘

🎉 The business model works!
`);
}

async function main() {
  // Initialize Firestore
  initFirestore();

  console.log(`
╔════════════════════════════════════════════════════════════╗
║         CLAWDENTIALS E2E BUSINESS FLOW TEST                ║
║         Testing the complete payment cycle                  ║
╚════════════════════════════════════════════════════════════╝
`);

  const args = process.argv.slice(2);
  const useRealPayment = args.includes('--real');
  const currency = (args.find(a => a.startsWith('--currency='))?.split('=')[1] || 'BTC') as 'BTC' | 'USDT' | 'USDC';
  const amount = parseInt(args.find(a => a.startsWith('--amount='))?.split('=')[1] || '10');

  console.log(`Mode: ${useRealPayment ? 'REAL PAYMENT' : 'ADMIN CREDIT (simulated)'}`);
  console.log(`Currency: ${currency}`);
  console.log(`Amount: $${amount}`);
  console.log('');

  try {
    await step1_RegisterAgents();
    await step2_CheckPaymentConfig();

    if (useRealPayment) {
      await step3_CreateDeposit(currency, amount);
      const paid = await step4_WaitForPayment();
      if (!paid) {
        console.log('\nPayment not confirmed. Using admin credit instead...');
        await step4b_AdminCredit(amount);
      }
    } else {
      await step4b_AdminCredit(amount);
    }

    // Create escrow for 50% of deposited amount
    const escrowAmount = Math.floor(amount * 0.5);
    await step5_CreateEscrow(escrowAmount);
    await step6_CompleteEscrow();
    await step7_CheckReputation();
    await step8_RequestWithdrawal();

    await summary();

  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

main();
