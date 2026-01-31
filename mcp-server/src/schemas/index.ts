import { z } from 'zod';

// Escrow schemas
export const escrowCreateSchema = z.object({
  taskDescription: z.string().min(1).describe('Description of the task to be completed'),
  amount: z.number().positive().describe('Amount to escrow in the specified currency'),
  currency: z.enum(['USD', 'USDC', 'BTC']).default('USD').describe('Currency for the escrow'),
  providerAgentId: z.string().min(1).describe('ID of the agent who will complete the task'),
  clientAgentId: z.string().min(1).describe('ID of the agent creating the escrow'),
});

export const escrowCompleteSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to complete'),
  proofOfWork: z.string().min(1).describe('Proof that the task was completed (e.g., result summary, link, hash)'),
});

export const escrowStatusSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to check'),
});

export const escrowDisputeSchema = z.object({
  escrowId: z.string().min(1).describe('ID of the escrow to dispute'),
  reason: z.string().min(1).describe('Reason for the dispute'),
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

// Type exports
export type EscrowCreateInput = z.infer<typeof escrowCreateSchema>;
export type EscrowCompleteInput = z.infer<typeof escrowCompleteSchema>;
export type EscrowStatusInput = z.infer<typeof escrowStatusSchema>;
export type EscrowDisputeInput = z.infer<typeof escrowDisputeSchema>;
export type AgentRegisterInput = z.infer<typeof agentRegisterSchema>;
export type AgentScoreInput = z.infer<typeof agentScoreSchema>;
export type AgentSearchInput = z.infer<typeof agentSearchSchema>;
