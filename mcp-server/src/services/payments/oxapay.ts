/**
 * OxaPay Payment Service - USDT (and other cryptos)
 *
 * Uses OxaPay API for USDT deposits and withdrawals.
 * Docs: https://docs.oxapay.com
 * Fee: 0.4%
 */

import type { Deposit } from '../../types/index.js';

// Configuration
const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY || '';
const OXAPAY_WEBHOOK_URL = process.env.OXAPAY_WEBHOOK_URL || '';

// API base URL
const API_BASE = 'https://api.oxapay.com';

export interface OxaPayPaymentRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
  currency?: string; // Default USDT
}

export interface OxaPayPaymentResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  invoice?: {
    trackId: string;
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    payLink: string;
    expiredAt: number;
  };
  error?: string;
}

/**
 * Make API request to OxaPay
 */
async function apiRequest(endpoint: string, data: Record<string, any>): Promise<any> {
  if (!OXAPAY_API_KEY) {
    throw new Error('OXAPAY_API_KEY not configured');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merchant: OXAPAY_API_KEY,
      ...data,
    }),
  });

  const result = await response.json();

  if (result.result !== 100) {
    throw new Error(result.message || `OxaPay API error: ${result.result}`);
  }

  return result;
}

/**
 * Create a USDT deposit invoice via OxaPay
 */
export async function createOxaPayDeposit(
  request: OxaPayPaymentRequest
): Promise<OxaPayPaymentResponse> {
  if (!OXAPAY_API_KEY) {
    return {
      success: false,
      error: 'OXAPAY_API_KEY not configured. Set this environment variable.',
    };
  }

  try {
    const orderId = `clw_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const result = await apiRequest('/merchants/request', {
      amount: request.amount,
      currency: 'USD',
      payCurrency: request.currency || 'USDT', // Can also be BTC, ETH, etc.
      network: 'TRC20', // Default to TRC20 for USDT
      lifeTime: 30, // 30 minutes
      orderId,
      description: request.description || `Deposit for ${request.agentId}`,
      callbackUrl: OXAPAY_WEBHOOK_URL,
      returnUrl: '',
      email: '',
    });

    const expiresAt = new Date(result.expiredAt * 1000);

    return {
      success: true,
      deposit: {
        id: `oxapay_${result.trackId}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'USDT',
        network: 'trc20',
        status: 'pending',
        provider: 'oxapay' as any,
        externalId: result.trackId,
        paymentAddress: result.payAddress,
        paymentUrl: result.payLink,
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: {
        trackId: result.trackId,
        payAddress: result.payAddress,
        payAmount: result.payAmount,
        payCurrency: result.payCurrency,
        payLink: result.payLink,
        expiredAt: result.expiredAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

/**
 * Check payment status
 */
export async function getPaymentStatus(trackId: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  amount?: number;
  txId?: string;
  error?: string;
}> {
  if (!OXAPAY_API_KEY) {
    return { success: false, error: 'OXAPAY_API_KEY not configured' };
  }

  try {
    const result = await apiRequest('/merchants/inquiry', {
      trackId,
    });

    // OxaPay statuses: Waiting, Confirming, Paid, Failed, Expired
    return {
      success: true,
      status: result.status,
      paid: result.status === 'Paid',
      amount: parseFloat(result.amount || '0'),
      txId: result.txID,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status',
    };
  }
}

/**
 * Process webhook callback from OxaPay
 */
export function parseWebhookPayload(body: Record<string, any>): {
  trackId: string;
  status: string;
  amount: number;
  orderId: string;
  txId: string | null;
} {
  return {
    trackId: body.trackId,
    status: body.status,
    amount: parseFloat(body.amount || '0'),
    orderId: body.orderId, // Contains agentId
    txId: body.txID || null,
  };
}

/**
 * Verify webhook signature (OxaPay uses HMAC)
 */
export function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(body);
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}

/**
 * Send USDT payout via OxaPay
 */
export async function sendOxaPayPayout(
  toAddress: string,
  amount: number,
  currency: string = 'USDT',
  network: string = 'TRC20'
): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  if (!OXAPAY_API_KEY) {
    return { success: false, error: 'OXAPAY_API_KEY not configured' };
  }

  try {
    const result = await apiRequest('/merchants/payout', {
      address: toAddress,
      amount,
      currency,
      network,
      callbackUrl: OXAPAY_WEBHOOK_URL,
      description: 'Clawdentials withdrawal',
    });

    return {
      success: true,
      txId: result.trackId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send payout',
    };
  }
}

/**
 * Get supported currencies and networks
 */
export async function getSupportedCurrencies(): Promise<{
  success: boolean;
  currencies?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/merchants/allowedCoins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant: OXAPAY_API_KEY }),
    });
    const result = await response.json();

    if (result.result !== 100) {
      throw new Error(result.message);
    }

    return {
      success: true,
      currencies: result.allowed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get currencies',
    };
  }
}

export const oxapayService = {
  createDeposit: createOxaPayDeposit,
  getPaymentStatus,
  parseWebhookPayload,
  verifyWebhook,
  sendPayout: sendOxaPayPayout,
  getSupportedCurrencies,
  config: {
    configured: !!OXAPAY_API_KEY,
    webhookUrl: OXAPAY_WEBHOOK_URL,
  },
};
