/**
 * OxaPay Payment Service - USDT (and other cryptos)
 *
 * Uses OxaPay API v1 for USDT deposits and withdrawals.
 * Docs: https://docs.oxapay.com
 * Fee: 0.4%
 */

import type { Deposit } from '../../types/index.js';

// Configuration
const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY || '';
const OXAPAY_WEBHOOK_URL = process.env.OXAPAY_WEBHOOK_URL || '';

// API base URL
const API_BASE = 'https://api.oxapay.com/v1';

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
    paymentUrl: string;
    expiredAt: number;
  };
  error?: string;
}

/**
 * Make API request to OxaPay v1
 */
async function apiRequest(endpoint: string, data: Record<string, any>): Promise<any> {
  if (!OXAPAY_API_KEY) {
    throw new Error('OXAPAY_API_KEY not configured');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant_api_key': OXAPAY_API_KEY,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.status !== 200) {
    throw new Error(result.message || `OxaPay API error: ${result.status}`);
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
    const orderId = `clw_${request.agentId}_${Date.now()}`;

    const result = await apiRequest('/payment/invoice', {
      amount: request.amount,
      currency: 'USD',
      to_currency: request.currency || 'USDT',
      lifetime: 30, // 30 minutes
      order_id: orderId,
      description: request.description || `Deposit for ${request.agentId}`,
      callback_url: OXAPAY_WEBHOOK_URL || undefined,
      fee_paid_by_payer: 0, // We pay the fee
      sandbox: false,
    });

    const expiresAt = new Date(result.data.expired_at * 1000);

    return {
      success: true,
      deposit: {
        id: `oxapay_${result.data.track_id}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'USDT',
        network: 'trc20',
        status: 'pending',
        provider: 'oxapay' as any,
        externalId: result.data.track_id,
        paymentAddress: null, // OxaPay uses payment URL instead
        paymentUrl: result.data.payment_url,
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: {
        trackId: result.data.track_id,
        paymentUrl: result.data.payment_url,
        expiredAt: result.data.expired_at,
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
    const result = await apiRequest('/payment/inquiry', {
      track_id: trackId,
    });

    // OxaPay statuses: Waiting, Confirming, Paid, Failed, Expired
    return {
      success: true,
      status: result.data.status,
      paid: result.data.status === 'Paid',
      amount: parseFloat(result.data.amount || '0'),
      txId: result.data.txID,
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
    trackId: body.track_id,
    status: body.status,
    amount: parseFloat(body.amount || '0'),
    orderId: body.order_id, // Contains agentId
    txId: body.txID || null,
  };
}

/**
 * Verify webhook signature (OxaPay uses HMAC SHA512)
 */
export function verifyWebhook(body: string, signature: string): boolean {
  if (!OXAPAY_API_KEY) return false;

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', OXAPAY_API_KEY);
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
    const result = await apiRequest('/payment/payout', {
      address: toAddress,
      amount,
      currency,
      network,
      callback_url: OXAPAY_WEBHOOK_URL || undefined,
      description: 'Clawdentials withdrawal',
    });

    return {
      success: true,
      txId: result.data.track_id,
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
  if (!OXAPAY_API_KEY) {
    return { success: false, error: 'OXAPAY_API_KEY not configured' };
  }

  try {
    const result = await apiRequest('/payment/currencies', {});

    return {
      success: true,
      currencies: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get currencies',
    };
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!OXAPAY_API_KEY) {
    return { success: false, error: 'OXAPAY_API_KEY not configured' };
  }

  try {
    // Try to get currencies as a simple API test
    await getSupportedCurrencies();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API connection failed',
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
  testConnection,
  config: {
    configured: !!OXAPAY_API_KEY,
    webhookUrl: OXAPAY_WEBHOOK_URL,
  },
};
