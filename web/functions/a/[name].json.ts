/**
 * GET /a/:name.json
 *
 * Public JSON resolution for agent identity
 * No authentication required - identity is public
 *
 * Returns:
 * - identity URL
 * - Nostr pubkey
 * - Lightning address
 * - Reputation score and stats
 * - Skills and verification status
 */

import { firestore, calculateReputationScore } from '../lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: {
    name: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60', // Cache for 1 minute
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    // Remove .json suffix if present in the name
    let agentName = context.params.name;
    if (agentName.endsWith('.json')) {
      agentName = agentName.slice(0, -5);
    }

    if (!agentName) {
      return Response.json(
        { error: 'Agent name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Try to find agent by name (case-insensitive) or by ID
    const agent = await firestore.getDocument('agents', agentName);

    if (!agent) {
      return Response.json(
        { error: 'Agent not found', name: agentName },
        { status: 404, headers: corsHeaders }
      );
    }

    const reputationScore = calculateReputationScore(agent);
    const stats = agent.stats || {};
    const createdAt = agent.createdAt ? new Date(agent.createdAt).toISOString() : null;

    // Build the canonical identity response
    const identity = {
      // Identity
      id: agent.id || agentName,
      name: agent.name || agentName,
      identity: `clawdentials.com/a/${agent.name || agentName}`,

      // Nostr
      nostr: {
        pubkey: agent.nostrPubkey || null,
        npub: agent.nostrPubkey ? `npub1${agent.nostrPubkey.slice(0, 58)}` : null,
        nip05: agent.nip05 || `${agent.name || agentName}@clawdentials.com`,
      },

      // Lightning
      lightning: {
        address: `${agent.name || agentName}@clawdentials.com`,
        lnurlp: `https://clawdentials.com/api/lnurlp/${agent.name || agentName}`,
      },

      // Reputation
      reputation: {
        score: reputationScore,
        tasksCompleted: stats.tasksCompleted || 0,
        totalEarned: stats.totalEarned || 0,
        successRate: stats.successRate || 100,
        disputeRate: stats.disputeRate || 0,
      },

      // Profile
      description: agent.description || null,
      skills: agent.skills || [],
      verified: agent.verified || false,
      tier: agent.subscriptionTier || 'free',

      // Metadata
      createdAt,

      // Links
      links: {
        profile: `https://clawdentials.com/a/${agent.name || agentName}`,
        json: `https://clawdentials.com/a/${agent.name || agentName}.json`,
        badge: `https://clawdentials.com/badge/${agent.name || agentName}.svg`,
      },
    };

    return Response.json(identity, { headers: corsHeaders });
  } catch (error) {
    console.error('Identity resolution error:', error);

    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve identity' },
      { status: 500, headers: corsHeaders }
    );
  }
}
