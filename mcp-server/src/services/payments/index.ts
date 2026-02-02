/**
 * Unified Payment Service
 *
 * Provides a single interface for all payment rails:
 * - USDC via x402 on Base
 * - USDT via OxaPay on TRC-20 (and other networks)
 * - BTC via Cashu on Lightning (no KYC, privacy-preserving)
 */

import { x402Service } from './x402.js';
import { oxapayService } from './oxapay.js';
import { cashuService } from './cashu.js';
import { breezService } from './breez.js';
import type { Currency, PaymentNetwork, Deposit } from '../../types/index.js';

// BTC price for USD to sats conversion (update periodically or fetch from API)
// At ~$97,000/BTC: 1 USD ≈ 1030 sats
const SATS_PER_USD = 1030;

/**
 * Convert USD to satoshis
 */
function usdToSats(usd: number): number {
  return Math.floor(usd * SATS_PER_USD);
}

/**
 * Convert satoshis to USD
 */
function satsToUsd(sats: number): number {
  return sats / SATS_PER_USD;
}

export { x402Service } from './x402.js';
export { oxapayService } from './oxapay.js';
export { cashuService } from './cashu.js';
export { breezService } from './breez.js';

// Legacy exports for backwards compatibility
export { oxapayService as coinremitterService } from './oxapay.js';
export { breezService as albyService } from './breez.js';
export { breezService as zbdService } from './breez.js';

export interface CreateDepositRequest {
  agentId: string;
  amount: number;
  currency: 'USDC' | 'USDT' | 'BTC' | 'BTC_LIGHTNING';
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
      // Use OxaPay for on-chain BTC (more accessible than Lightning)
      const result = await oxapayService.createDeposit({
        amount: request.amount,
        agentId: request.agentId,
        description: request.description,
        currency: 'BTC', // On-chain BTC
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        deposit: {
          ...result.deposit,
          currency: 'BTC',
        },
        paymentInstructions: {
          currency: 'BTC',
          network: 'base' as PaymentNetwork, // OxaPay handles multiple networks
          url: result.invoice?.paymentUrl,
          amount: request.amount,
          expiresAt: result.deposit?.expiresAt || undefined,
          qrData: result.invoice?.paymentUrl,
        },
      };
    }

    case 'BTC_LIGHTNING': {
      // Use Cashu for Lightning BTC - no KYC, privacy-preserving ecash
      // Convert USD to sats (Cashu expects sats)
      const amountSats = usdToSats(request.amount);

      const result = await cashuService.createDeposit({
        amount: amountSats, // Amount in sats
        agentId: request.agentId,
        description: request.description,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        deposit: {
          id: result.quote?.quoteId,
          agentId: request.agentId,
          amount: request.amount, // Store USD amount
          amountSats: amountSats, // CRITICAL: Store sats amount for minting proofs
          bolt11: result.quote?.bolt11, // CRITICAL: Store invoice for recovery/tracking
          externalId: result.quote?.quoteId, // CRITICAL: Quote ID for verification
          currency: 'BTC',
          status: 'pending',
          provider: 'cashu',
          createdAt: new Date(),
          expiresAt: result.quote?.expiresAt,
        },
        paymentInstructions: {
          currency: 'BTC',
          network: 'lightning',
          address: result.quote?.bolt11, // Lightning invoice
          amount: request.amount, // USD amount for display
          amountRaw: `${amountSats} sats`, // Sats for clarity
          expiresAt: result.quote?.expiresAt,
          qrData: result.quote?.bolt11, // Lightning invoice for QR
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDT, BTC (on-chain), BTC_LIGHTNING`,
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
      // BTC withdrawals via Cashu require stored proofs
      // This is handled at a higher level in the payment tools
      // where we track agent's ecash proofs in Firestore
      return {
        success: false,
        error: 'BTC withdrawal requires proofs. Use withdraw_crypto tool with stored Cashu proofs.',
      };
    }

    default:
      return {
        success: false,
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDT, BTC (on-chain), BTC_LIGHTNING`,
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
      configured: cashuService.config.configured,
      network: 'Lightning (Cashu)',
      provider: 'Cashu ecash',
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
  cashu: cashuService,
  breez: breezService, // Legacy, kept for backwards compatibility
};
