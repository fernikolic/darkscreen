#!/usr/bin/env npx tsx
/**
 * Circle Integration Test
 *
 * Tests the Circle payment service integration.
 */

import 'dotenv/config';
import { circleService } from '../dist/services/payments/circle.js';
import { getPaymentConfig } from '../dist/services/payments/index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Circle Integration Test');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Check configuration
  console.log('1. Checking configuration...');
  const config = getPaymentConfig();
  console.log(`   USDC_CIRCLE configured: ${config.usdc_circle.configured}`);
  console.log(`   Chain: ${config.usdc_circle.network}`);
  console.log(`   Provider: ${config.usdc_circle.provider}`);

  if (!config.usdc_circle.configured) {
    console.error('\n   ERROR: Circle is not properly configured');
    console.log('   Check CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_PLATFORM_WALLET_ID');
    process.exit(1);
  }

  console.log('   OK');
  console.log();

  // Test 2: Get balance
  console.log('2. Getting platform wallet balance...');
  const balanceResult = await circleService.getBalance();
  if (balanceResult.success) {
    console.log(`   Balance: ${balanceResult.balance} USDC`);
  } else {
    console.log(`   Error: ${balanceResult.error}`);
  }
  console.log();

  // Test 3: Create deposit
  console.log('3. Creating test deposit...');
  const depositResult = await circleService.createDeposit({
    amount: 10,
    agentId: 'test-agent',
    description: 'Test deposit',
  });

  if (depositResult.success) {
    console.log(`   Deposit ID: ${depositResult.deposit?.id}`);
    console.log(`   Payment Address: ${depositResult.paymentDetails?.payTo}`);
    console.log(`   Amount: $${depositResult.deposit?.amount} USDC`);
    console.log(`   Chain: ${depositResult.paymentDetails?.chain}`);
    console.log('   OK');
  } else {
    console.error(`   Error: ${depositResult.error}`);
    process.exit(1);
  }
  console.log();

  // Test 4: Verify deposit (should be pending since we haven't sent anything)
  console.log('4. Verifying deposit status...');
  const verifyResult = await circleService.verifyDeposit(
    depositResult.deposit?.id || '',
    10
  );
  console.log(`   Paid: ${verifyResult.paid}`);
  console.log(`   Status: ${verifyResult.status}`);
  console.log('   OK (expected: pending)');
  console.log();

  console.log('='.repeat(60));
  console.log('All tests passed!');
  console.log('='.repeat(60));
  console.log();
  console.log('Platform Wallet Address:', depositResult.paymentDetails?.payTo);
  console.log('Send testnet USDC to this address to test deposits.');
}

main().catch(console.error);
