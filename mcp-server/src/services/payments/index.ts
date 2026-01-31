/**
 * Unified Payment Service
 *
 * Provides a single interface for all payment rails:
 * - USDC via x402 on Base
 * - USDT via CoinRemitter on TRC-20
 * - BTC via ZBD on Lightning
 */

import { x402Service } from './x402.js';
import { coinremitterService } from './coinremitter.js';
import { zbdService } from './zbd.js';
import type { Currency, PaymentNetwork, Deposit } from '../../types/index.js';

export { x402Service } from './x402.js';
export { coinremitterService } from './coinremitter.js';
export { zbdService } from './zbd.js';

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
    amountRaw?: string; // Amount in native units (wei, millisats, etc.)
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
      const result = await coinremitterService.createDeposit({
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
          address: result.deposit?.paymentAddress || undefined,
          url: result.deposit?.paymentUrl || undefined,
          amount: request.amount,
          expiresAt: result.deposit?.expiresAt || undefined,
          qrData: result.deposit?.paymentAddress || undefined,
        },
      };
    }

    case 'BTC': {
      const result = await zbdService.createDeposit({
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
          address: result.invoice?.invoice, // bolt11 invoice
          amount: request.amount,
          amountRaw: result.invoice?.amount, // millisats
          expiresAt: result.deposit?.expiresAt || undefined,
          qrData: result.invoice?.invoice, // Lightning invoice for QR
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
      const result = await coinremitterService.sendWithdrawal(request.destination, request.amount);
      return {
        success: result.success,
        txId: result.txId,
        error: result.error,
      };
    }

    case 'BTC': {
      const result = await zbdService.sendWithdrawal(request.destination, request.amount);
      return {
        success: result.success,
        txId: result.paymentId,
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
  usdc: { configured: boolean; network: string };
  usdt: { configured: boolean; network: string };
  btc: { configured: boolean; network: string };
} {
  return {
    usdc: {
      configured: !!x402Service.config.walletAddress,
      network: 'Base (x402)',
    },
    usdt: {
      configured: coinremitterService.config.configured,
      network: 'Tron TRC-20 (CoinRemitter)',
    },
    btc: {
      configured: zbdService.config.configured,
      network: 'Lightning (ZBD)',
    },
  };
}

export const paymentService = {
  createDeposit,
  sendWithdrawal,
  getConfig: getPaymentConfig,
  // Individual services for advanced use
  x402: x402Service,
  coinremitter: coinremitterService,
  zbd: zbdService,
};
