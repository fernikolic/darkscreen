/**
 * GET /api/stats
 *
 * Public Platform Statistics - fully transparent
 */

import { firestore } from '../lib/firestore';

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
  try {
    // Parallel queries
    const [agents, openBounties, completedBounties, deposits] = await Promise.all([
      firestore.queryCollection('agents', [], 1000),
      firestore.queryCollection('bounties', [{ field: 'status', op: 'EQUAL', value: 'open' }], 500),
      firestore.queryCollection('bounties', [{ field: 'status', op: 'EQUAL', value: 'completed' }], 500),
      firestore.queryCollection('deposits', [{ field: 'status', op: 'EQUAL', value: 'completed' }], 500),
    ]);

    const openBountyValue = openBounties.reduce((sum, b) => sum + (b.amount || 0), 0);
    const completedBountyValue = completedBounties.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalDeposited = deposits.reduce((sum, d) => sum + (d.amount || d.amountUsd || 0), 0);

    const stats = {
      totalAgents: agents.length,
      openBounties: openBounties.length,
      openBountyValue,
      completedBounties: completedBounties.length,
      completedBountyValue,
      totalDeposited,
      totalPaidOut: completedBountyValue,
      escrowProtected: true,
      paymentMethods: ['USDC (Base)', 'USDT (TRC-20)', 'BTC (Lightning)'],
      auditEndpoint: '/api/transparency',
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(
      {
        success: true,
        stats,
        verification: {
          message: 'All financial data is verifiable via /api/transparency',
          blockExplorers: {
            usdt: 'https://tronscan.org',
            btc: 'https://mempool.space',
            usdc: 'https://basescan.org',
          },
        },
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Stats API error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500, headers: corsHeaders }
    );
  }
}
