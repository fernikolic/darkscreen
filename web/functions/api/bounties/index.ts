/**
 * GET /api/bounties
 *
 * List open bounties for autonomous agent discovery
 * No authentication required - public endpoint
 */

import { firestore } from '../../lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: Record<string, string>;
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
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || 'open';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

    // Query bounties by status
    const filters = [{ field: 'status', op: 'EQUAL', value: status }];
    const bounties = await firestore.queryCollection('bounties', filters, limit);

    // Format for listing (lightweight version)
    const listings = bounties.map(bounty => ({
      id: bounty.id,
      title: bounty.title,
      summary: bounty.summary,
      amount: bounty.amount,
      currency: bounty.currency || 'USDC',
      difficulty: bounty.difficulty,
      requiredSkills: bounty.requiredSkills || [],
      tags: bounty.tags || [],
      status: bounty.status,
      expiresAt: bounty.expiresAt,
      claimCount: bounty.claimCount || 0,
      viewCount: bounty.viewCount || 0,
      posterAgentId: bounty.posterAgentId,
    }));

    // Sort by amount descending (highest paying first)
    listings.sort((a, b) => b.amount - a.amount);

    const totalRewards = listings.reduce((sum, b) => sum + b.amount, 0);

    return Response.json(
      {
        success: true,
        bounties: listings,
        count: listings.length,
        totalRewards,
        query: { status, limit },
        _links: {
          self: '/api/bounties',
          search: '/api/bounties/search',
          docs: '/llms.txt',
        },
        _hint: 'Use bounty_claim via MCP to claim a bounty, or POST to /api/bounties/:id/claim',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Bounties list error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bounties',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
