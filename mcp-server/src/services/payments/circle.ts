/**
 * Circle Developer-Controlled Wallets Payment Service
 *
 * Gas-free USDC payments via Circle's programmable wallets.
 * Uses Circle Gas Station to cover transaction fees.
 *
 * Docs: https://developers.circle.com/w3s/developer-controlled-wallets
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import type { Wallet, Balance, Transaction } from '@circle-fin/developer-controlled-wallets';
import type { Deposit } from '../../types/index.js';

// Configuration from environment
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || '';
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || '';
const CIRCLE_ENV = (process.env.CIRCLE_ENV || 'sandbox') as 'sandbox' | 'production';
const CIRCLE_PLATFORM_WALLET_ID = process.env.CIRCLE_PLATFORM_WALLET_ID || '';
const CIRCLE_DEFAULT_CHAIN = process.env.CIRCLE_DEFAULT_CHAIN || 'BASE-SEPOLIA';

// Chain to USDC token ID mapping
const USDC_TOKEN_IDS: Record<string, string> = {
  // Testnets
  'BASE-SEPOLIA': 'bdf128b4-827b-5267-8f9e-243694989b5f',
  'ARC-TESTNET': '15dc2b5d-0994-58b0-bf8c-3a0501148ee8',
  'ETH-SEPOLIA': '5797fbd6-3795-519d-84ca-ec4c5f80c3b1',
  'ARB-SEPOLIA': '4b8daacc-5f47-5909-a3ba-30d171ebad98',
  // Mainnets
  'BASE': 'aa7bb533-aeb8-535c-bd65-354aed91ea3d',
  'ETH': 'b037d751-fb22-5f0d-bae6-47373e7ae3e3',
  'ARB': 'c87ffcb4-e2cf-5e67-84c6-388c965d2a66',
  'MATIC': 'db6905b9-8bcd-5537-8b08-f5548bdf7925',
};

// Initialize client lazily
let circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

function getClient() {
  if (!circleClient && CIRCLE_API_KEY && CIRCLE_ENTITY_SECRET) {
    circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: CIRCLE_API_KEY,
      entitySecret: CIRCLE_ENTITY_SECRET,
    });
  }
  return circleClient;
}

function getUSDCTokenId(chain: string = CIRCLE_DEFAULT_CHAIN): string {
  return USDC_TOKEN_IDS[chain] || USDC_TOKEN_IDS['BASE-SEPOLIA'];
}

// Cached platform wallet address
let platformWalletAddress: string | null = null;

/**
 * Get the platform wallet address for deposits
 */
async function getPlatformWalletAddress(): Promise<string | null> {
  if (platformWalletAddress) return platformWalletAddress;

  const client = getClient();
  if (!client || !CIRCLE_PLATFORM_WALLET_ID) return null;

  try {
    const response = await client.getWallet({ id: CIRCLE_PLATFORM_WALLET_ID });
    const wallet = response.data?.wallet;
    if (wallet?.address) {
      platformWalletAddress = wallet.address;
      return platformWalletAddress;
    }
  } catch (error) {
    console.error('[Circle] Failed to get platform wallet:', error);
  }

  return null;
}

export interface CircleDepositRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
}

export interface CircleDepositResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  paymentDetails?: {
    payTo: string;
    amount: string;
    chain: string;
    tokenId: string;
  };
  error?: string;
}

/**
 * Create a deposit request for USDC via Circle
 *
 * Returns the platform wallet address for the agent to send USDC to.
 * Circle Gas Station covers the gas fees.
 */
export async function createCircleDeposit(request: CircleDepositRequest): Promise<CircleDepositResponse> {
  const walletAddress = await getPlatformWalletAddress();

  if (!walletAddress) {
    return {
      success: false,
      error: 'Circle wallet not configured. Set CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, and CIRCLE_PLATFORM_WALLET_ID.',
    };
  }

  // USDC has 6 decimals
  const amountRaw = (request.amount * 1e6).toFixed(0);

  const depositId = `circle_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const chain = CIRCLE_DEFAULT_CHAIN;
  const network = chain.includes('BASE') ? 'base' : chain.toLowerCase();

  return {
    success: true,
    deposit: {
      id: depositId,
      agentId: request.agentId,
      amount: request.amount,
      currency: 'USDC',
      network: network as any,
      status: 'pending',
      provider: 'circle',
      externalId: depositId,
      paymentAddress: walletAddress,
      paymentUrl: null,
      createdAt: new Date(),
      expiresAt,
      completedAt: null,
      txHash: null,
    },
    paymentDetails: {
      payTo: walletAddress,
      amount: amountRaw,
      chain: chain,
      tokenId: getUSDCTokenId(chain),
    },
  };
}

/**
 * Verify a deposit by checking for incoming transactions
 *
 * Checks the platform wallet for recent USDC transfers matching the expected amount.
 */
export async function verifyCircleDeposit(
  externalId: string,
  expectedAmount: number
): Promise<{
  paid: boolean;
  status: string;
  txHash?: string;
  fromAddress?: string;
}> {
  const client = getClient();
  if (!client || !CIRCLE_PLATFORM_WALLET_ID) {
    return { paid: false, status: 'pending' };
  }

  try {
    // List recent transactions for the platform wallet
    const response = await client.listTransactions({
      walletIds: [CIRCLE_PLATFORM_WALLET_ID],
      pageSize: 50,
    });

    const transactions = response.data?.transactions || [];

    // Look for incoming USDC transactions matching the amount
    // Allow small variance for gas/fee differences
    const expectedRaw = expectedAmount * 1e6;
    const tolerance = 0.01 * 1e6; // 1 cent tolerance

    for (const tx of transactions) {
      // Only check completed incoming transfers
      if (tx.state !== 'COMPLETE' && tx.state !== 'CONFIRMED') continue;
      if (tx.transactionType !== 'INBOUND') continue;

      // Check amount matches (within tolerance)
      const txAmount = parseFloat(tx.amounts?.[0] || '0') * 1e6;
      if (Math.abs(txAmount - expectedRaw) <= tolerance) {
        return {
          paid: true,
          status: 'completed',
          txHash: tx.txHash || undefined,
          fromAddress: tx.sourceAddress || undefined,
        };
      }
    }

    return { paid: false, status: 'pending' };
  } catch (error) {
    console.error('[Circle] Verification error:', error);
    return { paid: false, status: 'pending' };
  }
}

/**
 * Send USDC withdrawal from platform wallet
 *
 * Uses Circle Gas Station - no gas fees for the sender.
 */
export async function sendCircleWithdrawal(
  toAddress: string,
  amount: number
): Promise<{
  success: boolean;
  transactionId?: string;
  txHash?: string;
  error?: string;
}> {
  const client = getClient();
  if (!client || !CIRCLE_PLATFORM_WALLET_ID) {
    return {
      success: false,
      error: 'Circle wallet not configured.',
    };
  }

  // Validate Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
    return {
      success: false,
      error: 'Invalid Ethereum address format.',
    };
  }

  const chain = CIRCLE_DEFAULT_CHAIN;
  const tokenId = getUSDCTokenId(chain);

  try {
    // Create the transaction
    const response = await client.createTransaction({
      walletId: CIRCLE_PLATFORM_WALLET_ID,
      tokenId,
      destinationAddress: toAddress,
      amount: [amount.toString()],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    });

    const transactionId = response.data?.id;
    if (!transactionId) {
      return {
        success: false,
        error: 'Transaction creation failed - no ID returned.',
      };
    }

    // Wait for transaction to complete
    const result = await waitForTransaction(transactionId);

    if (result.success) {
      return {
        success: true,
        transactionId,
        txHash: result.txHash,
      };
    } else {
      return {
        success: false,
        transactionId,
        error: result.error || 'Transaction failed',
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Circle withdrawal failed: ${message}`,
    };
  }
}

/**
 * Wait for a transaction to complete or fail
 */
async function waitForTransaction(
  transactionId: string,
  maxWaitMs: number = 120000
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Circle client not initialized' };
  }

  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await client.getTransaction({ id: transactionId });
      const tx = response.data?.transaction;

      if (!tx) {
        await sleep(pollInterval);
        continue;
      }

      if (tx.state === 'COMPLETE' || tx.state === 'CONFIRMED') {
        return { success: true, txHash: tx.txHash };
      }

      if (tx.state === 'FAILED' || tx.state === 'DENIED') {
        return { success: false, error: tx.errorReason || 'Transaction failed' };
      }

      await sleep(pollInterval);
    } catch {
      await sleep(pollInterval);
    }
  }

  return { success: false, error: 'Transaction timeout' };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get USDC balance of the platform wallet
 */
export async function getCircleBalance(): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> {
  const client = getClient();
  if (!client || !CIRCLE_PLATFORM_WALLET_ID) {
    return {
      success: false,
      error: 'Circle wallet not configured.',
    };
  }

  try {
    const response = await client.getWalletTokenBalance({ id: CIRCLE_PLATFORM_WALLET_ID });
    const balances = response.data?.tokenBalances || [];

    // Find USDC balance
    const usdcBalance = balances.find(
      (b: Balance) =>
        b.token.symbol === 'USDC' ||
        b.token.symbol === 'USDC-TESTNET' ||
        (b.token.name && b.token.name.includes('USDC'))
    );

    return {
      success: true,
      balance: usdcBalance ? parseFloat(usdcBalance.amount) : 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to get balance: ${message}`,
    };
  }
}

/**
 * Check if Circle is properly configured
 */
function isConfigured(): boolean {
  return !!(CIRCLE_API_KEY && CIRCLE_ENTITY_SECRET && CIRCLE_PLATFORM_WALLET_ID);
}

// Export service object matching the pattern of other payment services
export const circleService = {
  createDeposit: createCircleDeposit,
  verifyDeposit: verifyCircleDeposit,
  sendWithdrawal: sendCircleWithdrawal,
  getBalance: getCircleBalance,
  config: {
    configured: isConfigured(),
    env: CIRCLE_ENV,
    chain: CIRCLE_DEFAULT_CHAIN,
    platformWalletId: CIRCLE_PLATFORM_WALLET_ID || null,
  },
};
