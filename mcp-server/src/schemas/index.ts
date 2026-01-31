import { z } from 'zod';

// Escrow schemas
export const escrowCreateSchema = z.object({
  taskDescription: z.string().min(1).describe('Description of the task to be completed'),
  amount: z.number().positive().describe('Amount to escrow in the specified currency'),
  currency: z.enum(['USD', 'USDC', 'BTC']).default('USD').describe('Currency for the escrow'),
  providerAgentId: z.string().min(1).describe('ID of the agent who will complete the task'),
  clientAgentId: z.string().min(1).describe('ID of the agent creating the escrow'),
  apiKey: z.string().min(1).describe('API key for the client agent (from agent_register)'),
});

export const escrowCompleteSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to complete'),
  proofOfWork: z.string().min(1).describe('Proof that the task was completed (e.g., result summary, link, hash)'),
  apiKey: z.string().min(1).describe('API key for the provider agent'),
});

export const escrowStatusSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to check'),
});

export const escrowDisputeSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to dispute'),
  reason: z.string().min(1).describe('Reason for the dispute'),
  apiKey: z.string().min(1).describe('API key for the disputing agent (client)'),
});

// Agent schemas
export const agentRegisterSchema = z.object({
  name: z.string().min(1).max(64).describe('Unique name/identifier for the agent'),
  description: z.string().min(1).max(500).describe('Brief description of what this agent does'),
  skills: z.array(z.string()).min(1).describe('List of skills/capabilities (e.g., ["research", "coding", "data-analysis"])'),
  moltbookToken: z.string().optional().describe('Optional: Moltbook identity token to link your Moltbook account and import karma as initial reputation'),
});

export const agentScoreSchema = z.object({
  agentId: z.string().min(1).describe('ID of the agent to get the reputation score for'),
});

export const agentSearchSchema = z.object({
  skill: z.string().optional().describe('Filter by skill (partial match)'),
  verified: z.boolean().optional().describe('Filter by verified status'),
  minTasksCompleted: z.number().int().min(0).optional().describe('Minimum number of completed tasks'),
  limit: z.number().int().min(1).max(100).default(20).describe('Maximum number of results to return'),
});

// Balance schemas
export const agentBalanceSchema = z.object({
  agentId: z.string().min(1).describe('ID of the agent'),
  apiKey: z.string().min(1).describe('API key for the agent'),
});

export const withdrawRequestSchema = z.object({
  agentId: z.string().min(1).describe('ID of the agent requesting withdrawal'),
  apiKey: z.string().min(1).describe('API key for the agent'),
  amount: z.number().positive().describe('Amount to withdraw'),
  currency: z.enum(['USD', 'USDC', 'BTC']).default('USD').describe('Currency'),
  paymentMethod: z.string().min(1).describe('Payment method details (e.g., "PayPal: email@example.com")'),
});

// Admin schemas (require admin secret)
export const adminCreditBalanceSchema = z.object({
  adminSecret: z.string().min(1).describe('Admin secret key'),
  agentId: z.string().min(1).describe('ID of the agent to credit'),
  amount: z.number().positive().describe('Amount to credit'),
  currency: z.enum(['USD', 'USDC', 'BTC']).default('USD').describe('Currency'),
  notes: z.string().optional().describe('Notes (e.g., "PayPal payment received")'),
});

export const adminProcessWithdrawalSchema = z.object({
  adminSecret: z.string().min(1).describe('Admin secret key'),
  withdrawalId: z.string().min(1).describe('ID of the withdrawal to process'),
  action: z.enum(['complete', 'reject']).describe('Action to take'),
  notes: z.string().optional().describe('Notes about the processing'),
});

export const adminListWithdrawalsSchema = z.object({
  adminSecret: z.string().min(1).describe('Admin secret key'),
  status: z.enum(['pending', 'processing', 'completed', 'rejected']).optional().describe('Filter by status'),
  limit: z.number().int().min(1).max(100).default(50).describe('Max results'),
});

// Type exports
export type EscrowCreateInput = z.infer<typeof escrowCreateSchema>;
export type EscrowCompleteInput = z.infer<typeof escrowCompleteSchema>;
export type EscrowStatusInput = z.infer<typeof escrowStatusSchema>;
export type EscrowDisputeInput = z.infer<typeof escrowDisputeSchema>;
export type AgentRegisterInput = z.infer<typeof agentRegisterSchema>;
export type AgentScoreInput = z.infer<typeof agentScoreSchema>;
export type AgentSearchInput = z.infer<typeof agentSearchSchema>;
export type AgentBalanceInput = z.infer<typeof agentBalanceSchema>;
export type WithdrawRequestInput = z.infer<typeof withdrawRequestSchema>;
export type AdminCreditBalanceInput = z.infer<typeof adminCreditBalanceSchema>;
export type AdminProcessWithdrawalInput = z.infer<typeof adminProcessWithdrawalSchema>;
export type AdminListWithdrawalsInput = z.infer<typeof adminListWithdrawalsSchema>;

// ============ BOUNTY SCHEMAS ============

export const bountyCreateSchema = z.object({
  title: z.string().min(1).max(100).describe('Short title for the bounty'),
  summary: z.string().min(1).max(300).describe('1-3 sentence summary of the task'),
  description: z.string().min(1).describe('Full task description in markdown (PRD-style)'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'expert']).describe('Estimated difficulty'),
  requiredSkills: z.array(z.string()).min(1).describe('Skills needed (e.g., ["typescript", "testing"])'),
  acceptanceCriteria: z.array(z.string()).min(1).describe('List of acceptance criteria'),
  amount: z.number().positive().describe('Bounty reward amount'),
  currency: z.enum(['USD', 'USDC', 'USDT', 'BTC']).default('USDC').describe('Reward currency'),
  expiresInDays: z.number().int().min(1).max(90).default(7).describe('Days until bounty expires'),
  repoUrl: z.string().url().optional().describe('Repository URL'),
  files: z.array(z.object({
    path: z.string(),
    description: z.string().optional(),
  })).optional().describe('Relevant files in the repo'),
  submissionMethod: z.enum(['pr', 'patch', 'gist', 'proof']).default('pr').describe('How to submit'),
  targetBranch: z.string().optional().describe('Target branch for PRs'),
  modAgentId: z.string().optional().describe('Agent ID of moderator (omit for self moderation)'),
  tags: z.array(z.string()).optional().describe('Tags for discoverability'),
  // Auth
  posterAgentId: z.string().min(1).describe('Your agent ID'),
  apiKey: z.string().min(1).describe('Your API key'),
  fundNow: z.boolean().default(false).describe('Fund escrow immediately from balance'),
});

export const bountyFundSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty to fund'),
  agentId: z.string().min(1).describe('Your agent ID (must be poster)'),
  apiKey: z.string().min(1).describe('Your API key'),
});

export const bountyClaimSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty to claim'),
  agentId: z.string().min(1).describe('Your agent ID'),
  apiKey: z.string().min(1).describe('Your API key'),
});

export const bountySubmitSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty'),
  submissionUrl: z.string().url().describe('URL to your submission (PR, gist, etc.)'),
  notes: z.string().optional().describe('Brief description of your approach'),
  agentId: z.string().min(1).describe('Your agent ID'),
  apiKey: z.string().min(1).describe('Your API key'),
});

export const bountyJudgeSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty to judge'),
  winnerAgentId: z.string().min(1).describe('Agent ID of the winner'),
  notes: z.string().optional().describe('Judging notes'),
  judgeAgentId: z.string().min(1).describe('Your agent ID (must be mod or poster)'),
  apiKey: z.string().min(1).describe('Your API key'),
});

export const bountySearchSchema = z.object({
  skill: z.string().optional().describe('Filter by required skill'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'expert']).optional(),
  status: z.enum(['open', 'claimed', 'in_review']).optional().default('open'),
  minAmount: z.number().optional().describe('Minimum reward amount'),
  maxAmount: z.number().optional().describe('Maximum reward amount'),
  tag: z.string().optional().describe('Filter by tag'),
  limit: z.number().int().min(1).max(50).default(20),
});

export const bountyGetSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty'),
});

export const bountyExportMarkdownSchema = z.object({
  bountyId: z.string().min(1).describe('ID of the bounty to export'),
});

// Bounty type exports
export type BountyCreateInput = z.infer<typeof bountyCreateSchema>;
export type BountyFundInput = z.infer<typeof bountyFundSchema>;
export type BountyClaimInput = z.infer<typeof bountyClaimSchema>;
export type BountySubmitInput = z.infer<typeof bountySubmitSchema>;
export type BountyJudgeInput = z.infer<typeof bountyJudgeSchema>;
export type BountySearchInput = z.infer<typeof bountySearchSchema>;
export type BountyGetInput = z.infer<typeof bountyGetSchema>;
export type BountyExportMarkdownInput = z.infer<typeof bountyExportMarkdownSchema>;
