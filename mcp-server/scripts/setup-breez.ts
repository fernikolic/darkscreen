#!/usr/bin/env npx tsx
/**
 * Setup Breez Spark Integration
 *
 * This script:
 * 1. Checks if Breez API key is configured
 * 2. Creates a test wallet
 * 3. Gets a Spark address for receiving payments
 */

import 'dotenv/config';
import { breezSparkService } from '../src/services/payments/breez-spark.js';

async function main() {
  console.log('🔧 Setting up Breez Spark Integration\n');

  // Check configuration
  console.log('1. Checking configuration...');
  if (!breezSparkService.config.configured) {
    console.log('❌ BREEZ_API_KEY not configured');
    console.log('\nTo get a Breez API key:');
    console.log('1. Go to https://breez.technology/sdk/');
    console.log('2. Sign up for API access');
    console.log('3. Add to .env: BREEZ_API_KEY=your_key_here');
    console.log('\nAlternatively, add to your shell:');
    console.log('export BREEZ_API_KEY=your_key_here');
    return;
  }
  console.log('✅ BREEZ_API_KEY configured');

  // Create a test wallet
  const testAgentId = 'breez-test-agent';
  console.log(`\n2. Creating test wallet for ${testAgentId}...`);

  if (breezSparkService.hasWallet(testAgentId)) {
    console.log('   Wallet already exists');
  } else {
    const walletResult = await breezSparkService.createWallet(testAgentId);
    if (walletResult.success) {
      console.log('✅ Wallet created');
      console.log(`   ⚠️  SAVE THIS MNEMONIC: ${walletResult.mnemonic}`);
    } else {
      console.log(`❌ Failed: ${walletResult.error}`);
      return;
    }
  }

  // Connect and get info
  console.log('\n3. Connecting wallet...');
  const connection = await breezSparkService.connectWallet(testAgentId);
  if (!connection.success) {
    console.log(`❌ Failed to connect: ${connection.error}`);
    return;
  }
  console.log('✅ Connected');

  // Get balance
  console.log('\n4. Getting balance...');
  const balance = await breezSparkService.getBalance(testAgentId);
  if (balance.success) {
    console.log(`   Balance: ${balance.balanceSats} sats (~$${balance.balanceUsd?.toFixed(2)})`);
  }

  // Get Spark address
  console.log('\n5. Getting Spark address...');
  const sparkResult = await breezSparkService.receivePayment(testAgentId, 'spark');
  if (sparkResult.success) {
    console.log(`✅ Spark address: ${sparkResult.address}`);
    console.log('\n   Use this address to receive payments!');
  } else {
    console.log(`❌ Failed: ${sparkResult.error}`);
  }

  // Create a Lightning invoice for $1
  console.log('\n6. Creating $1 Lightning invoice...');
  const invoiceResult = await breezSparkService.receivePayment(
    testAgentId,
    'lightning',
    1030, // ~$1 in sats
    'Test deposit'
  );
  if (invoiceResult.success) {
    console.log('✅ Invoice created:');
    console.log(`   ${invoiceResult.invoice}`);
  } else {
    console.log(`❌ Failed: ${invoiceResult.error}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Breez Spark integration ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
