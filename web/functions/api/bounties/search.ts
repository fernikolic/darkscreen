/**
 * GET /api/bounties/search
 *
 * Search bounties by skill, difficulty, amount range
 * Public endpoint for autonomous agent discovery
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
    const url = new URL(context.request.url);

    // Query parameters
    const skill = url.searchParams.get('skill');
    const difficulty = url.searchParams.get('difficulty');
    const minAmount = url.searchParams.get('minAmount');
    const maxAmount = url.searchParams.get('maxAmount');
    const status = url.searchParams.get('status') || 'open';
    const tag = url.searchParams.get('tag');
    const limitParam = url.searchParams.get('limit');
    const sortBy = url.searchParams.get('sort') || 'amount'; // amount, expires, created

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

    // Build Firestore filters (status is always filtered)
    const filters = [{ field: 'status', op: 'EQUAL', value: status }];

    // Difficulty filter (exact match)
    if (difficulty) {
      filters.push({ field: 'difficulty', op: 'EQUAL', value: difficulty });
    }

    // Query Firestore (we'll filter more in memory due to REST API limitations)
    let bounties = await firestore.queryCollection('bounties', filters, limit * 3);

    // Filter by skill (in memory, case-insensitive partial match)
    if (skill) {
      const skillLower = skill.toLowerCase();
      bounties = bounties.filter(bounty => {
        const skills = bounty.requiredSkills || [];
        return skills.some((s: string) => s.toLowerCase().includes(skillLower));
      });
    }

    // Filter by tag
    if (tag) {
      const tagLower = tag.toLowerCase();
      bounties = bounties.filter(bounty => {
        const tags = bounty.tags || [];
        return tags.some((t: string) => t.toLowerCase().includes(tagLower));
      });
    }

    // Filter by amount range
    if (minAmount) {
      const min = parseFloat(minAmount);
      bounties = bounties.filter(bounty => bounty.amount >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      bounties = bounties.filter(bounty => bounty.amount <= max);
    }

    // Sort
    switch (sortBy) {
      case 'amount':
        bounties.sort((a, b) => b.amount - a.amount);
        break;
      case 'expires':
        bounties.sort((a, b) => {
          const aTime = new Date(a.expiresAt).getTime();
          const bTime = new Date(b.expiresAt).getTime();
          return aTime - bTime; // Soonest first
        });
        break;
      case 'created':
        bounties.sort((a, b) => {
          const aTime = new Date(b.createdAt).getTime();
          const bTime = new Date(a.createdAt).getTime();
          return aTime - bTime; // Newest first
        });
        break;
    }

    // Format for listing (lightweight)
    const listings = bounties.slice(0, limit).map(bounty => ({
      id: bounty.id,
      title: bounty.title,
      summary: bounty.summary,
      amount: bounty.amount,
      currency: bounty.currency || 'USDC',
      difficulty: bounty.difficulty,
      requiredSkills: bounty.requiredSkills || [],
      tags: bounty.tags || [],
      status: bounty.status,
      expiresAt: bounty.expiresAt,
      claimCount: bounty.claimCount || 0,
      posterAgentId: bounty.posterAgentId,
    }));

    const totalRewards = listings.reduce((sum, b) => sum + b.amount, 0);

    return Response.json(
      {
        success: true,
        bounties: listings,
        count: listings.length,
        totalRewards,
        query: {
          skill: skill || null,
          difficulty: difficulty || null,
          minAmount: minAmount ? parseFloat(minAmount) : null,
          maxAmount: maxAmount ? parseFloat(maxAmount) : null,
          tag: tag || null,
          status,
          sort: sortBy,
          limit,
        },
        _examples: {
          bySkill: '/api/bounties/search?skill=typescript',
          byDifficulty: '/api/bounties/search?difficulty=easy',
          byAmount: '/api/bounties/search?minAmount=50&maxAmount=200',
          combined: '/api/bounties/search?skill=coding&difficulty=medium&minAmount=25',
        },
        _links: {
          list: '/api/bounties',
          docs: '/llms.txt',
          register: '/api/agent/register',
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Bounty search error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
