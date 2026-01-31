#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { escrowTools, agentTools } from './tools/index.js';
import { initFirestore } from './services/firestore.js';

// Initialize Firestore
initFirestore();

// Create MCP server
const server = new McpServer({
  name: 'clawdentials',
  version: '0.2.0',
});

// Register escrow_create tool
server.tool(
  'escrow_create',
  escrowTools.escrow_create.description,
  {
    taskDescription: z.string().describe('Description of the task to be completed'),
    amount: z.number().positive().describe('Amount to escrow in the specified currency'),
    currency: z.enum(['USD', 'USDC', 'BTC']).default('USD').describe('Currency for the escrow'),
    providerAgentId: z.string().describe('ID of the agent who will complete the task'),
    clientAgentId: z.string().describe('ID of the agent creating the escrow'),
  },
  async (args) => {
    const result = await escrowTools.escrow_create.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register escrow_complete tool
server.tool(
  'escrow_complete',
  escrowTools.escrow_complete.description,
  {
    escrowId: z.string().describe('ID of the escrow to complete'),
    proofOfWork: z.string().describe('Proof that the task was completed'),
  },
  async (args) => {
    const result = await escrowTools.escrow_complete.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register escrow_status tool
server.tool(
  'escrow_status',
  escrowTools.escrow_status.description,
  {
    escrowId: z.string().describe('ID of the escrow to check'),
  },
  async (args) => {
    const result = await escrowTools.escrow_status.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register escrow_dispute tool
server.tool(
  'escrow_dispute',
  escrowTools.escrow_dispute.description,
  {
    escrowId: z.string().describe('ID of the escrow to dispute'),
    reason: z.string().describe('Reason for the dispute'),
  },
  async (args) => {
    const result = await escrowTools.escrow_dispute.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register agent_register tool
server.tool(
  'agent_register',
  agentTools.agent_register.description,
  {
    name: z.string().describe('Unique name/identifier for the agent'),
    description: z.string().describe('Brief description of what this agent does'),
    skills: z.array(z.string()).describe('List of skills/capabilities'),
  },
  async (args) => {
    const result = await agentTools.agent_register.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register agent_score tool
server.tool(
  'agent_score',
  agentTools.agent_score.description,
  {
    agentId: z.string().describe('ID of the agent to get the reputation score for'),
  },
  async (args) => {
    const result = await agentTools.agent_score.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Register agent_search tool
server.tool(
  'agent_search',
  agentTools.agent_search.description,
  {
    skill: z.string().optional().describe('Filter by skill (partial match)'),
    verified: z.boolean().optional().describe('Filter by verified status'),
    minTasksCompleted: z.number().optional().describe('Minimum number of completed tasks'),
    limit: z.number().optional().default(20).describe('Maximum number of results'),
  },
  async (args) => {
    const result = await agentTools.agent_search.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Clawdentials MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
