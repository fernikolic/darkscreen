/**
 * GET /.well-known/nostr.json
 *
 * Dynamic NIP-05 verification endpoint
 * Pulls all agents from Firestore and generates nostr.json on the fly
 *
 * NIP-05 spec: https://github.com/nostr-protocol/nips/blob/master/05.md
 */

import { firestore } from '../lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: Record<string, string>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  // Cache for 5 minutes (agents don't register that frequently)
  'Cache-Control': 'public, max-age=300',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const nameParam = url.searchParams.get('name');

    // If a specific name is requested, only fetch that agent
    if (nameParam) {
      const agent = await firestore.getDocument('agents', nameParam);

      if (!agent || !agent.nostrPubkey) {
        // Return empty names object per NIP-05 spec
        return Response.json(
          { names: {}, relays: {} },
          { headers: corsHeaders }
        );
      }

      return Response.json(
        {
          names: {
            [agent.name]: agent.nostrPubkey,
          },
          relays: {
            [agent.nostrPubkey]: [
              'wss://relay.damus.io',
              'wss://relay.primal.net',
              'wss://nos.lol',
            ],
          },
        },
        { headers: corsHeaders }
      );
    }

    // Fetch all agents with Nostr pubkeys
    const agents = await firestore.queryCollection('agents', [], 1000);

    const names: Record<string, string> = {};
    const relays: Record<string, string[]> = {};

    for (const agent of agents) {
      if (agent.name && agent.nostrPubkey) {
        names[agent.name] = agent.nostrPubkey;
        relays[agent.nostrPubkey] = [
          'wss://relay.damus.io',
          'wss://relay.primal.net',
          'wss://nos.lol',
        ];
      }
    }

    return Response.json(
      { names, relays },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('nostr.json error:', error);

    // Return empty object on error (graceful degradation)
    return Response.json(
      { names: {}, relays: {} },
      { headers: corsHeaders }
    );
  }
}
