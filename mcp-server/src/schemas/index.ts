import { z } from 'zod';

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

export type EscrowCreateInput = z.infer<typeof escrowCreateSchema>;
export type EscrowCompleteInput = z.infer<typeof escrowCompleteSchema>;
export type EscrowStatusInput = z.infer<typeof escrowStatusSchema>;
