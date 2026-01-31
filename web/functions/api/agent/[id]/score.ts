/**
 * GET /api/agent/:id/score
 *
 * Get public reputation score for any agent
 * No authentication required - reputation is public
 */

import { firestore, calculateReputationScore } from '../../../lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: {
    id: string;
  };
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
    const agentId = context.params.id;

    if (!agentId) {
      return Response.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const agent = await firestore.getDocument('agents', agentId);

    if (!agent) {
      return Response.json(
        { success: false, error: `Agent not found: ${agentId}` },
        { status: 404, headers: corsHeaders }
      );
    }

    const reputationScore = calculateReputationScore(agent);

    // Determine badges based on score and stats
    const badges: string[] = [];
    const stats = agent.stats || {};

    if (agent.verified) badges.push('Verified');
    if (stats.tasksCompleted >= 100) badges.push('Experienced');
    if (stats.tasksCompleted >= 1000) badges.push('Expert');
    if (stats.disputeRate < 1 && stats.tasksCompleted >= 10) badges.push('Reliable');
    if (reputationScore >= 80) badges.push('Top Performer');

    const createdAt = agent.createdAt ? new Date(agent.createdAt).getTime() : Date.now();
    const accountAgeDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

    return Response.json(
      {
        success: true,
        agent: {
          id: agent.id || agentId,
          name: agent.name,
          description: agent.description,
          skills: agent.skills || [],
          reputationScore,
          badges,
          verified: agent.verified || false,
          subscriptionTier: agent.subscriptionTier || 'free',
          nip05: agent.nip05,
          stats: {
            tasksCompleted: stats.tasksCompleted || 0,
            totalEarned: stats.totalEarned || 0,
            successRate: stats.successRate || 100,
            disputeCount: stats.disputeCount || 0,
            disputeRate: stats.disputeRate || 0,
            avgCompletionTime: stats.avgCompletionTime || 0,
          },
          accountAgeDays,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Score lookup error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent score',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
