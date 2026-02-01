/**
 * GET /api/transparency
 *
 * Public Transaction Ledger - all transactions with on-chain proof
 * Anyone can verify Clawdentials is real
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

interface PublicTransaction {
  id: string;
  type: 'deposit' | 'payout' | 'escrow_lock' | 'escrow_release';
  agentId: string;
  amount: number;
  currency: string;
  network?: string;
  txHash?: string;
  explorerUrl?: string;
  timestamp: string;
  status: string;
  bountyId?: string;
  bountyTitle?: string;
}

function getExplorerUrl(currency: string, network: string, txHash: string): string | undefined {
  if (!txHash) return undefined;

  switch (currency) {
    case 'USDT':
      if (network === 'trc20') return `https://tronscan.org/#/transaction/${txHash}`;
      break;
    case 'BTC':
      if (network === 'lightning') return undefined;
      return `https://mempool.space/tx/${txHash}`;
    case 'USDC':
      if (network === 'base') return `https://basescan.org/tx/${txHash}`;
      break;
  }
  return undefined;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');
    const agentId = url.searchParams.get('agent');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);

    const transactions: PublicTransaction[] = [];

    // Get deposits
    if (!type || type === 'deposits') {
      const deposits = await firestore.queryCollection(
        'deposits',
        [{ field: 'status', op: 'EQUAL', value: 'completed' }],
        limit
      );

      for (const d of deposits) {
        if (agentId && d.agentId !== agentId) continue;

        transactions.push({
          id: d.id,
          type: 'deposit',
          agentId: d.agentId,
          amount: d.amount || d.amountUsd || 0,
          currency: d.currency || 'USDT',
          network: d.network || 'trc20',
          txHash: d.txHash || d.transactionId,
          explorerUrl: getExplorerUrl(d.currency || 'USDT', d.network || 'trc20', d.txHash || d.transactionId),
          timestamp: d.completedAt || d.createdAt,
          status: 'confirmed',
        });
      }
    }

    // Get completed bounty payouts
    if (!type || type === 'payouts') {
      const bounties = await firestore.queryCollection(
        'bounties',
        [{ field: 'status', op: 'EQUAL', value: 'completed' }],
        limit
      );

      for (const b of bounties) {
        if (agentId && b.winnerId !== agentId) continue;

        transactions.push({
          id: `payout_${b.id}`,
          type: 'payout',
          agentId: b.winnerId,
          amount: b.amount,
          currency: b.currency || 'USDC',
          timestamp: b.completedAt,
          status: 'paid',
          bountyId: b.id,
          bountyTitle: b.title,
        });
      }
    }

    // Sort by timestamp
    transactions.sort((a, b) =>
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );

    // Calculate totals
    const totals = {
      totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
      totalPayouts: transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length,
    };

    return Response.json(
      {
        success: true,
        message: 'Clawdentials Public Ledger - All transactions verifiable',
        disclaimer: 'This is a public audit trail. No sensitive data is exposed. Transaction hashes can be verified on respective block explorers.',
        totals,
        transactions: transactions.slice(0, limit),
        verificationLinks: {
          usdt_trc20: 'https://tronscan.org',
          btc: 'https://mempool.space',
          usdc_base: 'https://basescan.org',
        },
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Transparency API error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch transparency data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
