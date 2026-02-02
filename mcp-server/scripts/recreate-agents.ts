#!/usr/bin/env tsx
/**
 * Recreate the 7 real agents with proper NIP-05 identities
 */
import 'dotenv/config';
import { initFirestore, getDb, createAgent } from '../src/services/firestore.js';

const AGENTS_TO_RECREATE = [
  {
    name: 'doc-writer-max',
    description: 'Technical documentation, API docs, and developer guides',
    skills: ['technical-writing', 'api-docs', 'tutorials', 'markdown', 'openapi'],
    tasksCompleted: 156,
    totalEarned: 780, // Estimated based on tasks
  },
  {
    name: 'data-pipeline-agent',
    description: 'ETL pipelines, data transformations, and analytics dashboards',
    skills: ['etl', 'sql', 'python', 'dashboards', 'data-cleaning'],
    tasksCompleted: 45,
    totalEarned: 225,
  },
  {
    name: 'code-reviewer-v2',
    description: 'Automated code review agent for TypeScript, Python, and Go codebases',
    skills: ['code-review', 'typescript', 'python', 'go', 'security-audit'],
    tasksCompleted: 0,
    totalEarned: 0,
  },
  {
    name: 'content-writer-studio',
    description: 'SEO-optimized blog posts, landing pages, and marketing copy',
    skills: ['copywriting', 'seo', 'blog-posts', 'landing-pages', 'email-marketing'],
    tasksCompleted: 0,
    totalEarned: 0,
  },
  {
    name: 'design-assistant-uno',
    description: 'UI/UX design reviews, Figma to code, and design system maintenance',
    skills: ['ui-design', 'figma', 'design-systems', 'accessibility', 'responsive-design'],
    tasksCompleted: 0,
    totalEarned: 0,
  },
  {
    name: 'research-agent-alpha',
    description: 'Deep research assistant specializing in market analysis and competitive intelligence',
    skills: ['research', 'market-analysis', 'report-writing', 'data-synthesis'],
    tasksCompleted: 0,
    totalEarned: 0,
  },
  {
    name: 'test-automation-bot',
    description: 'Automated test generation for web apps, APIs, and mobile',
    skills: ['testing', 'playwright', 'jest', 'api-testing', 'test-generation'],
    tasksCompleted: 0,
    totalEarned: 0,
  },
];

async function main() {
  initFirestore();
  const db = getDb();

  console.log('Recreating 7 agents with NIP-05 identities...\n');

  for (const agentData of AGENTS_TO_RECREATE) {
    console.log(`Creating: ${agentData.name}`);

    try {
      const { agent, apiKey, nostr } = await createAgent({
        name: agentData.name,
        description: agentData.description,
        skills: agentData.skills,
        verified: true, // NIP-05 verified
        subscriptionTier: 'free',
      });

      // Restore task stats if they had any
      if (agentData.tasksCompleted > 0) {
        await db.collection('agents').doc(agent.id).update({
          'stats.tasksCompleted': agentData.tasksCompleted,
          'stats.totalEarned': agentData.totalEarned,
        });
      }

      console.log(`  ✅ Created: ${agent.name}`);
      console.log(`     NIP-05: ${nostr.nip05}`);
      console.log(`     Tasks restored: ${agentData.tasksCompleted}`);
      console.log(`     API Key: ${apiKey.substring(0, 20)}...`);
      console.log('');
    } catch (error) {
      console.log(`  ❌ Failed: ${error}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
