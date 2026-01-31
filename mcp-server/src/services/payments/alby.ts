/**
 * Alby Payment Service - Bitcoin on Lightning
 *
 * Uses Alby API with Nostr Wallet Connect (NWC) for self-custodial Lightning payments.
 * Docs: https://guides.getalby.com/developer-guide
 * Fee: ~0% (just Lightning network fees)
 */

import type { Deposit } from '../../types/index.js';

// Configuration
// NWC connection string format: nostr+walletconnect://pubkey?relay=wss://...&secret=...
const ALBY_NWC_URL = process.env.ALBY_NWC_URL || '';
const ALBY_WEBHOOK_URL = process.env.ALBY_WEBHOOK_URL || '';

// Alby API (for account-based operations)
const ALBY_API_KEY = process.env.ALBY_API_KEY || '';
const API_BASE = 'https://api.getalby.com';

// Exchange rate (sats per USD) - in production, fetch from API
const SATS_PER_USD = parseInt(process.env.ALBY_SATS_PER_USD || '1000', 10);

export interface AlbyPaymentRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
}

export interface AlbyPaymentResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  invoice?: {
    paymentHash: string;
    paymentRequest: string; // bolt11 invoice
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
 * Make API request to Alby
 */
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: Record<string, any>
): Promise<any> {
  if (!ALBY_API_KEY) {
    throw new Error('ALBY_API_KEY not configured');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ALBY_API_KEY}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Alby API error: ${error}`);
  }

  return response.json();
}

/**
 * Create a Lightning invoice for BTC deposit
 */
export async function createAlbyDeposit(request: AlbyPaymentRequest): Promise<AlbyPaymentResponse> {
  if (!ALBY_API_KEY) {
    return {
      success: false,
      error: 'ALBY_API_KEY not configured. Get one at https://getalby.com',
    };
  }

  try {
    const amountSats = usdToSats(request.amount);

    const result = await apiRequest('/invoices', 'POST', {
      amount: amountSats,
      description: request.description || `Clawdentials deposit for ${request.agentId}`,
      memo: request.agentId, // Store agentId in memo for webhook processing
    });

    // Alby invoices expire in 1 hour by default
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      success: true,
      deposit: {
        id: `alby_${result.payment_hash}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'BTC',
        network: 'lightning',
        status: 'pending',
        provider: 'alby' as any,
        externalId: result.payment_hash,
        paymentAddress: result.payment_request, // bolt11 invoice
        paymentUrl: null,
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: {
        paymentHash: result.payment_hash,
        paymentRequest: result.payment_request,
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
 * Check invoice status
 */
export async function getInvoiceStatus(paymentHash: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  amountSats?: number;
  amountUsd?: number;
  error?: string;
}> {
  if (!ALBY_API_KEY) {
    return { success: false, error: 'ALBY_API_KEY not configured' };
  }

  try {
    const result = await apiRequest(`/invoices/${paymentHash}`, 'GET');

    return {
      success: true,
      status: result.state, // CREATED, SETTLED, CANCELED
      paid: result.state === 'SETTLED',
      amountSats: result.amount,
      amountUsd: satsToUsd(result.amount),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice status',
    };
  }
}

/**
 * Process webhook callback from Alby
 */
export function parseWebhookPayload(body: Record<string, any>): {
  paymentHash: string;
  status: string;
  amountSats: number;
  amountUsd: number;
  memo: string; // Contains agentId
} {
  return {
    paymentHash: body.payment_hash,
    status: body.state,
    amountSats: body.amount,
    amountUsd: satsToUsd(body.amount),
    memo: body.memo || body.description || '',
  };
}

/**
 * Send Lightning payment (for withdrawals)
 */
export async function sendAlbyPayment(
  destination: string, // Lightning invoice or Lightning Address
  amountUsd: number
): Promise<{
  success: boolean;
  paymentHash?: string;
  error?: string;
}> {
  if (!ALBY_API_KEY) {
    return { success: false, error: 'ALBY_API_KEY not configured' };
  }

  try {
    // Check if it's a Lightning Address (contains @)
    if (destination.includes('@')) {
      // Pay to Lightning Address
      const amountSats = usdToSats(amountUsd);
      const result = await apiRequest('/payments/lnaddress', 'POST', {
        lnaddress: destination,
        amount: amountSats,
        comment: 'Clawdentials withdrawal',
      });

      return {
        success: true,
        paymentHash: result.payment_hash,
      };
    } else {
      // Pay bolt11 invoice directly
      const result = await apiRequest('/payments/bolt11', 'POST', {
        invoice: destination,
      });

      return {
        success: true,
        paymentHash: result.payment_hash,
      };
    }
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
  if (!ALBY_API_KEY) {
    return { success: false, error: 'ALBY_API_KEY not configured' };
  }

  try {
    const result = await apiRequest('/balance', 'GET');

    return {
      success: true,
      balanceSats: result.balance,
      balanceUsd: satsToUsd(result.balance),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

/**
 * Decode a Lightning invoice to get amount and details
 */
export async function decodeInvoice(invoice: string): Promise<{
  success: boolean;
  amountSats?: number;
  amountUsd?: number;
  description?: string;
  paymentHash?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // Use Alby's decode endpoint or a local decoder
    const result = await apiRequest('/decode/bolt11', 'POST', { invoice });

    return {
      success: true,
      amountSats: result.amount,
      amountUsd: satsToUsd(result.amount),
      description: result.description,
      paymentHash: result.payment_hash,
      expiresAt: result.expires_at ? new Date(result.expires_at * 1000) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode invoice',
    };
  }
}

export const albyService = {
  createDeposit: createAlbyDeposit,
  getInvoiceStatus,
  parseWebhookPayload,
  sendPayment: sendAlbyPayment,
  getWalletBalance,
  decodeInvoice,
  usdToSats,
  satsToUsd,
  config: {
    configured: !!ALBY_API_KEY,
    nwcConfigured: !!ALBY_NWC_URL,
    webhookUrl: ALBY_WEBHOOK_URL,
    satsPerUsd: SATS_PER_USD,
  },
};
