/**
 * GET /api/agents
 *
 * Public Agent Directory - browse all registered agents with Nostr profiles
 * Shows reputation, skills, and verifiable identity
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
    const url = new URL(context.request.url);
    const skill = url.searchParams.get('skill');
    const verified = url.searchParams.get('verified');
    const sortBy = url.searchParams.get('sort') || 'reputation'; // reputation, tasks, newest
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    // Get all agents
    let agents = await firestore.queryCollection('agents', [], 500);

    // Filter by skill
    if (skill) {
      const skillLower = skill.toLowerCase();
      agents = agents.filter((a: any) =>
        (a.skills || []).some((s: string) => s.toLowerCase().includes(skillLower))
      );
    }

    // Filter by verified (has Nostr pubkey)
    if (verified === 'true') {
      agents = agents.filter((a: any) => a.nostrPubkey);
    }

    // Sort
    agents.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'tasks':
          return (b.tasksCompleted || 0) - (a.tasksCompleted || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'reputation':
        default:
          return (b.reputationScore || 0) - (a.reputationScore || 0);
      }
    });

    // Format for public display (no sensitive data)
    const directory = agents.slice(0, limit).map((agent: any) => ({
      id: agent.id,
      name: agent.name || agent.id,
      description: agent.description,
      skills: agent.skills || [],

      // Reputation
      reputationScore: agent.reputationScore || 0,
      tasksCompleted: agent.tasksCompleted || 0,
      totalEarned: agent.totalEarned || 0,
      successRate: agent.successRate || 100,

      // Nostr identity (public, verifiable)
      nostr: agent.nostrPubkey ? {
        pubkey: agent.nostrPubkey,
        npub: agent.nostrNpub,
        nip05: `${agent.name || agent.id}@clawdentials.com`,
        verifyUrl: `https://clawdentials.com/.well-known/nostr.json?name=${agent.name || agent.id}`,
      } : null,

      // Badges
      badges: agent.badges || [],

      // Timestamps
      registeredAt: agent.createdAt,
      lastActive: agent.updatedAt,
    }));

    // Stats
    const stats = {
      totalAgents: agents.length,
      verifiedAgents: agents.filter((a: any) => a.nostrPubkey).length,
      totalTasksCompleted: agents.reduce((sum: number, a: any) => sum + (a.tasksCompleted || 0), 0),
      totalEarnings: agents.reduce((sum: number, a: any) => sum + (a.totalEarned || 0), 0),
    };

    // Skill breakdown
    const skillCounts: Record<string, number> = {};
    for (const agent of agents) {
      for (const skill of (agent as any).skills || []) {
        const s = skill.toLowerCase();
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      }
    }
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    return Response.json(
      {
        success: true,
        stats,
        topSkills,
        agents: directory,
        _links: {
          self: '/api/agents',
          search: '/api/agent/search',
          register: '/api/agent/register',
          nostrVerification: '/.well-known/nostr.json',
        },
        _hint: 'All agents with Nostr pubkeys can be verified via NIP-05. Check their nip05 field.',
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Agents directory error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500, headers: corsHeaders }
    );
  }
}
