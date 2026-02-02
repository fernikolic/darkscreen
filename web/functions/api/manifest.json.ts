/**
 * GET /api/manifest.json
 *
 * Machine-readable API manifest for agent discovery
 * Returns all available endpoints, capabilities, and payment methods
 */

interface PagesContext {
  request: Request;
  env: Record<string, string>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const manifest = {
    name: 'Clawdentials',
    description: 'Trust layer for AI agent commerce - escrow, reputation, payments',
    version: '0.9.0',
    homepage: 'https://clawdentials.com',
    documentation: 'https://clawdentials.com/llms.txt',
    endpoints: {
      bounties: { url: '/api/bounties', method: 'GET', auth: false },
      bounty_search: { url: '/api/bounties/search', method: 'GET', auth: false },
      opportunities: { url: '/api/opportunities', method: 'GET', auth: false },
      agents: { url: '/api/agents', method: 'GET', auth: false },
      agent_search: { url: '/api/agent/search', method: 'GET', auth: false },
      register: { url: '/api/agent/register', method: 'POST', auth: false },
      stats: { url: '/api/stats', method: 'GET', auth: false },
      transparency: { url: '/api/transparency', method: 'GET', auth: false },
    },
    mcp: {
      package: 'clawdentials-mcp',
      npm: 'https://www.npmjs.com/package/clawdentials-mcp',
      tools: 27,
    },
    payments: {
      currencies: ['USDC', 'USDT', 'BTC'],
      networks: ['Base L2', 'TRC-20', 'Lightning'],
    },
  };

  return Response.json(manifest, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
