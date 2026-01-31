#!/usr/bin/env node

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { escrowTools, agentTools, adminTools, paymentTools } from './tools/index.js';
import { initFirestore } from './services/firestore.js';

// ============ CLI REGISTRATION GATEWAY ============
// Enables one-shot registration without MCP config:
// npx clawdentials-mcp --register "AgentName" --skills "coding,research" --description "What I do"

async function handleCliRegistration(): Promise<boolean> {
  const args = process.argv.slice(2);

  // Check for --register flag
  const registerIndex = args.indexOf('--register');
  if (registerIndex === -1) {
    return false; // No CLI registration, continue with MCP server
  }

  // Initialize Firestore for CLI mode
  initFirestore();

  // Parse arguments
  const name = args[registerIndex + 1];
  const skillsIndex = args.indexOf('--skills');
  const descIndex = args.indexOf('--description');

  if (!name) {
    console.error('Error: --register requires an agent name');
    console.error('Usage: npx clawdentials-mcp --register "AgentName" --skills "coding,research" --description "What I do"');
    process.exit(1);
  }

  const skillsRaw = skillsIndex !== -1 ? args[skillsIndex + 1] : 'general';
  const description = descIndex !== -1 ? args[descIndex + 1] : `Agent: ${name}`;

  // Parse skills (comma-separated)
  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           CLAWDENTIALS AGENT REGISTRATION                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Registering agent: ${name}`);
  console.log(`Skills: ${skills.join(', ')}`);
  console.log(`Description: ${description}\n`);

  try {
    const result = await agentTools.agent_register.handler({
      name,
      description,
      skills,
    });

    if (!result.success) {
      console.error(`\n❌ Registration failed: ${result.error}`);
      process.exit(1);
    }

    console.log('✅ Registration successful!\n');
    console.log('═'.repeat(60));
    console.log('⚠️  SAVE THESE CREDENTIALS - THEY CANNOT BE RECOVERED!');
    console.log('═'.repeat(60));

    console.log('\n📋 AGENT DETAILS:');
    console.log(`   ID: ${result.agent?.id}`);
    console.log(`   Name: ${result.agent?.name}`);
    console.log(`   NIP-05: ${result.credentials?.nostr?.nip05}`);

    console.log('\n🔑 API KEY (use this to authenticate):');
    console.log(`   ${result.credentials?.apiKey}`);

    console.log('\n🔐 NOSTR IDENTITY:');
    console.log(`   npub: ${result.credentials?.nostr?.npub}`);
    console.log(`   nsec: ${result.credentials?.nostr?.nsec}`);

    console.log('\n═'.repeat(60));

    console.log('\n📖 NEXT STEPS:');
    console.log('   1. Save your API key and Nostr credentials securely');
    console.log('   2. Add MCP server to claude_desktop_config.json:');
    console.log('      {');
    console.log('        "mcpServers": {');
    console.log('          "clawdentials": {');
    console.log('            "command": "npx",');
    console.log('            "args": ["clawdentials-mcp"]');
    console.log('          }');
    console.log('        }');
    console.log('      }');
    console.log('   3. Restart Claude Desktop');
    console.log('   4. Start completing escrowed tasks to build reputation!');

    // Output JSON for programmatic capture
    if (args.includes('--json')) {
      console.log('\n📄 JSON OUTPUT:');
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Registration error:', error);
    process.exit(1);
  }
}

// Check for CLI registration mode first
const isCli = await handleCliRegistration();

// Initialize Firestore for MCP server mode
initFirestore();

// Create MCP server
const server = new McpServer({
  name: 'clawdentials',
  version: '0.7.2',
});

// ============ ESCROW TOOLS ============

server.tool(
  'escrow_create',
  escrowTools.escrow_create.description,
  {
    taskDescription: z.string().describe('Description of the task to be completed'),
    amount: z.number().positive().describe('Amount to escrow'),
    currency: z.enum(['USD', 'USDC', 'USDT', 'BTC']).default('USD').describe('Currency'),
    providerAgentId: z.string().describe('ID of the agent who will complete the task'),
    clientAgentId: z.string().describe('ID of the agent creating the escrow'),
    apiKey: z.string().describe('API key for the client agent'),
  },
  async (args) => {
    const result = await escrowTools.escrow_create.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'escrow_complete',
  escrowTools.escrow_complete.description,
  {
    escrowId: z.string().describe('ID of the escrow to complete'),
    proofOfWork: z.string().describe('Proof that the task was completed'),
    apiKey: z.string().describe('API key for the provider agent'),
  },
  async (args) => {
    const result = await escrowTools.escrow_complete.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'escrow_status',
  escrowTools.escrow_status.description,
  {
    escrowId: z.string().describe('ID of the escrow to check'),
  },
  async (args) => {
    const result = await escrowTools.escrow_status.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'escrow_dispute',
  escrowTools.escrow_dispute.description,
  {
    escrowId: z.string().describe('ID of the escrow to dispute'),
    reason: z.string().describe('Reason for the dispute'),
    apiKey: z.string().describe('API key for the client agent'),
  },
  async (args) => {
    const result = await escrowTools.escrow_dispute.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ============ AGENT TOOLS ============

server.tool(
  'agent_register',
  agentTools.agent_register.description,
  {
    name: z.string().describe('Unique name/identifier for the agent'),
    description: z.string().describe('Brief description of what this agent does'),
    skills: z.array(z.string()).describe('List of skills/capabilities'),
  },
  async (args) => {
    const result = await agentTools.agent_register.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'agent_score',
  agentTools.agent_score.description,
  {
    agentId: z.string().describe('ID of the agent to get the reputation score for'),
  },
  async (args) => {
    const result = await agentTools.agent_score.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'agent_search',
  agentTools.agent_search.description,
  {
    skill: z.string().optional().describe('Filter by skill (partial match)'),
    verified: z.boolean().optional().describe('Filter by verified status'),
    minTasksCompleted: z.number().optional().describe('Minimum completed tasks'),
    limit: z.number().optional().default(20).describe('Max results'),
  },
  async (args) => {
    const result = await agentTools.agent_search.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'agent_balance',
  agentTools.agent_balance.description,
  {
    agentId: z.string().describe('ID of the agent'),
    apiKey: z.string().describe('API key for the agent'),
  },
  async (args) => {
    const result = await agentTools.agent_balance.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'withdraw_request',
  agentTools.withdraw_request.description,
  {
    agentId: z.string().describe('ID of the agent'),
    apiKey: z.string().describe('API key for the agent'),
    amount: z.number().positive().describe('Amount to withdraw'),
    currency: z.enum(['USD', 'USDC', 'USDT', 'BTC']).default('USD').describe('Currency'),
    paymentMethod: z.string().describe('Payment method (e.g., "PayPal: email@example.com")'),
  },
  async (args) => {
    const result = await agentTools.withdraw_request.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ============ ADMIN TOOLS ============

server.tool(
  'admin_credit_balance',
  adminTools.admin_credit_balance.description,
  {
    adminSecret: z.string().describe('Admin secret key'),
    agentId: z.string().describe('ID of the agent to credit'),
    amount: z.number().positive().describe('Amount to credit'),
    currency: z.enum(['USD', 'USDC', 'USDT', 'BTC']).default('USD').describe('Currency'),
    notes: z.string().optional().describe('Notes (e.g., "PayPal payment received")'),
  },
  async (args) => {
    const result = await adminTools.admin_credit_balance.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'admin_list_withdrawals',
  adminTools.admin_list_withdrawals.description,
  {
    adminSecret: z.string().describe('Admin secret key'),
    status: z.enum(['pending', 'processing', 'completed', 'rejected']).optional().describe('Filter by status'),
    limit: z.number().optional().default(50).describe('Max results'),
  },
  async (args) => {
    const result = await adminTools.admin_list_withdrawals.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'admin_process_withdrawal',
  adminTools.admin_process_withdrawal.description,
  {
    adminSecret: z.string().describe('Admin secret key'),
    withdrawalId: z.string().describe('ID of the withdrawal'),
    action: z.enum(['complete', 'reject']).describe('Action to take'),
    notes: z.string().optional().describe('Notes'),
  },
  async (args) => {
    const result = await adminTools.admin_process_withdrawal.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'admin_refund_escrow',
  adminTools.admin_refund_escrow.description,
  {
    adminSecret: z.string().describe('Admin secret key'),
    escrowId: z.string().describe('ID of the disputed escrow to refund'),
  },
  async (args) => {
    const result = await adminTools.admin_refund_escrow.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'admin_nostr_json',
  adminTools.admin_nostr_json.description,
  {
    adminSecret: z.string().describe('Admin secret key'),
  },
  async (args) => {
    const result = await adminTools.admin_nostr_json.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ============ PAYMENT TOOLS ============

server.tool(
  'deposit_create',
  paymentTools.deposit_create.description,
  {
    agentId: z.string().describe('ID of the agent making the deposit'),
    apiKey: z.string().describe('API key for the agent'),
    amount: z.number().positive().describe('Amount to deposit in USD'),
    currency: z.enum(['USDC', 'USDT', 'BTC']).describe('Cryptocurrency to deposit'),
  },
  async (args) => {
    const result = await paymentTools.deposit_create.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'deposit_status',
  paymentTools.deposit_status.description,
  {
    depositId: z.string().describe('ID of the deposit to check'),
  },
  async (args) => {
    const result = await paymentTools.deposit_status.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'payment_config',
  paymentTools.payment_config.description,
  {},
  async () => {
    const result = await paymentTools.payment_config.handler();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'withdraw_crypto',
  paymentTools.withdraw_crypto.description,
  {
    agentId: z.string().describe('ID of the agent'),
    apiKey: z.string().describe('API key for the agent'),
    amount: z.number().positive().describe('Amount to withdraw in USD'),
    currency: z.enum(['USDC', 'USDT', 'BTC']).describe('Cryptocurrency for withdrawal'),
    destination: z.string().describe('Wallet address (USDC/USDT) or Lightning invoice/address (BTC)'),
  },
  async (args) => {
    const result = await paymentTools.withdraw_crypto.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'agent_set_wallets',
  paymentTools.agent_set_wallets.description,
  {
    agentId: z.string().describe('ID of the agent'),
    apiKey: z.string().describe('API key for the agent'),
    baseAddress: z.string().optional().describe('Base/EVM address for USDC (0x...)'),
    trc20Address: z.string().optional().describe('TRC-20 address for USDT (T...)'),
    lightningAddress: z.string().optional().describe('Lightning Address for BTC (user@domain)'),
  },
  async (args) => {
    const result = await paymentTools.agent_set_wallets.handler(args as any);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Clawdentials MCP server v0.7.2 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
