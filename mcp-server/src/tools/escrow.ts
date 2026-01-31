import { z } from 'zod';
import {
  escrowCreateSchema,
  escrowCompleteSchema,
  escrowStatusSchema,
  escrowDisputeSchema,
  type EscrowCreateInput,
  type EscrowCompleteInput,
  type EscrowStatusInput,
  type EscrowDisputeInput,
} from '../schemas/index.js';
import { createEscrow, getEscrow, completeEscrow, disputeEscrow, FEE_RATE } from '../services/firestore.js';

export const escrowTools = {
  escrow_create: {
    description: 'Create a new escrow to lock funds for a task. The funds will be held until the task is completed.',
    inputSchema: escrowCreateSchema,
    handler: async (input: EscrowCreateInput) => {
      const escrow = await createEscrow({
        clientAgentId: input.clientAgentId,
        providerAgentId: input.providerAgentId,
        taskDescription: input.taskDescription,
        amount: input.amount,
        currency: input.currency,
        status: 'pending',
      });

      const netAmount = escrow.amount - escrow.fee;

      return {
        success: true,
        escrowId: escrow.id,
        message: `Escrow created successfully. ${input.amount} ${input.currency} locked for task: "${input.taskDescription}". Fee: ${escrow.fee} ${input.currency} (${FEE_RATE * 100}%). Provider receives: ${netAmount} ${input.currency}.`,
        escrow: {
          id: escrow.id,
          amount: escrow.amount,
          fee: escrow.fee,
          feeRate: escrow.feeRate,
          netAmount,
          currency: escrow.currency,
          status: escrow.status,
          providerAgentId: escrow.providerAgentId,
          createdAt: escrow.createdAt.toISOString(),
        },
      };
    },
  },

  escrow_complete: {
    description: 'Mark an escrow as complete and release the funds to the provider agent. Requires proof of work.',
    inputSchema: escrowCompleteSchema,
    handler: async (input: EscrowCompleteInput) => {
      const existingEscrow = await getEscrow(input.escrowId);

      if (!existingEscrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      if (existingEscrow.status === 'completed') {
        return {
          success: false,
          error: 'Escrow is already completed',
        };
      }

      if (existingEscrow.status === 'cancelled') {
        return {
          success: false,
          error: 'Escrow was cancelled',
        };
      }

      const escrow = await completeEscrow(input.escrowId, input.proofOfWork);

      return {
        success: true,
        message: `Escrow completed. ${escrow!.amount} ${escrow!.currency} released to ${escrow!.providerAgentId}`,
        escrow: {
          id: escrow!.id,
          amount: escrow!.amount,
          currency: escrow!.currency,
          status: escrow!.status,
          completedAt: escrow!.completedAt?.toISOString(),
          proofOfWork: escrow!.proofOfWork,
        },
      };
    },
  },

  escrow_status: {
    description: 'Check the current status of an escrow.',
    inputSchema: escrowStatusSchema,
    handler: async (input: EscrowStatusInput) => {
      const escrow = await getEscrow(input.escrowId);

      if (!escrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      return {
        success: true,
        escrow: {
          id: escrow.id,
          clientAgentId: escrow.clientAgentId,
          providerAgentId: escrow.providerAgentId,
          taskDescription: escrow.taskDescription,
          amount: escrow.amount,
          fee: escrow.fee,
          feeRate: escrow.feeRate,
          netAmount: escrow.amount - escrow.fee,
          currency: escrow.currency,
          status: escrow.status,
          createdAt: escrow.createdAt.toISOString(),
          completedAt: escrow.completedAt?.toISOString() ?? null,
          proofOfWork: escrow.proofOfWork,
          disputeReason: escrow.disputeReason,
        },
      };
    },
  },

  escrow_dispute: {
    description: 'Flag an escrow for dispute. Use this when a task was not completed satisfactorily or there is a disagreement.',
    inputSchema: escrowDisputeSchema,
    handler: async (input: EscrowDisputeInput) => {
      const existingEscrow = await getEscrow(input.escrowId);

      if (!existingEscrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      if (existingEscrow.status === 'completed') {
        return {
          success: false,
          error: 'Cannot dispute a completed escrow',
        };
      }

      if (existingEscrow.status === 'cancelled') {
        return {
          success: false,
          error: 'Cannot dispute a cancelled escrow',
        };
      }

      if (existingEscrow.status === 'disputed') {
        return {
          success: false,
          error: 'Escrow is already disputed',
        };
      }

      try {
        const escrow = await disputeEscrow(input.escrowId, input.reason);

        return {
          success: true,
          message: `Escrow disputed. Funds are held pending review. Reason: "${input.reason}"`,
          escrow: {
            id: escrow!.id,
            status: escrow!.status,
            disputeReason: escrow!.disputeReason,
            amount: escrow!.amount,
            currency: escrow!.currency,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to dispute escrow',
        };
      }
    },
  },
};
