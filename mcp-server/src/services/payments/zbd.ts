/**
 * ZBD Payment Service - Bitcoin on Lightning
 *
 * Uses ZBD API for instant Bitcoin Lightning payments.
 * Docs: https://zbd.dev
 * Fee: ~1%
 */

import type { Deposit } from '../../types/index.js';

// Configuration
const ZBD_API_KEY = process.env.ZBD_API_KEY || '';
const ZBD_CALLBACK_URL = process.env.ZBD_CALLBACK_URL || '';

// API base URL
const API_BASE = 'https://api.zebedee.io/v0';

// Current BTC/USD rate (in production, fetch from an API)
// 1 sat = 0.00000001 BTC
// At ~$100k/BTC: 1 sat ≈ $0.001, so $1 ≈ 1000 sats
const SATS_PER_USD = parseInt(process.env.ZBD_SATS_PER_USD || '1000', 10);

export interface ZBDPaymentRequest {
  amount: number; // USD amount
  agentId: string;
  description?: string;
}

export interface ZBDPaymentResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  invoice?: {
    id: string;
    invoice: string; // bolt11 invoice string
    amount: string; // in millisats
    expiresAt: string;
  };
  error?: string;
}

/**
 * Make API request to ZBD
 */
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: Record<string, any>
): Promise<any> {
  if (!ZBD_API_KEY) {
    throw new Error('ZBD_API_KEY not configured');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: ZBD_API_KEY,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'ZBD API error');
  }

  return result.data;
}

/**
 * Convert USD to millisats
 */
function usdToMillisats(usd: number): string {
  const sats = Math.floor(usd * SATS_PER_USD);
  const millisats = sats * 1000;
  return millisats.toString();
}

/**
 * Convert millisats to USD
 */
function millisatsToUsd(millisats: string | number): number {
  const sats = typeof millisats === 'string' ? parseInt(millisats, 10) / 1000 : millisats / 1000;
  return sats / SATS_PER_USD;
}

/**
 * Create a Lightning invoice for BTC deposit
 */
export async function createZBDDeposit(request: ZBDPaymentRequest): Promise<ZBDPaymentResponse> {
  if (!ZBD_API_KEY) {
    return {
      success: false,
      error: 'ZBD_API_KEY not configured. Set this environment variable to your ZBD API key.',
    };
  }

  try {
    const amountMillisats = usdToMillisats(request.amount);

    const chargeData = await apiRequest('/charges', 'POST', {
      amount: amountMillisats,
      description: request.description || `Clawdentials deposit for ${request.agentId}`,
      expiresIn: 600, // 10 minutes (Lightning invoices expire fast)
      internalId: request.agentId,
      callbackUrl: ZBD_CALLBACK_URL,
    });

    const expiresAt = new Date(chargeData.expiresAt);

    return {
      success: true,
      deposit: {
        id: `zbd_${chargeData.id}`,
        agentId: request.agentId,
        amount: request.amount,
        currency: 'BTC',
        network: 'lightning',
        status: 'pending',
        provider: 'zbd',
        externalId: chargeData.id,
        paymentAddress: chargeData.invoice.request, // bolt11 invoice
        paymentUrl: null, // No hosted page, agent pays invoice directly
        createdAt: new Date(),
        expiresAt,
        completedAt: null,
        txHash: null,
      },
      invoice: {
        id: chargeData.id,
        invoice: chargeData.invoice.request,
        amount: amountMillisats,
        expiresAt: chargeData.expiresAt,
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
 * Check charge/invoice status
 */
export async function getChargeStatus(chargeId: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  amountUsd?: number;
  error?: string;
}> {
  if (!ZBD_API_KEY) {
    return { success: false, error: 'ZBD_API_KEY not configured' };
  }

  try {
    const data = await apiRequest(`/charges/${chargeId}`, 'GET');

    return {
      success: true,
      status: data.status,
      paid: data.status === 'completed',
      amountUsd: millisatsToUsd(data.amount),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get charge status',
    };
  }
}

/**
 * Process webhook callback from ZBD
 */
export function parseWebhookPayload(body: Record<string, any>): {
  chargeId: string;
  status: string;
  amountUsd: number;
  agentId: string;
} {
  return {
    chargeId: body.id,
    status: body.status,
    amountUsd: millisatsToUsd(body.amount),
    agentId: body.internalId,
  };
}

/**
 * Send BTC withdrawal via Lightning
 */
export async function sendZBDWithdrawal(
  destination: string, // Lightning invoice or Lightning Address
  amountUsd: number
): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> {
  if (!ZBD_API_KEY) {
    return { success: false, error: 'ZBD_API_KEY not configured' };
  }

  try {
    const amountMillisats = usdToMillisats(amountUsd);

    // Check if it's a Lightning Address (contains @)
    if (destination.includes('@')) {
      // Pay to Lightning Address
      const data = await apiRequest('/ln-address/send-payment', 'POST', {
        lnAddress: destination,
        amount: amountMillisats,
        comment: 'Clawdentials withdrawal',
        callbackUrl: ZBD_CALLBACK_URL,
      });

      return {
        success: true,
        paymentId: data.id,
      };
    } else {
      // Pay to bolt11 invoice
      const data = await apiRequest('/payments', 'POST', {
        invoice: destination,
        description: 'Clawdentials withdrawal',
        internalId: `withdrawal_${Date.now()}`,
        callbackUrl: ZBD_CALLBACK_URL,
      });

      return {
        success: true,
        paymentId: data.id,
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
 * Get ZBD wallet balance
 */
export async function getWalletBalance(): Promise<{
  success: boolean;
  balanceSats?: number;
  balanceUsd?: number;
  error?: string;
}> {
  if (!ZBD_API_KEY) {
    return { success: false, error: 'ZBD_API_KEY not configured' };
  }

  try {
    const data = await apiRequest('/wallet', 'GET');
    const balanceSats = parseInt(data.balance, 10) / 1000; // millisats to sats

    return {
      success: true,
      balanceSats,
      balanceUsd: balanceSats / SATS_PER_USD,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

export const zbdService = {
  createDeposit: createZBDDeposit,
  getChargeStatus,
  parseWebhookPayload,
  sendWithdrawal: sendZBDWithdrawal,
  getWalletBalance,
  usdToMillisats,
  millisatsToUsd,
  config: {
    configured: !!ZBD_API_KEY,
    callbackUrl: ZBD_CALLBACK_URL,
    satsPerUsd: SATS_PER_USD,
  },
};
