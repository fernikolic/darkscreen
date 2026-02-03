#!/usr/bin/env npx tsx
/**
 * Circle Platform Wallet Setup Script
 *
 * One-time setup to create the Clawdentials platform wallet for USDC escrow operations.
 *
 * Prerequisites:
 * 1. Circle API key from https://console.circle.com
 * 2. Entity secret generated and registered (see circle-wallet skill)
 *
 * Usage:
 *   npx tsx scripts/setup-circle.ts
 *
 * The script will:
 * 1. Create a wallet set named "Clawdentials Platform"
 * 2. Create an SCA wallet on the configured chain (default: BASE-SEPOLIA)
 * 3. Output the wallet ID and address for .env configuration
 */

import 'dotenv/config';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import type { Blockchain } from '@circle-fin/developer-controlled-wallets';

// Configuration
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
const CIRCLE_DEFAULT_CHAIN = (process.env.CIRCLE_DEFAULT_CHAIN || 'BASE-SEPOLIA') as Blockchain;

async function main() {
  console.log('='.repeat(60));
  console.log('Clawdentials - Circle Platform Wallet Setup');
  console.log('='.repeat(60));
  console.log();

  // Validate configuration
  if (!CIRCLE_API_KEY) {
    console.error('Error: CIRCLE_API_KEY not set in environment');
    console.log('\nTo get started:');
    console.log('1. Sign up at https://console.circle.com');
    console.log('2. Create a new API key');
    console.log('3. Add to .env: CIRCLE_API_KEY=your_key');
    process.exit(1);
  }

  if (!CIRCLE_ENTITY_SECRET) {
    console.error('Error: CIRCLE_ENTITY_SECRET not set in environment');
    console.log('\nTo create and register an entity secret:');
    console.log('1. Use the circle-wallet skill: claude "circle-wallet setup"');
    console.log('2. Or generate manually with crypto.randomBytes(32).toString("hex")');
    console.log('3. Register via Circle SDK registerEntitySecretCiphertext()');
    console.log('4. Add to .env: CIRCLE_ENTITY_SECRET=your_secret');
    process.exit(1);
  }

  console.log(`Chain: ${CIRCLE_DEFAULT_CHAIN}`);
  console.log(`Environment: ${CIRCLE_API_KEY.startsWith('TEST') ? 'sandbox' : 'production'}`);
  console.log();

  // Initialize client
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: CIRCLE_API_KEY,
    entitySecret: CIRCLE_ENTITY_SECRET,
  });

  try {
    // Step 1: Check for existing wallet set
    console.log('Checking for existing wallet sets...');
    const setsResponse = await client.listWalletSets({});
    const existingSet = setsResponse.data?.walletSets?.find(
      (s: any) => s.name === 'Clawdentials Platform'
    );

    let walletSetId: string;

    if (existingSet) {
      console.log(`Found existing wallet set: ${existingSet.id}`);
      walletSetId = existingSet.id;
    } else {
      // Create new wallet set
      console.log('Creating wallet set "Clawdentials Platform"...');
      const setResponse = await client.createWalletSet({
        name: 'Clawdentials Platform',
      });

      if (!setResponse.data?.walletSet?.id) {
        throw new Error('Failed to create wallet set');
      }

      walletSetId = setResponse.data.walletSet.id;
      console.log(`Created wallet set: ${walletSetId}`);
    }

    // Step 2: Check for existing wallets
    console.log('\nChecking for existing wallets...');
    const walletsResponse = await client.listWallets({});
    const existingWallet = walletsResponse.data?.wallets?.find(
      (w: any) =>
        w.walletSetId === walletSetId && w.blockchain === CIRCLE_DEFAULT_CHAIN
    );

    if (existingWallet) {
      console.log('\n' + '='.repeat(60));
      console.log('Platform wallet already exists!');
      console.log('='.repeat(60));
      console.log(`\nWallet ID: ${existingWallet.id}`);
      console.log(`Address: ${existingWallet.address}`);
      console.log(`Chain: ${existingWallet.blockchain}`);
      console.log(`Account Type: ${existingWallet.accountType}`);

      console.log('\nAdd to your .env file:');
      console.log('─'.repeat(40));
      console.log(`CIRCLE_PLATFORM_WALLET_ID=${existingWallet.id}`);
      console.log('─'.repeat(40));

      return;
    }

    // Step 3: Create platform wallet
    console.log(`\nCreating SCA wallet on ${CIRCLE_DEFAULT_CHAIN}...`);
    const walletResponse = await client.createWallets({
      walletSetId,
      blockchains: [CIRCLE_DEFAULT_CHAIN],
      count: 1,
      accountType: 'SCA', // Smart Contract Account for gas sponsorship
    });

    if (!walletResponse.data?.wallets || walletResponse.data.wallets.length === 0) {
      throw new Error('Failed to create wallet');
    }

    const wallet = walletResponse.data.wallets[0];

    console.log('\n' + '='.repeat(60));
    console.log('Platform Wallet Created Successfully!');
    console.log('='.repeat(60));
    console.log(`\nWallet ID: ${wallet.id}`);
    console.log(`Address: ${wallet.address}`);
    console.log(`Chain: ${wallet.blockchain}`);
    console.log(`Account Type: ${wallet.accountType}`);
    console.log(`Custody: ${wallet.custodyType}`);

    console.log('\n' + '='.repeat(60));
    console.log('Add these to your .env file:');
    console.log('='.repeat(60));
    console.log(`CIRCLE_PLATFORM_WALLET_ID=${wallet.id}`);
    console.log();

    // Request testnet tokens if on testnet
    if (CIRCLE_DEFAULT_CHAIN.includes('SEPOLIA') || CIRCLE_DEFAULT_CHAIN.includes('TESTNET')) {
      console.log('Requesting testnet USDC...');
      try {
        await client.requestTestnetTokens({
          address: wallet.address!,
          blockchain: CIRCLE_DEFAULT_CHAIN,
          usdc: true,
        });
        console.log('Testnet USDC requested! (may take a few minutes to arrive)');
      } catch (error) {
        console.log('Note: Could not request testnet tokens. Use Circle faucet manually.');
      }
    }

    console.log('\nNext steps:');
    console.log('1. Add CIRCLE_PLATFORM_WALLET_ID to your .env file');
    console.log('2. Fund the wallet with USDC (use testnet faucet or transfer)');
    console.log('3. Test with: deposit_create currency="USDC_CIRCLE"');

  } catch (error) {
    console.error('\nSetup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
