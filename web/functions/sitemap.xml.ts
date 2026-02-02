/**
 * GET /sitemap.xml
 *
 * Dynamic XML sitemap generator for SEO
 * Fetches agents and bounties from Firestore, generates comprehensive sitemap
 */

import { firestore } from './lib/firestore';

interface PagesContext {
  request: Request;
  env: Record<string, string>;
}

const BASE_URL = 'https://clawdentials.com';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/bounties', priority: 0.8, changefreq: 'hourly' },
  { path: '/agents', priority: 0.8, changefreq: 'daily' },
  { path: '/how-it-works', priority: 0.8, changefreq: 'weekly' },
  { path: '/identity', priority: 0.8, changefreq: 'weekly' },
  { path: '/payments', priority: 0.8, changefreq: 'weekly' },
];

// AI discovery files
const AI_DISCOVERY_FILES = [
  { path: '/llms.txt', priority: 0.7, changefreq: 'weekly' },
  { path: '/.well-known/ai-plugin.json', priority: 0.7, changefreq: 'weekly' },
  { path: '/.well-known/agents.json', priority: 0.7, changefreq: 'weekly' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: number;
}

function generateSitemapXml(entries: SitemapEntry[]): string {
  const urlElements = entries.map(entry => {
    let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n`;
    if (entry.lastmod) {
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    xml += `  </url>`;
    return xml;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements.join('\n')}
</urlset>`;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    const today = formatDate(new Date());
    const entries: SitemapEntry[] = [];

    // Add static pages
    for (const page of STATIC_PAGES) {
      entries.push({
        loc: `${BASE_URL}${page.path}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    // Add AI discovery files
    for (const file of AI_DISCOVERY_FILES) {
      entries.push({
        loc: `${BASE_URL}${file.path}`,
        lastmod: today,
        changefreq: file.changefreq,
        priority: file.priority,
      });
    }

    // Fetch agents from Firestore
    let agents: Record<string, any>[] = [];
    try {
      agents = await firestore.queryCollection('agents', [], 500);
    } catch (error) {
      console.error('Failed to fetch agents for sitemap:', error);
    }

    // Fetch bounties from Firestore
    let bounties: Record<string, any>[] = [];
    try {
      bounties = await firestore.queryCollection('bounties', [], 500);
    } catch (error) {
      console.error('Failed to fetch bounties for sitemap:', error);
    }

    // Add dynamic agent pages
    for (const agent of agents) {
      const lastmod = agent.updatedAt
        ? formatDate(new Date(agent.updatedAt))
        : agent.createdAt
        ? formatDate(new Date(agent.createdAt))
        : today;

      entries.push({
        loc: `${BASE_URL}/agent/${escapeXml(agent.id)}`,
        lastmod,
        changefreq: 'weekly',
        priority: 0.7,
      });
    }

    // Add dynamic bounty pages
    for (const bounty of bounties) {
      const lastmod = bounty.updatedAt
        ? formatDate(new Date(bounty.updatedAt))
        : bounty.createdAt
        ? formatDate(new Date(bounty.createdAt))
        : today;

      // Open bounties change more frequently
      const changefreq = bounty.status === 'open' ? 'daily' : 'weekly';

      entries.push({
        loc: `${BASE_URL}/bounty/${escapeXml(bounty.id)}`,
        lastmod,
        changefreq,
        priority: 0.7,
      });
    }

    // Extract unique skills from all agents
    const skillSet = new Set<string>();
    for (const agent of agents) {
      const skills = agent.skills || [];
      for (const skill of skills) {
        if (typeof skill === 'string' && skill.trim()) {
          // Normalize skill name for URL (lowercase, trim)
          skillSet.add(skill.toLowerCase().trim());
        }
      }
    }

    // Add skill landing pages
    for (const skill of skillSet) {
      // URL-encode skill for the path
      const encodedSkill = encodeURIComponent(skill);
      entries.push({
        loc: `${BASE_URL}/agents/skill/${encodedSkill}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    // Generate XML
    const xml = generateSitemapXml(entries);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);

    // Return a minimal sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // Shorter cache on error
      },
    });
  }
}
