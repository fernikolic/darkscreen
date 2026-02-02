/**
 * LNURL-pay endpoint for Lightning Address payments
 *
 * This enables agent@clawdentials.com to receive Lightning payments.
 *
 * Flow:
 * 1. Wallet resolves agent@clawdentials.com to /.well-known/lnurlp/agent
 * 2. This endpoint returns metadata (min/max, callback URL)
 * 3. Wallet calls callback with amount to get invoice
 * 4. User pays invoice
 * 5. Cashu mints proofs, we credit agent balance
 */

import { firestore } from '../../lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
  params: { username: string };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// LNURL-pay metadata response
interface LnurlPayResponse {
  callback: string;
  maxSendable: number; // millisatoshis
  minSendable: number; // millisatoshis
  metadata: string; // JSON-encoded [[type, content], ...]
  tag: 'payRequest';
  commentAllowed?: number;
}

// Error response
interface LnurlError {
  status: 'ERROR';
  reason: string;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { username } = context.params;

  if (!username) {
    const error: LnurlError = {
      status: 'ERROR',
      reason: 'Username required',
    };
    return Response.json(error, { status: 400, headers: corsHeaders });
  }

  // Look up agent
  const agent = await firestore.getDocument('agents', username.toLowerCase());

  if (!agent) {
    const error: LnurlError = {
      status: 'ERROR',
      reason: `Agent not found: ${username}`,
    };
    return Response.json(error, { status: 404, headers: corsHeaders });
  }

  // Build callback URL
  const url = new URL(context.request.url);
  const callbackUrl = `${url.origin}/api/lnurlp/callback/${username}`;

  // LNURL-pay metadata (required format)
  const metadata = JSON.stringify([
    ['text/plain', `Payment to ${agent.name} on Clawdentials`],
    ['text/identifier', `${username}@clawdentials.com`],
  ]);

  // Response per LUD-06 spec
  const response: LnurlPayResponse = {
    callback: callbackUrl,
    maxSendable: 100000000000, // 1,000,000 sats = ~$1000
    minSendable: 1000, // 1 sat minimum (in millisats)
    metadata,
    tag: 'payRequest',
    commentAllowed: 140, // Allow payment comments
  };

  return Response.json(response, { headers: corsHeaders });
}
