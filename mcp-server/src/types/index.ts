export type EscrowStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type Currency = 'USD' | 'USDC' | 'USDT' | 'BTC';

// Payment networks
export type PaymentNetwork = 'base' | 'trc20' | 'lightning';

// Deposit record
export interface Deposit {
  id: string;
  agentId: string;
  amount: number;
  currency: Currency;
  network: PaymentNetwork;
  status: 'pending' | 'confirming' | 'completed' | 'expired' | 'failed';
  // Payment provider details
  provider: 'x402' | 'oxapay' | 'alby' | 'coinremitter' | 'zbd'; // oxapay/alby are new, coinremitter/zbd for legacy
  externalId: string | null; // Invoice ID from provider
  paymentAddress: string | null; // Address or invoice string
  paymentUrl: string | null; // Payment page URL if available
  // Timestamps
  createdAt: Date;
  expiresAt: Date | null;
  completedAt: Date | null;
  // Metadata
  txHash: string | null;
}

export type SubscriptionTier = 'free' | 'verified' | 'pro';

export interface Escrow {
  id: string;
  clientAgentId: string;
  providerAgentId: string;
  taskDescription: string;
  amount: number;
  fee: number;
  feeRate: number;
  currency: Currency;
  status: EscrowStatus;
  createdAt: Date;
  completedAt: Date | null;
  proofOfWork: string | null;
  disputeReason: string | null;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  createdAt: Date;
  verified: boolean;
  subscriptionTier: SubscriptionTier;
  stats: AgentStats;
  // Beta: Auth and balance
  apiKeyHash: string;
  balance: number;
  // Payment addresses (optional, set by agent)
  wallets?: {
    base?: string; // 0x... address for USDC on Base
    trc20?: string; // T... address for USDT on Tron
    lightning?: string; // Lightning address (user@domain) or node pubkey
  };
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Withdrawal {
  id: string;
  agentId: string;
  amount: number;
  currency: Currency;
  status: WithdrawalStatus;
  paymentMethod: string; // e.g., "PayPal: email@example.com"
  requestedAt: Date;
  processedAt: Date | null;
  notes: string | null;
}

export interface AgentStats {
  tasksCompleted: number;
  totalEarned: number;
  successRate: number;
  avgCompletionTime: number;
  disputeCount: number;
  disputeRate: number;
}

export interface Task {
  id: string;
  escrowId: string;
  description: string;
  clientAgentId: string;
  providerAgentId: string;
  status: 'pending' | 'claimed' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  claimedAt: Date | null;
  completedAt: Date | null;
  result: string | null;
}
