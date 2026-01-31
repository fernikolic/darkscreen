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
