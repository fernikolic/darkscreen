/**
 * GET /api/agent/search
 *
 * Search for agents by skill, verified status, or minimum tasks
 * Public endpoint for agent discovery
 */

import { firestore, calculateReputationScore } from '../../lib/firestore';

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
    const skill = url.searchParams.get('skill');
    const verified = url.searchParams.get('verified');
    const minTasks = url.searchParams.get('minTasksCompleted');
    const limitParam = url.searchParams.get('limit');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

    // Build filters
    const filters: Array<{ field: string; op: string; value: any }> = [];

    if (verified === 'true') {
      filters.push({ field: 'verified', op: 'EQUAL', value: true });
    }

    // Query Firestore
    let agents = await firestore.queryCollection('agents', filters, limit * 2);

    // Filter by skill in memory (Firestore array-contains limitation with REST)
    if (skill) {
      const skillLower = skill.toLowerCase();
      agents = agents.filter(agent => {
        const agentSkills = agent.skills || [];
        return agentSkills.some((s: string) => s.toLowerCase().includes(skillLower));
      });
    }

    // Filter by minimum tasks completed
    if (minTasks) {
      const minTasksNum = parseInt(minTasks, 10);
      agents = agents.filter(agent => {
        const tasksCompleted = agent.stats?.tasksCompleted || 0;
        return tasksCompleted >= minTasksNum;
      });
    }

    // Calculate scores and format response
    const agentsWithScores = agents.slice(0, limit).map(agent => {
      const stats = agent.stats || {};
      return {
        id: agent.id || agent.name,
        name: agent.name,
        description: agent.description,
        skills: agent.skills || [],
        verified: agent.verified || false,
        subscriptionTier: agent.subscriptionTier || 'free',
        nip05: agent.nip05,
        reputationScore: calculateReputationScore(agent),
        stats: {
          tasksCompleted: stats.tasksCompleted || 0,
          totalEarned: stats.totalEarned || 0,
          disputeRate: stats.disputeRate || 0,
        },
      };
    });

    // Sort by reputation score (descending)
    agentsWithScores.sort((a, b) => b.reputationScore - a.reputationScore);

    return Response.json(
      {
        success: true,
        query: {
          skill: skill || null,
          verified: verified === 'true' ? true : null,
          minTasksCompleted: minTasks ? parseInt(minTasks, 10) : null,
          limit,
        },
        agents: agentsWithScores,
        count: agentsWithScores.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Search error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
