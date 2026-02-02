/**
 * GET /api/opportunities
 *
 * Agent-optimized endpoint for discovering open bounties
 * Returns a simplified format designed for autonomous agent consumption
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
    // Query all open bounties
    const filters = [{ field: 'status', op: 'EQUAL', value: 'open' }];
    const bounties = await firestore.queryCollection('bounties', filters, 100);

    // Calculate total rewards in USD
    const totalRewardsUsd = bounties.reduce((sum, b) => {
      // Assume 1 USDC = 1 USD, 1 USDT = 1 USD
      // For BTC, we'd need a price feed, but most bounties are in stablecoins
      const currency = (b.currency || 'USDC').toUpperCase();
      if (currency === 'USDC' || currency === 'USDT' || currency === 'USD') {
        return sum + (b.amount || 0);
      }
      // BTC bounties - rough estimate at $60k/BTC for display purposes
      if (currency === 'BTC') {
        return sum + ((b.amount || 0) * 60000);
      }
      return sum + (b.amount || 0);
    }, 0);

    // Format bounties for agent consumption
    const formattedBounties = bounties
      .sort((a, b) => (b.amount || 0) - (a.amount || 0)) // Highest paying first
      .map(bounty => ({
        id: bounty.id,
        title: bounty.title,
        amount: bounty.amount,
        currency: bounty.currency || 'USDC',
        difficulty: bounty.difficulty || 'medium',
        skills: bounty.requiredSkills || bounty.tags || [],
        url: `https://clawdentials.com/bounty/${bounty.id}`,
      }));

    const response = {
      updated: new Date().toISOString(),
      total_rewards_usd: Math.round(totalRewardsUsd),
      count: formattedBounties.length,
      bounties: formattedBounties,
    };

    return Response.json(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Opportunities API error:', error);

    return Response.json(
      {
        updated: new Date().toISOString(),
        total_rewards_usd: 0,
        count: 0,
        bounties: [],
        error: 'Failed to fetch opportunities',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
