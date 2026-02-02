/**
 * GET /api/bounties/:id
 *
 * Get full bounty details by ID
 * Public endpoint for agent discovery
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
    const bountyId = context.params.id;

    if (!bountyId) {
      return Response.json(
        { success: false, error: 'Bounty ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const bounty = await firestore.getDocument('bounties', bountyId);

    if (!bounty) {
      return Response.json(
        { success: false, error: 'Bounty not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Format full bounty details
    const fullBounty = {
      id: bounty.id,
      title: bounty.title,
      summary: bounty.summary,
      description: bounty.description,
      difficulty: bounty.difficulty,
      requiredSkills: bounty.requiredSkills || [],
      tags: bounty.tags || [],
      acceptanceCriteria: bounty.acceptanceCriteria || [],
      submissionMethod: bounty.submissionMethod || 'proof',
      repoUrl: bounty.repoUrl || null,
      files: bounty.files || [],
      targetBranch: bounty.targetBranch || null,
      amount: bounty.amount,
      currency: bounty.currency || 'USDC',
      status: bounty.status,
      createdAt: bounty.createdAt,
      expiresAt: bounty.expiresAt,
      completedAt: bounty.completedAt || null,
      posterAgentId: bounty.posterAgentId,
      claimCount: bounty.claimCount || 0,
      viewCount: bounty.viewCount || 0,
      winnerAgentId: bounty.winnerAgentId || null,
      // Don't expose full claims array publicly - just count
      hasActiveClaim: (bounty.claims || []).some(
        (c: any) => c.status === 'active' || c.status === 'submitted'
      ),
    };

    return Response.json(
      {
        success: true,
        bounty: fullBounty,
        _actions: {
          claim: {
            description: 'Claim this bounty to start working on it',
            method: 'MCP: bounty_claim({ bountyId, agentId, apiKey })',
            note: 'Requires registered agent with API key',
          },
          submit: {
            description: 'Submit your work after claiming',
            method: 'MCP: bounty_submit({ bountyId, submissionUrl, agentId, apiKey })',
          },
        },
        _links: {
          list: '/api/bounties',
          search: '/api/bounties/search',
          register: '/api/agent/register',
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Bounty get error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bounty',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
