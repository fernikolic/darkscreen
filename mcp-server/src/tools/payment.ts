/**
 * Payment MCP Tools
 *
 * Tools for deposits and withdrawals in USDC, USDT, and BTC
 */

import {
  paymentService,
  getPaymentConfig,
  oxapayService,
  cashuService,
} from '../services/payments/index.js';
import {
  validateApiKey,
  getAgent,
  creditBalance,
  createWithdrawal,
  getBalance,
} from '../services/firestore.js';
import { collections, getDb } from '../services/firestore.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Deposit } from '../types/index.js';

// ============ DEPOSIT TOOLS ============

export const paymentTools = {
  /**
   * Create a deposit request (USDC, USDT, or BTC)
   */
  deposit_create: {
    description:
      'Create a deposit request to add funds to your Clawdentials balance. Returns payment instructions (address/invoice) for the selected currency. Supported: USDC (Base), USDT (TRC-20), BTC (on-chain via OxaPay), BTC_LIGHTNING (Lightning Network via Cashu).',
    handler: async (args: {
      agentId: string;
      apiKey: string;
      amount: number;
      currency: 'USDC' | 'USDT' | 'BTC' | 'BTC_LIGHTNING';
    }) => {
      // Validate API key
      const isValid = await validateApiKey(args.agentId, args.apiKey);
      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      // Validate amount
      if (args.amount <= 0) {
        return { success: false, error: 'Amount must be positive' };
      }

      // Minimum amounts
      const minimums: Record<string, number> = {
        USDC: 1,
        USDT: 1,
        BTC: 5, // $5 minimum for on-chain BTC (due to fees)
        BTC_LIGHTNING: 0.5, // ~500 sats minimum for Lightning
      };

      if (args.amount < minimums[args.currency]) {
        return {
          success: false,
          error: `Minimum deposit for ${args.currency}: $${minimums[args.currency]}`,
        };
      }

      // Create deposit request
      const result = await paymentService.createDeposit({
        agentId: args.agentId,
        amount: args.amount,
        currency: args.currency,
        description: `Deposit for agent ${args.agentId}`,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Store deposit record in Firestore
      if (result.deposit) {
        const depositRef = collections.deposits
          ? collections.deposits().doc(result.deposit.id as string)
          : getDb().collection('deposits').doc(result.deposit.id as string);

        await depositRef.set({
          ...result.deposit,
          createdAt: Timestamp.fromDate(result.deposit.createdAt as Date),
          expiresAt: result.deposit.expiresAt
            ? Timestamp.fromDate(result.deposit.expiresAt as Date)
            : null,
        });
      }

      return {
        success: true,
        depositId: result.deposit?.id,
        currency: args.currency,
        amount: args.amount,
        paymentInstructions: result.paymentInstructions,
        message: getPaymentMessage(args.currency, result.paymentInstructions),
      };
    },
  },

  /**
   * Check deposit status - verifies with payment provider and auto-credits if paid
   */
  deposit_status: {
    description:
      'Check the status of a deposit request. If payment is confirmed, balance is automatically credited.',
    handler: async (args: { depositId: string }) => {
      const depositRef = getDb().collection('deposits').doc(args.depositId);
      const doc = await depositRef.get();

      if (!doc.exists) {
        return { success: false, error: 'Deposit not found' };
      }

      const data = doc.data()!;
      let currentStatus = data.status;
      let completedAt = data.completedAt;
      let txHash = data.txHash;
      let balanceCredited = false;

      // If deposit is still pending, check with the payment provider
      if (currentStatus === 'pending' || currentStatus === 'confirming') {
        const verificationResult = await verifyDepositWithProvider(data);

        if (verificationResult.paid) {
          // Payment confirmed! Update deposit and credit balance
          currentStatus = 'completed';
          completedAt = Timestamp.fromDate(new Date());
          txHash = verificationResult.txId || null;

          // Credit the agent's balance
          await creditBalance(data.agentId, data.amount, `Deposit ${args.depositId} confirmed`);
          balanceCredited = true;

          // Update deposit record
          await depositRef.update({
            status: 'completed',
            completedAt,
            txHash,
          });
        } else if (verificationResult.status === 'expired' || verificationResult.status === 'failed') {
          currentStatus = verificationResult.status;
          await depositRef.update({ status: currentStatus });
        } else if (verificationResult.status === 'confirming') {
          currentStatus = 'confirming';
          await depositRef.update({ status: 'confirming' });
        }
      }

      const response: any = {
        success: true,
        deposit: {
          id: doc.id,
          agentId: data.agentId,
          amount: data.amount,
          currency: data.currency,
          network: data.network,
          status: currentStatus,
          provider: data.provider,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
          completedAt: completedAt?.toDate?.() || completedAt,
          txHash,
        },
      };

      if (balanceCredited) {
        const newBalance = await getBalance(data.agentId);
        response.message = `Payment confirmed! $${data.amount} credited to your balance.`;
        response.newBalance = newBalance;

        // Check if this deposit is linked to an escrow and activate it
        if (data.escrowId) {
          const escrowRef = getDb().collection('escrows').doc(data.escrowId);
          const escrowDoc = await escrowRef.get();
          if (escrowDoc.exists && escrowDoc.data()?.status === 'pending_payment') {
            // Activate the escrow
            await escrowRef.update({
              status: 'pending',
              paymentCompletedAt: Timestamp.fromDate(new Date()),
            });
            response.escrowActivated = true;
            response.escrowId = data.escrowId;
            response.message += ` Escrow ${data.escrowId} is now active!`;
          }
        }

        // Check if this deposit is linked to a bounty and fund it
        if (data.bountyId) {
          const bountyRef = getDb().collection('bounties').doc(data.bountyId);
          const bountyDoc = await bountyRef.get();
          if (bountyDoc.exists && bountyDoc.data()?.status === 'draft') {
            // Fund and open the bounty
            await bountyRef.update({
              status: 'open',
              escrowId: `bounty_${data.bountyId}`,
              paymentCompletedAt: Timestamp.fromDate(new Date()),
            });
            response.bountyFunded = true;
            response.bountyId = data.bountyId;
            response.message += ` Bounty ${data.bountyId} is now open for claims!`;
          }
        }
      }

      return response;
    },
  },

  /**
   * Get payment configuration status
   */
  payment_config: {
    description:
      'Check which payment methods are configured and available for deposits/withdrawals.',
    handler: async () => {
      const config = getPaymentConfig();
      return {
        success: true,
        paymentMethods: config,
        supported: {
          USDC: config.usdc.configured,
          USDT: config.usdt.configured,
          BTC: config.btc.configured,
        },
      };
    },
  },

  /**
   * Request crypto withdrawal
   */
  withdraw_crypto: {
    description:
      'Request a withdrawal in cryptocurrency. Provide your wallet address (USDC/USDT) or Lightning invoice/address (BTC).',
    handler: async (args: {
      agentId: string;
      apiKey: string;
      amount: number;
      currency: 'USDC' | 'USDT' | 'BTC';
      destination: string; // Wallet address or Lightning invoice/address
    }) => {
      // BETA: Withdrawals require manual approval during beta period
      // This ensures escrow integrity while we finalize the payment infrastructure
      const WITHDRAWALS_ENABLED = false;
      if (!WITHDRAWALS_ENABLED) {
        return {
          success: false,
          error: 'Withdrawals are temporarily paused during beta. Your balance is safe and will be available for withdrawal soon. Contact support@clawdentials.com for urgent requests.',
          balance: await getBalance(args.agentId),
          status: 'beta_paused',
        };
      }

      // Validate API key
      const isValid = await validateApiKey(args.agentId, args.apiKey);
      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      // Validate amount
      if (args.amount <= 0) {
        return { success: false, error: 'Amount must be positive' };
      }

      // Check balance
      const balance = await getBalance(args.agentId);
      if (balance < args.amount) {
        return {
          success: false,
          error: `Insufficient balance: have $${balance}, need $${args.amount}`,
        };
      }

      // Validate destination format
      const validationError = validateDestination(args.currency, args.destination);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Create withdrawal record (this debits balance)
      const withdrawal = await createWithdrawal(
        args.agentId,
        args.amount,
        args.currency,
        `${args.currency}: ${args.destination}`
      );

      // Attempt automatic withdrawal
      const sendResult = await paymentService.sendWithdrawal({
        currency: args.currency,
        amount: args.amount,
        destination: args.destination,
      });

      if (sendResult.success) {
        // Update withdrawal status to completed
        const withdrawalRef = getDb().collection('withdrawals').doc(withdrawal.id);
        await withdrawalRef.update({
          status: 'completed',
          processedAt: Timestamp.fromDate(new Date()),
          notes: `Auto-processed. TxID: ${sendResult.txId}`,
        });

        return {
          success: true,
          withdrawalId: withdrawal.id,
          status: 'completed',
          txId: sendResult.txId,
          message: `Withdrawal of $${args.amount} ${args.currency} sent successfully.`,
        };
      } else {
        // Withdrawal created but needs manual processing
        return {
          success: true,
          withdrawalId: withdrawal.id,
          status: 'pending',
          message: `Withdrawal request created. ${sendResult.error || 'Will be processed manually.'}`,
          newBalance: balance - args.amount,
        };
      }
    },
  },

  /**
   * Set wallet addresses for an agent
   */
  agent_set_wallets: {
    description:
      'Set your wallet addresses for receiving withdrawals. You can set addresses for USDC (Base), USDT (TRC-20), and BTC (Lightning Address).',
    handler: async (args: {
      agentId: string;
      apiKey: string;
      baseAddress?: string; // 0x... for USDC on Base
      trc20Address?: string; // T... for USDT on Tron
      lightningAddress?: string; // user@domain for BTC
    }) => {
      // Validate API key
      const isValid = await validateApiKey(args.agentId, args.apiKey);
      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      const wallets: Record<string, string> = {};

      // Validate and set Base address
      if (args.baseAddress) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(args.baseAddress)) {
          return { success: false, error: 'Invalid Base address format. Expected: 0x...' };
        }
        wallets.base = args.baseAddress;
      }

      // Validate and set TRC-20 address
      if (args.trc20Address) {
        if (!/^T[a-zA-Z0-9]{33}$/.test(args.trc20Address)) {
          return { success: false, error: 'Invalid TRC-20 address format. Expected: T...' };
        }
        wallets.trc20 = args.trc20Address;
      }

      // Validate and set Lightning address
      if (args.lightningAddress) {
        if (!args.lightningAddress.includes('@')) {
          return {
            success: false,
            error: 'Invalid Lightning Address format. Expected: user@domain.com',
          };
        }
        wallets.lightning = args.lightningAddress;
      }

      if (Object.keys(wallets).length === 0) {
        return { success: false, error: 'No wallet addresses provided' };
      }

      // Update agent record
      const agentRef = getDb().collection('agents').doc(args.agentId);
      const agent = await getAgent(args.agentId);

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      const existingWallets = (agent as any).wallets || {};
      const updatedWallets = { ...existingWallets, ...wallets };

      await agentRef.update({ wallets: updatedWallets });

      return {
        success: true,
        wallets: updatedWallets,
        message: 'Wallet addresses updated successfully.',
      };
    },
  },
};

/**
 * Generate a human-readable payment message
 */
function getPaymentMessage(
  currency: string,
  instructions?: { address?: string; url?: string; amount: number; expiresAt?: Date }
): string {
  if (!instructions) {
    return 'Payment instructions unavailable.';
  }

  const expiry = instructions.expiresAt
    ? ` Expires: ${instructions.expiresAt.toISOString()}`
    : '';

  switch (currency) {
    case 'USDC':
      return `Send ${instructions.amount} USDC to ${instructions.address} on Base network.${expiry}`;

    case 'USDT':
      if (instructions.url) {
        return `Pay ${instructions.amount} USDT at: ${instructions.url}${expiry}`;
      }
      return `Send ${instructions.amount} USDT to ${instructions.address} on Tron (TRC-20).${expiry}`;

    case 'BTC':
      return `Pay this Lightning invoice: ${instructions.address?.substring(0, 50)}...${expiry}`;

    default:
      return `Send ${instructions.amount} ${currency} to ${instructions.address}`;
  }
}

/**
 * Validate destination address format
 */
function validateDestination(currency: string, destination: string): string | null {
  switch (currency) {
    case 'USDC':
      if (!/^0x[a-fA-F0-9]{40}$/.test(destination)) {
        return 'Invalid Base/EVM address. Expected format: 0x...';
      }
      break;

    case 'USDT':
      if (!/^T[a-zA-Z0-9]{33}$/.test(destination)) {
        return 'Invalid TRC-20 address. Expected format: T...';
      }
      break;

    case 'BTC':
      // Accept Lightning invoice (lnbc...) or Lightning Address (user@domain)
      if (!destination.startsWith('lnbc') && !destination.includes('@')) {
        return 'Invalid Lightning destination. Provide a Lightning invoice (lnbc...) or Lightning Address (user@domain).';
      }
      break;
  }

  return null;
}

/**
 * Verify deposit with payment provider
 */
async function verifyDepositWithProvider(deposit: any): Promise<{
  paid: boolean;
  status: string;
  txId?: string;
}> {
  const provider = deposit.provider;
  const externalId = deposit.externalId;

  // Check if deposit has expired
  if (deposit.expiresAt) {
    const expiresAt = deposit.expiresAt?.toDate?.() || deposit.expiresAt;
    if (new Date() > expiresAt) {
      return { paid: false, status: 'expired' };
    }
  }

  switch (provider) {
    case 'oxapay': {
      // USDT via OxaPay
      if (!externalId) {
        return { paid: false, status: 'pending' };
      }

      const result = await oxapayService.getPaymentStatus(externalId);
      if (!result.success) {
        return { paid: false, status: 'pending' };
      }

      // OxaPay statuses: Waiting, Confirming, Paid, Failed, Expired
      if (result.paid) {
        return { paid: true, status: 'completed', txId: result.txId };
      } else if (result.status === 'Confirming') {
        return { paid: false, status: 'confirming' };
      } else if (result.status === 'Failed') {
        return { paid: false, status: 'failed' };
      } else if (result.status === 'Expired') {
        return { paid: false, status: 'expired' };
      }
      return { paid: false, status: 'pending' };
    }

    case 'x402': {
      // USDC via x402 - manual verification for now
      // TODO: Add Base RPC verification when needed
      return { paid: false, status: 'pending' };
    }

    case 'breez': {
      // BTC via Breez - SDK handles verification internally
      // For now, return pending (Breez callbacks would update this)
      return { paid: false, status: 'pending' };
    }

    case 'cashu': {
      // BTC via Cashu (Lightning)
      // Check if invoice was paid and mint proofs
      if (!externalId) {
        return { paid: false, status: 'pending' };
      }

      const amountSats = deposit.amountSats || deposit.amount;
      const result = await cashuService.checkDepositAndMint(externalId, amountSats);

      if (!result.success) {
        return { paid: false, status: 'pending' };
      }

      if (result.paid) {
        // Store the proofs in the deposit record - they ARE the money
        if (result.proofs && result.proofs.length > 0) {
          const depositRef = getDb().collection('deposits').doc(deposit.id);
          await depositRef.update({
            proofs: result.proofs,
          });
        }
        return { paid: true, status: 'completed' };
      }

      return { paid: false, status: 'pending' };
    }

    default:
      return { paid: false, status: 'pending' };
  }
}
