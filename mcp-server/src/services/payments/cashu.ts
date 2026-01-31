/**
 * Cashu Payment Service
 *
 * Cashu is a free and open-source ecash protocol built for Bitcoin.
 * - No KYC required
 * - Privacy-preserving (ecash tokens are anonymous)
 * - Lightning Network compatible
 * - Self-custodial
 *
 * @see https://cashu.space
 * @see https://github.com/cashubtc/cashu-ts
 */

import { CashuWallet, CashuMint, getEncodedToken, getDecodedToken } from '@cashu/cashu-ts';

// Type for Cashu proofs (ecash tokens)
export interface CashuProof {
  id: string;
  amount: number;
  secret: string;
  C: string;
}

// Default public mint - Minibits is reliable and well-known
const DEFAULT_MINT_URL = process.env.CASHU_MINT_URL || 'https://mint.minibits.cash/Bitcoin';

// Wallet instance (lazy initialized)
let wallet: CashuWallet | null = null;

/**
 * Get or create the Cashu wallet instance
 */
async function getWallet(): Promise<CashuWallet> {
  if (!wallet) {
    const mint = new CashuMint(DEFAULT_MINT_URL);
    wallet = new CashuWallet(mint);
    await wallet.loadMint();
  }
  return wallet;
}

/**
 * Configuration status
 */
export const config = {
  get configured(): boolean {
    return true; // Cashu works with any public mint, no API key needed
  },
  get mintUrl(): string {
    return DEFAULT_MINT_URL;
  },
};

export interface CashuDepositResult {
  success: boolean;
  quote?: {
    quoteId: string;
    bolt11: string; // Lightning invoice to pay
    amount: number; // Amount in sats
    expiresAt?: Date;
  };
  error?: string;
}

export interface CashuDepositStatus {
  success: boolean;
  paid: boolean;
  proofs?: CashuProof[]; // Ecash proofs (tokens) - store these!
  error?: string;
}

export interface CashuPaymentResult {
  success: boolean;
  paid?: boolean;
  preimage?: string; // Payment preimage (proof of payment)
  feePaid?: number; // Fee in sats
  change?: CashuProof[]; // Change proofs to keep
  error?: string;
}

export interface CashuSendResult {
  success: boolean;
  token?: string; // Cashu token string (cashuA... or cashuB...)
  change?: CashuProof[]; // Change proofs to keep
  error?: string;
}

/**
 * Create a deposit request (Lightning invoice)
 *
 * Returns a Lightning invoice that, when paid, will mint ecash tokens.
 * After payment, call checkDepositAndMint to get the proofs.
 */
export async function createDeposit(request: {
  amount: number; // Amount in sats
  agentId: string;
  description?: string;
}): Promise<CashuDepositResult> {
  try {
    const w = await getWallet();

    // Create a mint quote (Lightning invoice)
    const quote = await w.createMintQuote(request.amount);

    return {
      success: true,
      quote: {
        quoteId: quote.quote,
        bolt11: quote.request, // The Lightning invoice
        amount: request.amount,
        expiresAt: quote.expiry ? new Date(quote.expiry * 1000) : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Cashu deposit',
    };
  }
}

/**
 * Check if a deposit was paid and mint the tokens
 *
 * Call this after the Lightning invoice has been paid.
 * Returns the ecash proofs which MUST be stored - they are the money!
 */
export async function checkDepositAndMint(quoteId: string, amount: number): Promise<CashuDepositStatus> {
  try {
    const w = await getWallet();

    // Check the quote status
    const quote = await w.checkMintQuote(quoteId);

    if (quote.state === 'PAID') {
      // Invoice was paid - mint the proofs
      const proofs = await w.mintProofs(amount, quoteId);

      return {
        success: true,
        paid: true,
        proofs: proofs as CashuProof[], // Store these! They are the ecash tokens
      };
    } else if (quote.state === 'ISSUED') {
      // Proofs were already minted (shouldn't happen in normal flow)
      return {
        success: true,
        paid: true,
        proofs: [], // Already minted, proofs were returned before
      };
    } else {
      // Not paid yet
      return {
        success: true,
        paid: false,
      };
    }
  } catch (error) {
    return {
      success: false,
      paid: false,
      error: error instanceof Error ? error.message : 'Failed to check Cashu deposit',
    };
  }
}

/**
 * Pay a Lightning invoice using ecash proofs
 *
 * @param invoice - The Lightning invoice (bolt11) to pay
 * @param proofs - Ecash proofs to spend
 * @returns Payment result with preimage and any change proofs
 */
export async function payInvoice(
  invoice: string,
  proofs: CashuProof[]
): Promise<CashuPaymentResult> {
  try {
    const w = await getWallet();

    // Get a quote for paying this invoice
    const meltQuote = await w.createMeltQuote(invoice);

    // Calculate total proof value
    const totalProofValue = proofs.reduce((sum: number, p: CashuProof) => sum + p.amount, 0);
    const requiredAmount = meltQuote.amount + meltQuote.fee_reserve;

    if (totalProofValue < requiredAmount) {
      return {
        success: false,
        error: `Insufficient funds: have ${totalProofValue} sats, need ${requiredAmount} sats (${meltQuote.amount} + ${meltQuote.fee_reserve} fee)`,
      };
    }

    // Pay the invoice
    const result = await w.meltProofs(meltQuote, proofs);

    const changeAmount = result.change?.reduce((s: number, p: any) => s + p.amount, 0) || 0;

    return {
      success: true,
      paid: result.quote.state === 'PAID',
      preimage: result.quote.payment_preimage || undefined,
      feePaid: meltQuote.fee_reserve - changeAmount,
      change: result.change as CashuProof[], // Return these to the user's balance
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pay Lightning invoice',
    };
  }
}

/**
 * Create a Cashu token for sending to another user
 *
 * This creates an ecash token string that can be sent off-chain.
 * The recipient can receive it using receiveToken().
 */
export async function sendToken(
  amount: number,
  proofs: CashuProof[]
): Promise<CashuSendResult> {
  try {
    const w = await getWallet();

    const result = await w.send(amount, proofs);

    // Encode the proofs to send as a token string
    const token = result.send ? getEncodedToken({
      mint: DEFAULT_MINT_URL,
      proofs: result.send,
    }) : undefined;

    return {
      success: true,
      token,
      change: result.keep as CashuProof[],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Cashu token',
    };
  }
}

/**
 * Receive a Cashu token
 *
 * Validates and claims the ecash token, returning new proofs.
 */
export async function receiveToken(token: string): Promise<{
  success: boolean;
  proofs?: CashuProof[];
  amount?: number;
  error?: string;
}> {
  try {
    const w = await getWallet();

    const proofs = await w.receive(token);
    const amount = proofs.reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      success: true,
      proofs: proofs as CashuProof[],
      amount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to receive Cashu token',
    };
  }
}

/**
 * Calculate total balance from proofs
 */
export function calculateBalance(proofs: CashuProof[]): number {
  return proofs.reduce((sum: number, p: CashuProof) => sum + p.amount, 0);
}

/**
 * Check which proofs are still spendable
 *
 * Proofs can become spent if:
 * - They were used in a transaction
 * - They were double-spent by someone else (if token was shared)
 */
export async function checkProofsSpendable(proofs: CashuProof[]): Promise<{
  spendable: CashuProof[];
  spent: CashuProof[];
}> {
  try {
    const w = await getWallet();
    const states = await w.checkProofsStates(proofs);

    const spendable: CashuProof[] = [];
    const spent: CashuProof[] = [];

    states.forEach((state, index) => {
      if (state.state === 'UNSPENT') {
        spendable.push(proofs[index]);
      } else {
        spent.push(proofs[index]);
      }
    });

    return { spendable, spent };
  } catch (error) {
    // If we can't check, assume all are spendable
    return {
      spendable: proofs,
      spent: [],
    };
  }
}

export const cashuService = {
  config,
  createDeposit,
  checkDepositAndMint,
  payInvoice,
  sendToken,
  receiveToken,
  calculateBalance,
  checkProofsSpendable,
};
