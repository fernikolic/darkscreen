/**
 * Breez SDK Payment Service - Bitcoin on Lightning (Nodeless/Liquid)
 *
 * Uses Breez SDK Liquid for self-custodial Lightning payments.
 * Docs: https://sdk-doc-liquid.breez.technology/
 * Fee: Network fees only (no platform fee)
 *
 * Requirements:
 * - Node.js v22+
 * - Breez API key (free, request at https://breez.technology/sdk/)
 * - 12-word mnemonic for self-custody
 */

import type { Deposit } from '../../types/index.js';

// Configuration
const BREEZ_API_KEY = process.env.BREEZ_API_KEY || '';
const BREEZ_MNEMONIC = process.env.BREEZ_MNEMONIC || '';
const BREEZ_WORKING_DIR = process.env.BREEZ_WORKING_DIR || './breez-data';
const BREEZ_NETWORK = process.env.BREEZ_NETWORK || 'mainnet'; // 'mainnet' or 'testnet'

// Exchange rate (sats per USD) - in production, fetch from API
const SATS_PER_USD = parseInt(process.env.BREEZ_SATS_PER_USD || '1000', 10);

// SDK instance (lazy loaded)
let sdkInstance: any = null;
let sdkInitPromise: Promise<any> | null = null;

export interface BreezPaymentRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
}

export interface BreezPaymentResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  invoice?: {
    bolt11: string;
    amountSats: number;
    expiresAt: Date;
  };
  error?: string;
}

/**
 * Convert USD to sats
 */
function usdToSats(usd: number): number {
  return Math.floor(usd * SATS_PER_USD);
}

/**
 * Convert sats to USD
 */
function satsToUsd(sats: number): number {
  return sats / SATS_PER_USD;
}

/**
 * Initialize and connect to Breez SDK
 */
async function getSDK(): Promise<any> {
  if (sdkInstance) {
    return sdkInstance;
  }

  if (sdkInitPromise) {
    return sdkInitPromise;
  }

  if (!BREEZ_API_KEY) {
    throw new Error('BREEZ_API_KEY not configured. Request one at https://breez.technology/sdk/');
  }

  if (!BREEZ_MNEMONIC) {
    throw new Error('BREEZ_MNEMONIC not configured. Generate a 12-word mnemonic for self-custody.');
  }

  sdkInitPromise = (async () => {
    try {
      // Dynamic import for the Breez SDK
      const breezModule = await import('@breeztech/breez-sdk-liquid');

      // Network type is a string literal: "mainnet" | "testnet" | "regtest"
      const network = BREEZ_NETWORK as 'mainnet' | 'testnet';

      const config = breezModule.defaultConfig(network, BREEZ_API_KEY);
      config.workingDir = BREEZ_WORKING_DIR;

      sdkInstance = await breezModule.connect({
        mnemonic: BREEZ_MNEMONIC,
        config,
      });

      return sdkInstance;
    } catch (error) {
      sdkInitPromise = null;
      throw error;
    }
  })();

  return sdkInitPromise;
}

/**
 * Create a Lightning invoice for BTC deposit
 */
export async function createBreezDeposit(request: BreezPaymentRequest): Promise<BreezPaymentResponse> {
  if (!BREEZ_API_KEY || !BREEZ_MNEMONIC) {
    return {
      success: false,
      error: !BREEZ_API_KEY
        ? 'BREEZ_API_KEY not configured. Request one at https://breez.technology/sdk/'
        : 'BREEZ_MNEMONIC not configured. Set a 12-word mnemonic for self-custody.',
    };
  }

  try {
    const sdk = await getSDK();
    const amountSats = usdToSats(request.amount);

    // Fetch limits first
    const limits = await sdk.fetchLightningLimits();

    if (amountSats < limits.receive.minSat) {
      return {
        success: false,
        error: `Minimum deposit: ${limits.receive.minSat} sats (~$${satsToUsd(limits.receive.minSat).toFixed(2)})`,
      };
    }

    if (amountSats > limits.receive.maxSat) {
      return {
        success: false,
        error: `Maximum deposit: ${limits.receive.maxSat} sats (~$${satsToUsd(limits.receive.maxSat).toFixed(2)})`,
      };
    }

    // Prepare the receive payment
    const prepareResponse = await sdk.prepareReceivePayment({
      paymentMethod: 'bolt11Invoice',
      amount: {
        type: 'bitcoin',
        payerAmountSat: amountSats,
      },
    });

    // Create the invoice
    const description = request.description || `Clawdentials deposit for ${request.agentId}`;
    const result = await sdk.receivePayment({
      prepareResponse,
      description,
    });

    // Invoice expires in 1 hour typically
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      success: true,
      deposit: {
        id: `breez_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'BTC',
        network: 'lightning',
        status: 'pending',
        provider: 'breez' as any,
        externalId: null,
        paymentAddress: result.destination, // bolt11 invoice
        paymentUrl: null,
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: {
        bolt11: result.destination,
        amountSats,
        expiresAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Lightning invoice',
    };
  }
}

/**
 * Send Lightning payment (for withdrawals)
 */
export async function sendBreezPayment(
  destination: string, // bolt11 invoice or Lightning Address
  amountUsd: number
): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  if (!BREEZ_API_KEY || !BREEZ_MNEMONIC) {
    return { success: false, error: 'Breez SDK not configured' };
  }

  try {
    const sdk = await getSDK();

    // Prepare the payment
    const prepareResponse = await sdk.prepareSendPayment({
      destination,
    });

    // Check fees are acceptable
    const feesSat = prepareResponse.feesSat;
    console.log(`Breez payment fees: ${feesSat} sats`);

    // Send the payment
    const result = await sdk.sendPayment({
      prepareResponse,
    });

    return {
      success: true,
      txId: result.payment?.txId || result.payment?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send payment',
    };
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(): Promise<{
  success: boolean;
  balanceSats?: number;
  balanceUsd?: number;
  error?: string;
}> {
  if (!BREEZ_API_KEY || !BREEZ_MNEMONIC) {
    return { success: false, error: 'Breez SDK not configured' };
  }

  try {
    const sdk = await getSDK();
    const info = await sdk.getInfo();

    return {
      success: true,
      balanceSats: info.balanceSat,
      balanceUsd: satsToUsd(info.balanceSat),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

/**
 * List recent payments
 */
export async function listPayments(limit: number = 10): Promise<{
  success: boolean;
  payments?: any[];
  error?: string;
}> {
  if (!BREEZ_API_KEY || !BREEZ_MNEMONIC) {
    return { success: false, error: 'Breez SDK not configured' };
  }

  try {
    const sdk = await getSDK();
    const payments = await sdk.listPayments({
      limit,
    });

    return {
      success: true,
      payments,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list payments',
    };
  }
}

/**
 * Disconnect from SDK (cleanup)
 */
export async function disconnect(): Promise<void> {
  if (sdkInstance) {
    try {
      await sdkInstance.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    sdkInstance = null;
    sdkInitPromise = null;
  }
}

/**
 * Generate a new mnemonic (for initial setup)
 */
export function generateMnemonic(): string {
  // In production, use a proper BIP39 library
  // This is a placeholder - the actual mnemonic should be generated securely
  throw new Error('Generate mnemonic using a BIP39 library or wallet. Do not use this in production.');
}

export const breezService = {
  createDeposit: createBreezDeposit,
  sendPayment: sendBreezPayment,
  getWalletBalance,
  listPayments,
  disconnect,
  usdToSats,
  satsToUsd,
  config: {
    configured: !!(BREEZ_API_KEY && BREEZ_MNEMONIC),
    apiKeySet: !!BREEZ_API_KEY,
    mnemonicSet: !!BREEZ_MNEMONIC,
    network: BREEZ_NETWORK,
    satsPerUsd: SATS_PER_USD,
  },
};
