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
import {
  getEscrow,
  disputeEscrow,
  FEE_RATE,
  validateApiKey,
  createEscrowWithBalance,
  completeEscrowWithBalance,
  getBalance,
} from '../services/firestore.js';

export const escrowTools = {
  escrow_create: {
    description: 'Create a new escrow to lock funds for a task. Requires API key and sufficient balance.',
    inputSchema: escrowCreateSchema,
    handler: async (input: EscrowCreateInput) => {
      // Validate API key
      const isValid = await validateApiKey(input.clientAgentId, input.apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key for client agent',
        };
      }

      // Check balance first
      const balance = await getBalance(input.clientAgentId);
      if (balance < input.amount) {
        return {
          success: false,
          error: `Insufficient balance: have ${balance} ${input.currency}, need ${input.amount} ${input.currency}. Add funds first.`,
        };
      }

      try {
        const escrow = await createEscrowWithBalance({
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
          message: `Escrow created. ${input.amount} ${input.currency} deducted from your balance. Provider receives ${netAmount} ${input.currency} on completion (${FEE_RATE * 100}% fee).`,
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
          newBalance: balance - input.amount,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create escrow',
        };
      }
    },
  },

  escrow_complete: {
    description: 'Mark an escrow as complete and release funds to provider. Only the provider can complete.',
    inputSchema: escrowCompleteSchema,
    handler: async (input: EscrowCompleteInput) => {
      const existingEscrow = await getEscrow(input.escrowId);

      if (!existingEscrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      // Validate API key - must be the provider
      const isValid = await validateApiKey(existingEscrow.providerAgentId, input.apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key. Only the provider agent can complete this escrow.',
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

      if (existingEscrow.status === 'disputed') {
        return {
          success: false,
          error: 'Escrow is disputed. Contact admin for resolution.',
        };
      }

      const escrow = await completeEscrowWithBalance(input.escrowId, input.proofOfWork);
      const netAmount = escrow!.amount - escrow!.fee;
      const newBalance = await getBalance(escrow!.providerAgentId);

      return {
        success: true,
        message: `Escrow completed! ${netAmount} ${escrow!.currency} credited to your balance.`,
        escrow: {
          id: escrow!.id,
          amount: escrow!.amount,
          fee: escrow!.fee,
          netAmount,
          currency: escrow!.currency,
          status: escrow!.status,
          completedAt: escrow!.completedAt?.toISOString(),
          proofOfWork: escrow!.proofOfWork,
        },
        newBalance,
      };
    },
  },

  escrow_status: {
    description: 'Check the current status of an escrow. Public - no auth required.',
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
    description: 'Flag an escrow for dispute. Only the client can dispute.',
    inputSchema: escrowDisputeSchema,
    handler: async (input: EscrowDisputeInput) => {
      const existingEscrow = await getEscrow(input.escrowId);

      if (!existingEscrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      // Validate API key - must be the client
      const isValid = await validateApiKey(existingEscrow.clientAgentId, input.apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key. Only the client agent can dispute this escrow.',
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
          message: `Escrow disputed. Funds are held pending admin review. Reason: "${input.reason}"`,
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
