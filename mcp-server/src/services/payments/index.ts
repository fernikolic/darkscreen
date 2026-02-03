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
import { breezSparkService } from './breez-spark.js';
import { circleService } from './circle.js';
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
export { breezSparkService } from './breez-spark.js';
export { circleService } from './circle.js';

// Legacy exports for backwards compatibility
export { oxapayService as coinremitterService } from './oxapay.js';
export { breezService as albyService } from './breez.js';
export { breezService as zbdService } from './breez.js';

export interface CreateDepositRequest {
  agentId: string;
  amount: number;
  currency: 'USDC' | 'USDC_CIRCLE' | 'USDT' | 'BTC' | 'BTC_LIGHTNING';
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

    case 'USDC_CIRCLE': {
      // USDC via Circle Developer-Controlled Wallets (gas-free)
      const result = await circleService.createDeposit({
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
          qrData: result.paymentDetails?.payTo,
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
      // Use Breez Spark for Lightning BTC - self-custodial
      const amountSats = usdToSats(request.amount);

      // Ensure agent has a wallet, create if not
      if (!breezSparkService.hasWallet(request.agentId)) {
        const walletResult = await breezSparkService.createWallet(request.agentId);
        if (!walletResult.success) {
          return { success: false, error: walletResult.error };
        }
      }

      // Create Lightning invoice
      const result = await breezSparkService.receivePayment(
        request.agentId,
        'lightning',
        amountSats,
        request.description || `Deposit for ${request.agentId}`
      );

      if (!result.success) {
        // Fallback to Cashu if Breez fails
        const cashuResult = await cashuService.createDeposit({
          amount: amountSats,
          agentId: request.agentId,
          description: request.description,
        });

        if (!cashuResult.success) {
          return { success: false, error: result.error || cashuResult.error };
        }

        return {
          success: true,
          deposit: {
            id: cashuResult.quote?.quoteId,
            agentId: request.agentId,
            amount: request.amount,
            amountSats: amountSats,
            bolt11: cashuResult.quote?.bolt11,
            externalId: cashuResult.quote?.quoteId,
            currency: 'BTC',
            status: 'pending',
            provider: 'cashu',
            createdAt: new Date(),
            expiresAt: cashuResult.quote?.expiresAt,
          },
          paymentInstructions: {
            currency: 'BTC',
            network: 'lightning',
            address: cashuResult.quote?.bolt11,
            amount: request.amount,
            amountRaw: `${amountSats} sats`,
            expiresAt: cashuResult.quote?.expiresAt,
            qrData: cashuResult.quote?.bolt11,
          },
        };
      }

      // Generate unique deposit ID
      const depositId = `breez_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      return {
        success: true,
        deposit: {
          id: depositId,
          agentId: request.agentId,
          amount: request.amount,
          amountSats: amountSats,
          bolt11: result.invoice,
          currency: 'BTC',
          status: 'pending',
          provider: 'breez',
          createdAt: new Date(),
        },
        paymentInstructions: {
          currency: 'BTC',
          network: 'lightning',
          address: result.invoice,
          amount: request.amount,
          amountRaw: `${amountSats} sats`,
          qrData: result.invoice,
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDC_CIRCLE, USDT, BTC, BTC_LIGHTNING`,
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
        error: `Unsupported currency: ${request.currency}. Supported: USDC, USDC_CIRCLE, USDT, BTC, BTC_LIGHTNING`,
      };
  }
}

/**
 * Get configuration status for all payment providers
 */
export function getPaymentConfig(): {
  usdc: { configured: boolean; network: string; provider: string };
  usdc_circle: { configured: boolean; network: string; provider: string };
  usdt: { configured: boolean; network: string; provider: string };
  btc: { configured: boolean; network: string; provider: string };
} {
  // Prefer Breez Spark if configured, fall back to Cashu
  const btcConfigured = breezSparkService.config.configured || cashuService.config.configured;
  const btcProvider = breezSparkService.config.configured ? 'Breez Spark (self-custodial)' : 'Cashu ecash';

  return {
    usdc: {
      configured: !!x402Service.config.walletAddress,
      network: 'Base L2',
      provider: 'x402 (Coinbase)',
    },
    usdc_circle: {
      configured: circleService.config.configured,
      network: circleService.config.chain || 'BASE-SEPOLIA',
      provider: 'Circle (gas-free)',
    },
    usdt: {
      configured: oxapayService.config.configured,
      network: 'Tron TRC-20',
      provider: 'OxaPay',
    },
    btc: {
      configured: btcConfigured,
      network: 'Lightning',
      provider: btcProvider,
    },
  };
}

export const paymentService = {
  createDeposit,
  sendWithdrawal,
  getConfig: getPaymentConfig,
  // Individual services for advanced use
  x402: x402Service,
  circle: circleService, // Gas-free USDC
  oxapay: oxapayService,
  cashu: cashuService,
  breez: breezService, // Legacy
  breezSpark: breezSparkService, // Self-custodial Lightning
};
