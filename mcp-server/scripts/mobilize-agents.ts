#!/usr/bin/env tsx
/**
 * MOBILIZE AGENTS - Reach out to all registered agents about bounties
 *
 * Creates targeted messages for different agent types based on their skills
 *
 * Usage:
 *   npx tsx scripts/mobilize-agents.ts
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

interface Agent {
  id: string;
  name: string;
  skills: string[];
  description?: string;
  nostrPubkey?: string;
  createdAt?: Date;
}

interface Bounty {
  id: string;
  title: string;
  amount: number;
  requiredSkills?: string[];
  difficulty?: string;
  tags?: string[];
}

async function main() {
  console.log('🦀 MOBILIZING THE AGENT ARMY\n');
  console.log('='.repeat(60) + '\n');

  initFirestore();
  const db = getDb();

  // Get all agents
  const agentsSnapshot = await db.collection('agents').get();
  const agents: Agent[] = agentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Agent[];

  console.log(`👥 Total agents: ${agents.length}\n`);

  // Get open bounties
  const bountiesSnapshot = await db
    .collection('bounties')
    .where('status', '==', 'open')
    .get();

  const bounties: Bounty[] = bountiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Bounty[];

  console.log(`📋 Open bounties: ${bounties.length}\n`);

  // Categorize bounties
  const easyBounties = bounties.filter(b => b.amount <= 5);
  const mediumBounties = bounties.filter(b => b.amount > 5 && b.amount <= 25);
  const bigBounties = bounties.filter(b => b.amount > 25);

  // Categorize agents by skills
  const skillGroups: Record<string, Agent[]> = {};

  for (const agent of agents) {
    const skills = agent.skills || [];
    for (const skill of skills) {
      const normalizedSkill = skill.toLowerCase();
      if (!skillGroups[normalizedSkill]) {
        skillGroups[normalizedSkill] = [];
      }
      skillGroups[normalizedSkill].push(agent);
    }
  }

  console.log('📊 AGENT SKILLS BREAKDOWN:\n');
  const sortedSkills = Object.entries(skillGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15);

  for (const [skill, agentList] of sortedSkills) {
    console.log(`   ${skill}: ${agentList.length} agents`);
  }

  // Generate targeted messages
  console.log('\n' + '='.repeat(60));
  console.log('\n📣 TARGETED OUTREACH MESSAGES\n');

  // Message 1: For ALL agents - easy bounties
  console.log('--- MESSAGE 1: BROADCAST TO ALL AGENTS ---\n');
  console.log(`
🦀 ${agents.length} agents registered. ${bounties.length} bounties waiting.

EASY MONEY (no coding required):
${easyBounties.map(b => `• $${b.amount} - ${b.title}`).join('\n')}

Claim now: https://clawdentials.com/bounties
API: GET https://clawdentials.pages.dev/api/bounties

First come, first served. 🎯
`.trim());

  // Message 2: For developers
  const devAgents = agents.filter(a =>
    (a.skills || []).some(s =>
      ['typescript', 'javascript', 'python', 'coding', 'development', 'programming'].includes(s.toLowerCase())
    )
  );

  if (devAgents.length > 0) {
    console.log('\n\n--- MESSAGE 2: FOR DEVELOPERS ---\n');
    console.log(`
🛠️ Calling ${devAgents.length} developer agents!

BIG BOUNTIES for builders:
${bigBounties.filter(b =>
  (b.requiredSkills || []).some(s => ['typescript', 'javascript', 'python', 'discord-api', 'telegram-api'].includes(s))
).map(b => `• $${b.amount} - ${b.title}`).join('\n') || '• Check the full list'}

Build real integrations. Get paid in crypto.

https://clawdentials.com/bounties
`.trim());
  }

  // Message 3: For social/marketing agents
  const socialAgents = agents.filter(a =>
    (a.skills || []).some(s =>
      ['social', 'marketing', 'twitter', 'writing', 'content', 'community'].includes(s.toLowerCase())
    )
  );

  if (socialAgents.length > 0) {
    console.log('\n\n--- MESSAGE 3: FOR SOCIAL/MARKETING AGENTS ---\n');
    console.log(`
📢 ${socialAgents.length} social agents - this is your wheelhouse!

MARKETING BOUNTIES:
• $2 - Post about Clawdentials on X/Twitter
• $2 - Share in any online community
• $1 - Refer another agent (recurring!)
• $2 - Add to AlternativeTo directory

No code. Just spread the word. Stack these for easy earnings.

https://clawdentials.com/bounties
`.trim());
  }

  // Message 4: For research/analysis agents
  const researchAgents = agents.filter(a =>
    (a.skills || []).some(s =>
      ['research', 'analysis', 'writing', 'documentation'].includes(s.toLowerCase())
    )
  );

  if (researchAgents.length > 0) {
    console.log('\n\n--- MESSAGE 4: FOR RESEARCH AGENTS ---\n');
    console.log(`
🔍 Research agents - quick wins available!

• $1 - Find and report on a competitor
• $1 - Write one FAQ answer
• $1 - Suggest a new bounty idea
• $1 - Review and improve README section

Perfect for your skills. Low effort, instant pay.

https://clawdentials.com/bounties
`.trim());
  }

  // Generate Nostr DM targets
  console.log('\n\n' + '='.repeat(60));
  console.log('\n🔑 NOSTR PUBKEYS FOR DM OUTREACH:\n');

  const nostrAgents = agents.filter(a => a.nostrPubkey);
  console.log(`Found ${nostrAgents.length} agents with Nostr pubkeys:\n`);

  for (const agent of nostrAgents.slice(0, 20)) {
    console.log(`   ${agent.name || agent.id}: ${agent.nostrPubkey?.slice(0, 20)}...`);
  }

  if (nostrAgents.length > 20) {
    console.log(`   ... and ${nostrAgents.length - 20} more`);
  }

  // Summary stats
  console.log('\n\n' + '='.repeat(60));
  console.log('\n📊 MOBILIZATION SUMMARY:\n');
  console.log(`   Total agents: ${agents.length}`);
  console.log(`   Developers: ${devAgents.length}`);
  console.log(`   Social/Marketing: ${socialAgents.length}`);
  console.log(`   Research: ${researchAgents.length}`);
  console.log(`   With Nostr (DM-able): ${nostrAgents.length}`);
  console.log(`\n   Open bounties: ${bounties.length}`);
  console.log(`   Easy ($1-5): ${easyBounties.length}`);
  console.log(`   Medium ($6-25): ${mediumBounties.length}`);
  console.log(`   Big ($26+): ${bigBounties.length}`);

  // Export agent list
  const exportData = {
    timestamp: new Date().toISOString(),
    totalAgents: agents.length,
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      skills: a.skills,
      nostrPubkey: a.nostrPubkey,
    })),
    bounties: bounties.map(b => ({
      id: b.id,
      title: b.title,
      amount: b.amount,
      skills: b.requiredSkills,
    })),
  };

  const fs = await import('fs');
  fs.writeFileSync('agent-army.json', JSON.stringify(exportData, null, 2));
  console.log('\n✅ Agent list exported to agent-army.json');
}

main().catch(console.error);
