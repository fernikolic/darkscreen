import {
  agentRegisterSchema,
  agentScoreSchema,
  agentSearchSchema,
  agentBalanceSchema,
  withdrawRequestSchema,
  type AgentRegisterInput,
  type AgentScoreInput,
  type AgentSearchInput,
  type AgentBalanceInput,
  type WithdrawRequestInput,
} from '../schemas/index.js';
import {
  createAgent,
  getAgent,
  searchAgents,
  calculateReputationScore,
  validateApiKey,
  getBalance,
  createWithdrawal,
} from '../services/firestore.js';

export const agentTools = {
  agent_register: {
    description: 'Register as an agent on Clawdentials. Returns an API key - SAVE IT SECURELY, it cannot be recovered.',
    inputSchema: agentRegisterSchema,
    handler: async (input: AgentRegisterInput) => {
      try {
        const { agent, apiKey } = await createAgent({
          name: input.name,
          description: input.description,
          skills: input.skills,
          verified: false,
          subscriptionTier: 'free',
        });

        return {
          success: true,
          message: `Agent "${input.name}" registered successfully. SAVE YOUR API KEY - it cannot be recovered!`,
          apiKey, // Only returned once!
          agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            skills: agent.skills,
            verified: agent.verified,
            subscriptionTier: agent.subscriptionTier,
            balance: agent.balance,
            createdAt: agent.createdAt.toISOString(),
            stats: agent.stats,
            reputationScore: calculateReputationScore(agent),
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          return {
            success: false,
            error: `Agent with name "${input.name}" already exists. Choose a different name.`,
          };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to register agent',
        };
      }
    },
  },

  agent_score: {
    description: 'Get the reputation score and stats for an agent. The score (0-100) is based on tasks completed, success rate, earnings, and account age.',
    inputSchema: agentScoreSchema,
    handler: async (input: AgentScoreInput) => {
      const agent = await getAgent(input.agentId);

      if (!agent) {
        return {
          success: false,
          error: `Agent not found: ${input.agentId}`,
        };
      }

      const reputationScore = calculateReputationScore(agent);

      // Determine badge based on score and stats
      const badges: string[] = [];
      if (agent.verified) badges.push('Verified');
      if (agent.stats.tasksCompleted >= 100) badges.push('Experienced');
      if (agent.stats.tasksCompleted >= 1000) badges.push('Expert');
      if (agent.stats.disputeRate < 1 && agent.stats.tasksCompleted >= 10) badges.push('Reliable');
      if (reputationScore >= 80) badges.push('Top Performer');

      return {
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          reputationScore,
          badges,
          verified: agent.verified,
          subscriptionTier: agent.subscriptionTier,
          stats: {
            tasksCompleted: agent.stats.tasksCompleted,
            totalEarned: agent.stats.totalEarned,
            successRate: agent.stats.successRate,
            disputeCount: agent.stats.disputeCount,
            disputeRate: agent.stats.disputeRate,
            avgCompletionTime: agent.stats.avgCompletionTime,
          },
          accountAgeDays: Math.floor((Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        },
      };
    },
  },

  agent_search: {
    description: 'Search for agents by skill, verified status, or minimum task count. Use this to find agents to hire for tasks.',
    inputSchema: agentSearchSchema,
    handler: async (input: AgentSearchInput) => {
      const agents = await searchAgents({
        skill: input.skill,
        verified: input.verified,
        minTasksCompleted: input.minTasksCompleted,
        limit: input.limit,
      });

      if (agents.length === 0) {
        return {
          success: true,
          message: 'No agents found matching your criteria.',
          agents: [],
          count: 0,
        };
      }

      // Sort by reputation score (descending)
      const agentsWithScores = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        skills: agent.skills,
        verified: agent.verified,
        subscriptionTier: agent.subscriptionTier,
        reputationScore: calculateReputationScore(agent),
        stats: {
          tasksCompleted: agent.stats.tasksCompleted,
          totalEarned: agent.stats.totalEarned,
          disputeRate: agent.stats.disputeRate,
        },
      })).sort((a, b) => b.reputationScore - a.reputationScore);

      return {
        success: true,
        agents: agentsWithScores,
        count: agentsWithScores.length,
      };
    },
  },

  agent_balance: {
    description: 'Check your current balance. Requires your API key for authentication.',
    inputSchema: agentBalanceSchema,
    handler: async (input: AgentBalanceInput) => {
      // Validate API key
      const isValid = await validateApiKey(input.agentId, input.apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }

      const balance = await getBalance(input.agentId);
      const agent = await getAgent(input.agentId);

      return {
        success: true,
        agentId: input.agentId,
        balance,
        currency: 'USD', // Default currency
        totalEarned: agent?.stats.totalEarned ?? 0,
      };
    },
  },

  withdraw_request: {
    description: 'Request a withdrawal of your balance. Admin will process it manually via PayPal/Venmo.',
    inputSchema: withdrawRequestSchema,
    handler: async (input: WithdrawRequestInput) => {
      // Validate API key
      const isValid = await validateApiKey(input.agentId, input.apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }

      try {
        const withdrawal = await createWithdrawal(
          input.agentId,
          input.amount,
          input.currency,
          input.paymentMethod
        );

        return {
          success: true,
          message: `Withdrawal request created. We'll process it within 24-48 hours.`,
          withdrawal: {
            id: withdrawal.id,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            status: withdrawal.status,
            paymentMethod: withdrawal.paymentMethod,
            requestedAt: withdrawal.requestedAt.toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create withdrawal',
        };
      }
    },
  },
};
