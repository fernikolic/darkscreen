export type EscrowStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type Currency = 'USD' | 'USDC' | 'BTC';

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
