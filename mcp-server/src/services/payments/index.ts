/**
 * Unified Payment Service
 *
 * Provides a single interface for all payment rails:
 * - USDC via x402 on Base
 * - USDT via OxaPay on TRC-20 (and other networks)
 * - BTC via Alby on Lightning
 */

import { x402Service } from './x402.js';
import { oxapayService } from './oxapay.js';
import { breezService } from './breez.js';
import type { Currency, PaymentNetwork, Deposit } from '../../types/index.js';

export { x402Service } from './x402.js';
export { oxapayService } from './oxapay.js';
export { breezService } from './breez.js';

// Legacy exports for backwards compatibility
export { oxapayService as coinremitterService } from './oxapay.js';
export { breezService as albyService } from './breez.js';
export { breezService as zbdService } from './breez.js';

export interface CreateDepositRequest {
  agentId: string;
  amount: number;
  currency: 'USDC' | 'USDT' | 'BTC';
  description?: string;
}

export interface CreateDepositResponse {
  success: boolean;
  deposit?: Partial<Deposit>;
  paymentInstructions?: {
    currency: Currency;
    network: PaymentNetwork;
    address?: string; // Wallet address or Lightning invoice
    url?: string; // Payment page URL if available
    amount: number;
    amountRaw?: string; // Amount in native units (wei, sats, etc.)
    expiresAt?: Date;
    qrData?: string; // Data for QR code (address or invoice)
  };
  error?: string;
}

export interface SendWithdrawalRequest {
  currency: 'USDC' | 'USDT' | 'BTC';
  amount: number;
  destination: string; // Address or Lightning invoice/address
}

export interface SendWithdrawalResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

/**
 * Create a deposit request for any supported currency
 */
export async function createDeposit(request: CreateDepositRequest): Promise<CreateDepositResponse> {
  switch (request.currency) {
    case 'USDC': {
      const result = await x402Service.createDeposit({
        amount: request.amount,
        agentId: request.agentId,
        description: request.description,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        deposit: result.deposit,
        paymentInstructions: {
          currency: 'USDC',
          network: 'base',
          address: result.paymentDetails?.payTo,
          amount: request.amount,
          amountRaw: result.paymentDetails?.amount,
          expiresAt: result.deposit?.expiresAt || undefined,
          qrData: result.paymentDetails?.payTo, // EVM address for QR
        },
      };
    }

    case 'USDT': {
      const result = await oxapayService.createDeposit({
        amount: request.amount,
        agentId: request.agentId,
        description: request.description,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        deposit: result.deposit,
        paymentInstructions: {
          currency: 'USDT',
          network: 'trc20',
          address: undefined, // OxaPay uses payment URL instead of direct address
          url: result.invoice?.paymentUrl,
          amount: request.amount,
          expiresAt: result.deposit?.expiresAt || undefined,
          qrData: result.invoice?.paymentUrl, // QR links to payment page
        },
      };
    }

    case 'BTC': {
      const result = await breezService.createDeposit({
        amount: request.amount,
        agentId: request.agentId,
        description: request.description,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        deposit: result.deposit,
        paymentInstructions: {
          currency: 'BTC',
          network: 'lightning',
          address: result.invoice?.bolt11, // bolt11 invoice
          amount: request.amount,
          amountRaw: result.invoice?.amountSats?.toString(),
          expiresAt: result.invoice?.expiresAt || undefined,
          qrData: result.invoice?.bolt11, // Lightning invoice for QR
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDT, BTC`,
      };
  }
}

/**
 * Send a withdrawal in any supported currency
 */
export async function sendWithdrawal(request: SendWithdrawalRequest): Promise<SendWithdrawalResponse> {
  switch (request.currency) {
    case 'USDC': {
      const result = await x402Service.sendWithdrawal(request.destination, request.amount);
      return {
        success: result.success,
        txId: result.txHash,
        error: result.error,
      };
    }

    case 'USDT': {
      const result = await oxapayService.sendPayout(
        request.destination,
        request.amount,
        'USDT',
        'TRC20'
      );
      return {
        success: result.success,
        txId: result.txId,
        error: result.error,
      };
    }

    case 'BTC': {
      const result = await breezService.sendPayment(request.destination, request.amount);
      return {
        success: result.success,
        txId: result.txId,
        error: result.error,
      };
    }

    default:
      return {
        success: false,
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDT, BTC`,
      };
  }
}

/**
 * Get configuration status for all payment providers
 */
export function getPaymentConfig(): {
  usdc: { configured: boolean; network: string; provider: string };
  usdt: { configured: boolean; network: string; provider: string };
  btc: { configured: boolean; network: string; provider: string };
} {
  return {
    usdc: {
      configured: !!x402Service.config.walletAddress,
      network: 'Base L2',
      provider: 'x402 (Coinbase)',
    },
    usdt: {
      configured: oxapayService.config.configured,
      network: 'Tron TRC-20',
      provider: 'OxaPay',
    },
    btc: {
      configured: breezService.config.configured,
      network: 'Lightning (Liquid)',
      provider: 'Breez SDK',
    },
  };
}

export const paymentService = {
  createDeposit,
  sendWithdrawal,
  getConfig: getPaymentConfig,
  // Individual services for advanced use
  x402: x402Service,
  oxapay: oxapayService,
  breez: breezService,
};
