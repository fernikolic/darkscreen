/**
 * CoinRemitter Payment Service - USDT on TRC-20
 *
 * Uses CoinRemitter API for USDT deposits and withdrawals.
 * Docs: https://github.com/CoinRemitter/nodejs-api
 * Fee: 0.23%
 */

import type { Deposit } from '../../types/index.js';

// Configuration
const COINREMITTER_API_KEY = process.env.COINREMITTER_API_KEY || '';
const COINREMITTER_PASSWORD = process.env.COINREMITTER_PASSWORD || '';
const COINREMITTER_WEBHOOK_URL = process.env.COINREMITTER_WEBHOOK_URL || '';

// API base URL
const API_BASE = 'https://coinremitter.com/api/v3/USDTTRC20';

interface CoinRemitterInvoice {
  id: string;
  invoice_id: string;
  url: string;
  address: string;
  total_amount: { USD: string; USDTTRC20: string };
  status: string;
  expire_time: string;
}

export interface CoinRemitterPaymentRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
}

export interface CoinRemitterPaymentResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  invoice?: CoinRemitterInvoice;
  error?: string;
}

/**
 * Make API request to CoinRemitter
 */
async function apiRequest(endpoint: string, data: Record<string, any>): Promise<any> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: COINREMITTER_API_KEY,
      password: COINREMITTER_PASSWORD,
      ...data,
    }),
  });

  const result = await response.json();

  if (result.flag !== 1) {
    throw new Error(result.msg || 'CoinRemitter API error');
  }

  return result.data;
}

/**
 * Create a USDT deposit invoice
 */
export async function createCoinRemitterDeposit(
  request: CoinRemitterPaymentRequest
): Promise<CoinRemitterPaymentResponse> {
  if (!COINREMITTER_API_KEY || !COINREMITTER_PASSWORD) {
    return {
      success: false,
      error: 'CoinRemitter credentials not configured. Set COINREMITTER_API_KEY and COINREMITTER_PASSWORD environment variables.',
    };
  }

  try {
    const invoiceData = await apiRequest('create-invoice', {
      amount: request.amount,
      currency: 'USD', // Amount is in USD, will convert to USDT
      name: request.agentId,
      description: request.description || `Deposit for ${request.agentId}`,
      notify_url: COINREMITTER_WEBHOOK_URL,
      expire_time: 30, // 30 minutes
      custom_data1: request.agentId,
    });

    const expiresAt = new Date(invoiceData.expire_time);

    return {
      success: true,
      deposit: {
        id: `cr_${invoiceData.invoice_id}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'USDT',
        network: 'trc20',
        status: 'pending',
        provider: 'coinremitter',
        externalId: invoiceData.invoice_id,
        paymentAddress: invoiceData.address,
        paymentUrl: invoiceData.url,
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: invoiceData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

/**
 * Check invoice status
 */
export async function getInvoiceStatus(invoiceId: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  amount?: number;
  txId?: string;
  error?: string;
}> {
  if (!COINREMITTER_API_KEY || !COINREMITTER_PASSWORD) {
    return { success: false, error: 'CoinRemitter credentials not configured' };
  }

  try {
    const data = await apiRequest('get-invoice', { invoice_id: invoiceId });

    return {
      success: true,
      status: data.status,
      paid: data.status === 'Paid',
      amount: parseFloat(data.paid_amount?.USD || '0'),
      txId: data.transaction_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice status',
    };
  }
}

/**
 * Process webhook callback from CoinRemitter
 */
export function parseWebhookPayload(body: Record<string, any>): {
  invoiceId: string;
  status: string;
  amount: number;
  agentId: string;
  txId: string | null;
} {
  return {
    invoiceId: body.invoice_id,
    status: body.status,
    amount: parseFloat(body.usd_amount || body.coin_amount || '0'),
    agentId: body.custom_data1,
    txId: body.transaction_id || null,
  };
}

/**
 * Send USDT withdrawal
 */
export async function sendCoinRemitterWithdrawal(
  toAddress: string,
  amount: number
): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  if (!COINREMITTER_API_KEY || !COINREMITTER_PASSWORD) {
    return { success: false, error: 'CoinRemitter credentials not configured' };
  }

  try {
    const data = await apiRequest('withdraw', {
      to_address: toAddress,
      amount: amount,
      currency: 'USD', // Will convert to USDT equivalent
    });

    return {
      success: true,
      txId: data.txn_id || data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send withdrawal',
    };
  }
}

/**
 * Get wallet balance from CoinRemitter
 */
export async function getWalletBalance(): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> {
  if (!COINREMITTER_API_KEY || !COINREMITTER_PASSWORD) {
    return { success: false, error: 'CoinRemitter credentials not configured' };
  }

  try {
    const data = await apiRequest('get-balance', {});
    return {
      success: true,
      balance: parseFloat(data.balance || '0'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

export const coinremitterService = {
  createDeposit: createCoinRemitterDeposit,
  getInvoiceStatus,
  parseWebhookPayload,
  sendWithdrawal: sendCoinRemitterWithdrawal,
  getWalletBalance,
  config: {
    configured: !!(COINREMITTER_API_KEY && COINREMITTER_PASSWORD),
    webhookUrl: COINREMITTER_WEBHOOK_URL,
  },
};
