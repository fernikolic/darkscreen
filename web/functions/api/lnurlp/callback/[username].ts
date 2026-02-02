/**
 * LNURL-pay callback endpoint
 *
 * Called by wallets to get a Lightning invoice for payment.
 *
 * Query params:
 * - amount: Amount in millisatoshis
 * - comment: Optional payment comment
 */

import { firestore } from '../../../lib/firestore';

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

// Cashu mint URL
const CASHU_MINT_URL = 'https://mint.minibits.cash/Bitcoin';

interface LnurlCallbackResponse {
  pr: string; // Lightning invoice (bolt11)
  routes: []; // Empty for basic LNURL
  successAction?: {
    tag: 'message' | 'url';
    message?: string;
    url?: string;
    description?: string;
  };
}

interface LnurlError {
  status: 'ERROR';
  reason: string;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { username } = context.params;
  const url = new URL(context.request.url);
  const amountMsat = url.searchParams.get('amount');
  const comment = url.searchParams.get('comment');

  // Validate amount
  if (!amountMsat) {
    const error: LnurlError = {
      status: 'ERROR',
      reason: 'Amount required (in millisatoshis)',
    };
    return Response.json(error, { status: 400, headers: corsHeaders });
  }

  const amountSats = Math.floor(parseInt(amountMsat) / 1000);
  if (amountSats < 1) {
    const error: LnurlError = {
      status: 'ERROR',
      reason: 'Amount must be at least 1000 millisatoshis (1 sat)',
    };
    return Response.json(error, { status: 400, headers: corsHeaders });
  }

  // Verify agent exists
  const agent = await firestore.getDocument('agents', username.toLowerCase());
  if (!agent) {
    const error: LnurlError = {
      status: 'ERROR',
      reason: `Agent not found: ${username}`,
    };
    return Response.json(error, { status: 404, headers: corsHeaders });
  }

  try {
    // Get invoice from Cashu mint
    const mintQuoteUrl = `${CASHU_MINT_URL}/v1/mint/quote/bolt11`;
    const quoteResponse = await fetch(mintQuoteUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountSats, unit: 'sat' }),
    });

    if (!quoteResponse.ok) {
      throw new Error(`Mint error: ${quoteResponse.status}`);
    }

    const quote = await quoteResponse.json() as {
      quote: string;
      request: string; // bolt11 invoice
      paid: boolean;
      expiry: number;
    };

    // Store pending deposit in Firestore for later crediting
    const depositId = `lnurl_${quote.quote}`;
    const depositData = {
      id: depositId,
      agentId: username.toLowerCase(),
      amount: amountSats,
      amountUsd: amountSats / 1030, // Approximate USD
      currency: 'BTC',
      network: 'lightning',
      status: 'pending',
      provider: 'cashu',
      externalId: quote.quote,
      bolt11: quote.request,
      comment: comment || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 min
    };

    await firestore.createDocument('deposits', depositId, depositData);

    // Return invoice
    const response: LnurlCallbackResponse = {
      pr: quote.request,
      routes: [],
      successAction: {
        tag: 'message',
        message: `Payment received! Balance credited to ${username}@clawdentials.com`,
      },
    };

    return Response.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('LNURL callback error:', error);
    const errorResponse: LnurlError = {
      status: 'ERROR',
      reason: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
    return Response.json(errorResponse, { status: 500, headers: corsHeaders });
  }
}
