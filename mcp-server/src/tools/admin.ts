import {
  adminCreditBalanceSchema,
  adminProcessWithdrawalSchema,
  adminListWithdrawalsSchema,
  type AdminCreditBalanceInput,
  type AdminProcessWithdrawalInput,
  type AdminListWithdrawalsInput,
} from '../schemas/index.js';
import {
  ADMIN_SECRET,
  creditBalance,
  getBalance,
  getAgent,
  processWithdrawal,
  listWithdrawals,
  refundEscrow,
  getEscrow,
  collections,
} from '../services/firestore.js';
import { z } from 'zod';

// Admin refund schema
const adminRefundSchema = z.object({
  adminSecret: z.string().min(1).describe('Admin secret key'),
  escrowId: z.string().min(1).describe('ID of the disputed escrow to refund'),
});

type AdminRefundInput = z.infer<typeof adminRefundSchema>;

export const adminTools = {
  admin_credit_balance: {
    description: 'Credit funds to an agent\'s balance after receiving manual payment (PayPal/Venmo).',
    inputSchema: adminCreditBalanceSchema,
    handler: async (input: AdminCreditBalanceInput) => {
      // Validate admin secret
      if (input.adminSecret !== ADMIN_SECRET) {
        return {
          success: false,
          error: 'Invalid admin secret',
        };
      }

      // Check agent exists
      const agent = await getAgent(input.agentId);
      if (!agent) {
        return {
          success: false,
          error: `Agent not found: ${input.agentId}`,
        };
      }

      const oldBalance = await getBalance(input.agentId);
      const newBalance = await creditBalance(input.agentId, input.amount, input.notes);

      return {
        success: true,
        message: `Credited ${input.amount} ${input.currency} to ${input.agentId}`,
        agentId: input.agentId,
        oldBalance,
        credited: input.amount,
        newBalance,
        currency: input.currency,
        notes: input.notes,
      };
    },
  },

  admin_list_withdrawals: {
    description: 'List pending withdrawal requests.',
    inputSchema: adminListWithdrawalsSchema,
    handler: async (input: AdminListWithdrawalsInput) => {
      // Validate admin secret
      if (input.adminSecret !== ADMIN_SECRET) {
        return {
          success: false,
          error: 'Invalid admin secret',
        };
      }

      const withdrawals = await listWithdrawals(input.status, input.limit);

      return {
        success: true,
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          agentId: w.agentId,
          amount: w.amount,
          currency: w.currency,
          status: w.status,
          paymentMethod: w.paymentMethod,
          requestedAt: w.requestedAt.toISOString(),
          processedAt: w.processedAt?.toISOString() ?? null,
          notes: w.notes,
        })),
        count: withdrawals.length,
      };
    },
  },

  admin_process_withdrawal: {
    description: 'Process a withdrawal request - mark as completed (after sending payment) or rejected.',
    inputSchema: adminProcessWithdrawalSchema,
    handler: async (input: AdminProcessWithdrawalInput) => {
      // Validate admin secret
      if (input.adminSecret !== ADMIN_SECRET) {
        return {
          success: false,
          error: 'Invalid admin secret',
        };
      }

      try {
        const withdrawal = await processWithdrawal(input.withdrawalId, input.action, input.notes);

        if (!withdrawal) {
          return {
            success: false,
            error: `Withdrawal not found: ${input.withdrawalId}`,
          };
        }

        const actionText = input.action === 'complete' ? 'completed' : 'rejected';

        return {
          success: true,
          message: `Withdrawal ${actionText}`,
          withdrawal: {
            id: withdrawal.id,
            agentId: withdrawal.agentId,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            status: withdrawal.status,
            paymentMethod: withdrawal.paymentMethod,
            processedAt: withdrawal.processedAt?.toISOString(),
            notes: withdrawal.notes,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process withdrawal',
        };
      }
    },
  },

  admin_refund_escrow: {
    description: 'Refund a disputed escrow back to the client.',
    inputSchema: adminRefundSchema,
    handler: async (input: AdminRefundInput) => {
      // Validate admin secret
      if (input.adminSecret !== ADMIN_SECRET) {
        return {
          success: false,
          error: 'Invalid admin secret',
        };
      }

      const existingEscrow = await getEscrow(input.escrowId);
      if (!existingEscrow) {
        return {
          success: false,
          error: `Escrow not found: ${input.escrowId}`,
        };
      }

      if (existingEscrow.status !== 'disputed') {
        return {
          success: false,
          error: `Can only refund disputed escrows. Current status: ${existingEscrow.status}`,
        };
      }

      try {
        const escrow = await refundEscrow(input.escrowId);
        const newBalance = await getBalance(existingEscrow.clientAgentId);

        return {
          success: true,
          message: `Refunded ${existingEscrow.amount} ${existingEscrow.currency} to ${existingEscrow.clientAgentId}`,
          escrow: {
            id: escrow!.id,
            status: escrow!.status,
            amount: existingEscrow.amount,
            currency: existingEscrow.currency,
          },
          clientNewBalance: newBalance,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to refund escrow',
        };
      }
    },
  },

  admin_nostr_json: {
    description: 'Generate the NIP-05 nostr.json file content for all registered agents. Host this at clawdentials.com/.well-known/nostr.json',
    inputSchema: z.object({
      adminSecret: z.string().min(1).describe('Admin secret key'),
    }),
    handler: async (input: { adminSecret: string }) => {
      // Validate admin secret
      if (input.adminSecret !== ADMIN_SECRET) {
        return {
          success: false,
          error: 'Invalid admin secret',
        };
      }

      try {
        // Get all agents with Nostr pubkeys
        const snapshot = await collections.agents().get();
        const names: Record<string, string> = {};

        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.nostrPubkey) {
            // Use the agent name (lowercase, sanitized) as the identifier
            const identifier = doc.id.toLowerCase().replace(/[^a-z0-9-_.]/g, '');
            names[identifier] = data.nostrPubkey;
          }
        }

        // Generate the nostr.json content
        const nostrJson = {
          names,
          // Optional: add relay hints
          // relays: {}
        };

        return {
          success: true,
          message: 'Host this JSON at: https://clawdentials.com/.well-known/nostr.json',
          agentCount: Object.keys(names).length,
          nostrJson,
          // Also return as string for easy copy-paste
          nostrJsonString: JSON.stringify(nostrJson, null, 2),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate nostr.json',
        };
      }
    },
  },
};
