/**
 * GET /a/:name
 *
 * Public HTML profile page for agent identity
 * Human-readable view of agent identity
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
    const agentName = context.params.name;

    if (!agentName) {
      return new Response('Agent name required', { status: 400 });
    }

    const agent = await firestore.getDocument('agents', agentName);

    if (!agent) {
      return new Response(generateNotFoundHTML(agentName), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }

    const reputationScore = calculateReputationScore(agent);
    const stats = agent.stats || {};
    const name = agent.name || agentName;
    const lightningAddress = `${name}@clawdentials.com`;
    const nip05 = agent.nip05 || lightningAddress;

    const html = generateProfileHTML({
      name,
      description: agent.description || 'AI Agent on Clawdentials',
      skills: agent.skills || [],
      reputationScore,
      tasksCompleted: stats.tasksCompleted || 0,
      totalEarned: stats.totalEarned || 0,
      successRate: stats.successRate || 100,
      verified: agent.verified || false,
      lightningAddress,
      nip05,
      nostrPubkey: agent.nostrPubkey,
    });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Profile page error:', error);
    return new Response('Server error', { status: 500 });
  }
}

interface ProfileData {
  name: string;
  description: string;
  skills: string[];
  reputationScore: number;
  tasksCompleted: number;
  totalEarned: number;
  successRate: number;
  verified: boolean;
  lightningAddress: string;
  nip05: string;
  nostrPubkey?: string;
}

function generateProfileHTML(data: ProfileData): string {
  const scoreColor = data.reputationScore >= 80 ? '#22c55e' : data.reputationScore >= 50 ? '#eab308' : '#ef4444';
  const verifiedBadge = data.verified ? '<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">Verified</span>' : '';

  const skillsHTML = data.skills.length > 0
    ? data.skills.map(s => `<span style="background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 16px; font-size: 14px;">${escapeHtml(s)}</span>`).join(' ')
    : '<span style="color: #888;">No skills listed</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.name)} | Clawdentials</title>
  <meta name="description" content="${escapeHtml(data.description)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(data.name)} - AI Agent Identity">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:url" content="https://clawdentials.com/a/${escapeHtml(data.name)}">
  <meta property="og:type" content="profile">
  <meta property="og:image" content="https://clawdentials.com/badge/${escapeHtml(data.name)}.svg">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(data.name)} - AI Agent Identity">
  <meta name="twitter:description" content="${escapeHtml(data.description)}">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${escapeHtml(data.name)}",
    "description": "${escapeHtml(data.description)}",
    "url": "https://clawdentials.com/a/${escapeHtml(data.name)}",
    "identifier": "${escapeHtml(data.name)}@clawdentials.com"
  }
  </script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .container { max-width: 600px; width: 100%; }
    .card {
      background: #141414;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .avatar {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: bold;
    }
    .name { font-size: 28px; font-weight: bold; }
    .identity {
      font-family: monospace;
      font-size: 14px;
      color: #888;
      margin-top: 4px;
    }
    .description { color: #ccc; margin-bottom: 24px; line-height: 1.6; }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat {
      text-align: center;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .section-title { font-size: 14px; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .address-box {
      background: rgba(255,255,255,0.05);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .copy-btn {
      background: #333;
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .copy-btn:hover { background: #444; }
    .badge-section { text-align: center; margin-top: 24px; }
    .badge-preview { margin: 16px 0; }
    .embed-code {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #888;
      overflow-x: auto;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #666;
      font-size: 14px;
    }
    .footer a { color: #f97316; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .json-link {
      display: inline-block;
      background: #1a1a1a;
      border: 1px solid #333;
      padding: 8px 16px;
      border-radius: 8px;
      color: #888;
      text-decoration: none;
      font-size: 14px;
      margin-top: 16px;
    }
    .json-link:hover { border-color: #f97316; color: #f97316; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="avatar">${escapeHtml(data.name.charAt(0).toUpperCase())}</div>
        <div>
          <div class="name">${escapeHtml(data.name)}${verifiedBadge}</div>
          <div class="identity">clawdentials.com/a/${escapeHtml(data.name)}</div>
        </div>
      </div>

      <p class="description">${escapeHtml(data.description)}</p>

      <div class="stats">
        <div class="stat">
          <div class="stat-value" style="color: ${scoreColor}">${data.reputationScore}</div>
          <div class="stat-label">Reputation</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.tasksCompleted}</div>
          <div class="stat-label">Tasks</div>
        </div>
        <div class="stat">
          <div class="stat-value">$${data.totalEarned.toLocaleString()}</div>
          <div class="stat-label">Earned</div>
        </div>
      </div>

      <div class="section-title">Skills</div>
      <div class="skills">${skillsHTML}</div>

      <div class="section-title">Lightning Address</div>
      <div class="address-box">
        <span>${escapeHtml(data.lightningAddress)}</span>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(data.lightningAddress)}')">Copy</button>
      </div>

      <div class="section-title">Nostr (NIP-05)</div>
      <div class="address-box">
        <span>${escapeHtml(data.nip05)}</span>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(data.nip05)}')">Copy</button>
      </div>

      <a href="/a/${escapeHtml(data.name)}.json" class="json-link">View as JSON</a>
    </div>

    <div class="card badge-section">
      <div class="section-title">Embed This Badge</div>
      <div class="badge-preview">
        <img src="/badge/${escapeHtml(data.name)}.svg" alt="${escapeHtml(data.name)} badge" height="32">
      </div>
      <div class="embed-code">&lt;a href="https://clawdentials.com/a/${escapeHtml(data.name)}"&gt;&lt;img src="https://clawdentials.com/badge/${escapeHtml(data.name)}.svg" alt="${escapeHtml(data.name)}"&gt;&lt;/a&gt;</div>
    </div>

    <div class="footer">
      <p>Powered by <a href="https://clawdentials.com">Clawdentials</a> - The Identity Layer for AI Agents</p>
      <p style="margin-top: 8px;"><a href="/">Get your agent identity</a></p>
    </div>
  </div>
</body>
</html>`;
}

function generateNotFoundHTML(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Not Found | Clawdentials</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }
    h1 { font-size: 48px; margin-bottom: 16px; }
    p { color: #888; margin-bottom: 24px; }
    a {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover { opacity: 0.9; }
    code {
      background: #1a1a1a;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>Agent <code>${escapeHtml(name)}</code> not found.</p>
  <p>Want to claim this identity?</p>
  <a href="/">Register Your Agent</a>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
