/**
 * GET /badge/:name.svg
 *
 * Dynamic SVG badge for agent identity
 * Embeddable anywhere - shows name, score, and verification status
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
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    // Remove .svg suffix if present
    let agentName = context.params.name;
    if (agentName.endsWith('.svg')) {
      agentName = agentName.slice(0, -4);
    }

    if (!agentName) {
      return new Response(generateErrorBadge('Invalid'), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
          ...corsHeaders,
        },
      });
    }

    const agent = await firestore.getDocument('agents', agentName);

    if (!agent) {
      return new Response(generateNotFoundBadge(agentName), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
          ...corsHeaders,
        },
      });
    }

    const reputationScore = calculateReputationScore(agent);
    const name = agent.name || agentName;
    const verified = agent.verified || false;

    const svg = generateBadge({
      name,
      score: reputationScore,
      verified,
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Badge generation error:', error);
    return new Response(generateErrorBadge('Error'), {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
        ...corsHeaders,
      },
    });
  }
}

interface BadgeData {
  name: string;
  score: number;
  verified: boolean;
}

function generateBadge(data: BadgeData): string {
  const scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 50 ? '#eab308' : '#ef4444';
  const verifiedIcon = data.verified
    ? `<circle cx="195" cy="14" r="6" fill="#3b82f6"/><path d="M192.5 14l1.5 1.5 3-3" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';

  // Calculate widths based on text length
  const nameWidth = Math.max(60, data.name.length * 7 + 20);
  const scoreWidth = 50;
  const totalWidth = nameWidth + scoreWidth + (data.verified ? 20 : 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" viewBox="0 0 ${totalWidth} 28">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1a1a1a"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${totalWidth}" height="28" rx="6" fill="url(#bg)"/>

  <!-- Clawdentials logo area -->
  <rect width="${nameWidth}" height="28" rx="6" fill="url(#accent)"/>
  <rect x="${nameWidth - 6}" width="6" height="28" fill="url(#accent)"/>

  <!-- Agent name -->
  <text x="${nameWidth / 2}" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="white" text-anchor="middle">${escapeXml(data.name)}</text>

  <!-- Score -->
  <text x="${nameWidth + scoreWidth / 2}" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="${scoreColor}" text-anchor="middle">${data.score}</text>

  <!-- Verified checkmark -->
  ${data.verified ? `
  <g transform="translate(${nameWidth + scoreWidth - 5}, 0)">
    <circle cx="12" cy="14" r="6" fill="#3b82f6"/>
    <path d="M9.5 14l1.5 1.5 3-3" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  ` : ''}

  <!-- Border -->
  <rect width="${totalWidth}" height="28" rx="6" fill="none" stroke="#333" stroke-width="1"/>
</svg>`;
}

function generateNotFoundBadge(name: string): string {
  const displayName = name.length > 15 ? name.slice(0, 12) + '...' : name;
  const nameWidth = Math.max(60, displayName.length * 7 + 20);
  const totalWidth = nameWidth + 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" viewBox="0 0 ${totalWidth} 28">
  <rect width="${totalWidth}" height="28" rx="6" fill="#1a1a1a"/>
  <rect width="${nameWidth}" height="28" rx="6" fill="#333"/>
  <rect x="${nameWidth - 6}" width="6" height="28" fill="#333"/>
  <text x="${nameWidth / 2}" y="18" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" fill="#888" text-anchor="middle">${escapeXml(displayName)}</text>
  <text x="${nameWidth + 30}" y="18" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="#666" text-anchor="middle">not found</text>
  <rect width="${totalWidth}" height="28" rx="6" fill="none" stroke="#333" stroke-width="1"/>
</svg>`;
}

function generateErrorBadge(message: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="28" viewBox="0 0 100 28">
  <rect width="100" height="28" rx="6" fill="#1a1a1a"/>
  <text x="50" y="18" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" fill="#ef4444" text-anchor="middle">${escapeXml(message)}</text>
  <rect width="100" height="28" rx="6" fill="none" stroke="#333" stroke-width="1"/>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
