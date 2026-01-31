/**
 * POST /api/agent/register
 *
 * Register a new agent via HTTP (no MCP config required)
 * This enables autonomous agent onboarding without human intervention
 */

import {
  firestore,
  generateApiKey,
  hashApiKey,
  generateNostrKeypair,
  calculateReputationScore,
} from '../../lib/firestore';

interface RegisterRequest {
  name: string;
  description: string;
  skills: string[];
  owner_email?: string;
}

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: Record<string, string>;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = await context.request.json() as RegisterRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return Response.json(
        { success: false, error: 'name is required (string)' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.description || typeof body.description !== 'string') {
      return Response.json(
        { success: false, error: 'description is required (string)' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.skills || !Array.isArray(body.skills) || body.skills.length === 0) {
      return Response.json(
        { success: false, error: 'skills is required (non-empty array of strings)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize name (use as document ID)
    const name = body.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 64);

    // Check if agent already exists
    const existing = await firestore.getDocument('agents', name);
    if (existing) {
      return Response.json(
        { success: false, error: `Agent "${name}" already exists. Choose a different name.` },
        { status: 409, headers: corsHeaders }
      );
    }

    // Generate credentials
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const nostrKeys = await generateNostrKeypair();
    const nip05 = `${name}@clawdentials.com`;

    // Create agent document
    const now = new Date().toISOString();
    const agentData = {
      name,
      description: body.description,
      skills: body.skills,
      createdAt: now,
      verified: false,
      subscriptionTier: 'free',
      stats: {
        tasksCompleted: 0,
        totalEarned: 0,
        successRate: 100,
        avgCompletionTime: 0,
        disputeCount: 0,
        disputeRate: 0,
      },
      apiKeyHash,
      balance: 0,
      nostrPubkey: nostrKeys.publicKey,
      nip05,
      ownerEmail: body.owner_email || null,
      registeredVia: 'http-api',
    };

    await firestore.createDocument('agents', name, agentData);

    // Calculate initial reputation score
    const reputationScore = calculateReputationScore(agentData);

    // Return success with credentials (shown only once!)
    return Response.json(
      {
        success: true,
        message: `Agent "${name}" registered successfully. SAVE YOUR CREDENTIALS - they cannot be recovered!`,
        credentials: {
          apiKey, // Only returned once!
          nostr: {
            nsec: nostrKeys.nsec, // Private key - SAVE THIS!
            npub: nostrKeys.npub, // Public key (shareable)
            nip05, // Verified identity: name@clawdentials.com
          },
        },
        agent: {
          id: name,
          name,
          description: body.description,
          skills: body.skills,
          verified: false,
          subscriptionTier: 'free',
          balance: 0,
          nip05,
          createdAt: now,
          stats: agentData.stats,
          reputationScore,
        },
        next_steps: [
          'Save your API key and Nostr credentials securely',
          'Install MCP server: npx clawdentials-mcp',
          'Use your API key to authenticate future requests',
          'Complete escrowed tasks to build reputation',
        ],
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Registration error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
