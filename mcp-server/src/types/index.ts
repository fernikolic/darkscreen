export type EscrowStatus =
  | 'pending_payment'  // Awaiting funding (invoice generated)
  | 'pending'          // Funded, ready for work
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
  network?: PaymentNetwork;
  status: 'pending' | 'confirming' | 'completed' | 'expired' | 'failed';
  // Payment provider details
  provider: 'x402' | 'oxapay' | 'cashu' | 'breez' | 'alby' | 'coinremitter' | 'zbd' | 'circle' | 'manual';
  externalId?: string | null; // Invoice ID from provider
  paymentAddress?: string | null; // Address or invoice string
  paymentUrl?: string | null; // Payment page URL if available
  // Cashu-specific fields (BTC Lightning deposits)
  bolt11?: string; // Lightning invoice - MUST be stored for recovery
  amountSats?: number; // Amount in satoshis - needed to mint proofs
  proofs?: any[]; // Cashu ecash proofs (tokens) - this IS the money
  // Timestamps
  createdAt: Date;
  expiresAt?: Date | null;
  completedAt?: Date | null;
  // Metadata
  txHash?: string | null;
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
  // Payment tracking (for pending_payment escrows)
  paymentInvoice?: string | null;      // Lightning invoice or payment URL
  paymentDepositId?: string | null;    // Links to deposits collection
  paymentExpiresAt?: Date | null;      // Invoice expiration
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
  // Nostr identity (NIP-05)
  nostrPubkey?: string; // hex format public key
  nip05?: string; // e.g., "agentname@clawdentials.com"
  // Moltbook integration
  moltbookId?: string; // Moltbook agent ID
  moltbookKarma?: number; // Karma at time of linking
  // Custodial wallet - Clawdentials controls, releases on escrow completion
  custodialWalletId?: string; // Internal wallet ID (cw_xxx)
  depositAddress?: string; // Display address for deposits (clw1xxx)
  // Payment addresses (optional, set by agent for withdrawals)
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

// ============ BOUNTY TYPES ============

export type BountyStatus =
  | 'draft'        // Created but not funded
  | 'open'         // Funded, accepting claims
  | 'claimed'      // Agent claimed, working on it
  | 'in_review'    // Submitted, awaiting mod judgment
  | 'completed'    // Winner crowned, paid out
  | 'expired'      // Deadline passed, no winner
  | 'cancelled';   // Poster cancelled (refund if funded)

export type BountyDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'expert';

export type SubmissionMethod = 'pr' | 'patch' | 'gist' | 'proof';

export interface BountyFile {
  path: string;
  description?: string;
}

export interface BountyClaim {
  agentId: string;
  claimedAt: Date;
  expiresAt: Date;        // Claim lock expires (e.g., 24h)
  submissionUrl?: string; // PR, gist, etc.
  submittedAt?: Date;
  notes?: string;
  status: 'active' | 'submitted' | 'expired' | 'withdrawn';
}

export interface Bounty {
  id: string;

  // Core info
  title: string;
  description: string;           // Markdown, the full PRD
  summary: string;               // 1-3 sentence summary

  // Categorization
  difficulty: BountyDifficulty;
  requiredSkills: string[];
  tags?: string[];

  // Context
  repoUrl?: string;
  files?: BountyFile[];
  acceptanceCriteria: string[];  // Checkboxes from the spec

  // Submission
  submissionMethod: SubmissionMethod;
  targetBranch?: string;

  // Reward
  amount: number;
  currency: Currency;
  escrowId?: string;             // Links to escrows collection when funded

  // Timing
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;

  // Ownership
  posterAgentId: string;         // Who posted it
  modAgentId?: string;           // Who judges (null = human/poster)

  // State
  status: BountyStatus;
  claims: BountyClaim[];         // All claims (active + historical)
  winnerAgentId?: string;        // Who won
  winnerSubmissionUrl?: string;

  // Metadata
  viewCount: number;
  claimCount: number;
}

// Lightweight version for listings
export interface BountyListing {
  id: string;
  title: string;
  summary: string;
  amount: number;
  currency: Currency;
  difficulty: BountyDifficulty;
  requiredSkills: string[];
  status: BountyStatus;
  expiresAt: Date;
  claimCount: number;
  posterAgentId: string;
}
