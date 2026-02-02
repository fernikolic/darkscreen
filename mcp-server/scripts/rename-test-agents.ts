#!/usr/bin/env tsx
/**
 * Rename test agents in Firestore to more realistic names
 *
 * Usage:
 *   npx tsx scripts/rename-test-agents.ts          # Dry run - show what would change
 *   npx tsx scripts/rename-test-agents.ts --execute # Actually make changes
 */
import { initFirestore, getDb } from '../src/services/firestore.js';
import { randomBytes } from 'crypto';

// Name patterns based on skills
const NAME_PATTERNS = {
  coding: ['CodeAssist', 'DevBot', 'SyntaxAI', 'BuilderBot', 'CodeCraft', 'DevHelper', 'ByteBot'],
  research: ['ResearchPro', 'AnalystAI', 'InsightBot', 'DataMiner', 'QueryBot', 'FactFinder'],
  writing: ['ContentCraft', 'WriterBot', 'ProseAI', 'WordSmith', 'CopyBot', 'TextFlow'],
  general: ['TaskRunner', 'AgentX', 'WorkflowAI', 'AutoHelper', 'SmartBot', 'FlexAgent', 'TaskMate'],
};

// Skills that map to categories
const SKILL_MAPPING: Record<string, keyof typeof NAME_PATTERNS> = {
  // Coding skills
  'coding': 'coding',
  'typescript': 'coding',
  'python': 'coding',
  'javascript': 'coding',
  'go': 'coding',
  'rust': 'coding',
  'code-review': 'coding',
  'testing': 'coding',
  'api': 'coding',
  'development': 'coding',
  'programming': 'coding',
  'debugging': 'coding',
  // Research skills
  'research': 'research',
  'analysis': 'research',
  'data': 'research',
  'market-analysis': 'research',
  'analytics': 'research',
  // Writing skills
  'writing': 'writing',
  'copywriting': 'writing',
  'technical-writing': 'writing',
  'content': 'writing',
  'documentation': 'writing',
  'blog': 'writing',
  'seo': 'writing',
};

// Patterns that indicate test agents
const TEST_PATTERNS = [
  /^test/i,
  /testing/i,
  /^client-/i,
  /^provider-/i,
  /^demo-/i,
  /^sample-/i,
];

function isTestAgent(name: string): boolean {
  return TEST_PATTERNS.some(pattern => pattern.test(name));
}

function generateRandomSuffix(): string {
  // Generate 2-3 random alphanumeric characters
  const length = Math.random() > 0.5 ? 3 : 2;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O/0, I/1
  let suffix = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return suffix;
}

function getCategoryFromSkills(skills: string[]): keyof typeof NAME_PATTERNS {
  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    for (const [keyword, category] of Object.entries(SKILL_MAPPING)) {
      if (lowerSkill.includes(keyword)) {
        return category;
      }
    }
  }
  return 'general';
}

function generateNewName(skills: string[], usedNames: Set<string>): string {
  const category = getCategoryFromSkills(skills);
  const patterns = NAME_PATTERNS[category];

  // Try to generate a unique name
  for (let attempt = 0; attempt < 100; attempt++) {
    const baseName = patterns[Math.floor(Math.random() * patterns.length)];
    const suffix = generateRandomSuffix();
    const newName = `${baseName}-${suffix}`;

    if (!usedNames.has(newName.toLowerCase())) {
      usedNames.add(newName.toLowerCase());
      return newName;
    }
  }

  // Fallback: use timestamp
  const baseName = patterns[0];
  const timestamp = Date.now().toString(36).slice(-4);
  return `${baseName}-${timestamp}`;
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  console.log('=== RENAME TEST AGENTS ===\n');
  console.log(execute ? 'Mode: EXECUTE (will make changes)\n' : 'Mode: DRY RUN (no changes)\n');

  initFirestore();
  const db = getDb();

  // Get all agents
  const snapshot = await db.collection('agents').get();

  // Track used names to avoid duplicates
  const usedNames = new Set<string>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    usedNames.add((data.name || doc.id).toLowerCase());
  });

  // Find test agents
  const testAgents: { id: string; name: string; skills: string[] }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name || doc.id;

    if (isTestAgent(name)) {
      testAgents.push({
        id: doc.id,
        name,
        skills: data.skills || [],
      });
    }
  }

  if (testAgents.length === 0) {
    console.log('No test agents found matching patterns:');
    TEST_PATTERNS.forEach(p => console.log(`  - ${p}`));
    return;
  }

  console.log(`Found ${testAgents.length} test agents to rename:\n`);

  // Generate new names and show/apply changes
  const changes: { oldName: string; newName: string; nip05: string }[] = [];

  for (const agent of testAgents) {
    // Remove old name from used names so we can generate without conflict
    usedNames.delete(agent.name.toLowerCase());

    const newName = generateNewName(agent.skills, usedNames);
    const newNip05 = `${newName}@clawdentials.com`;

    changes.push({
      oldName: agent.name,
      newName,
      nip05: newNip05,
    });

    console.log(`[${agent.id}]`);
    console.log(`  Before: ${agent.name}`);
    console.log(`  After:  ${newName}`);
    console.log(`  NIP-05: ${newNip05}`);
    console.log(`  Skills: ${agent.skills.length > 0 ? agent.skills.join(', ') : '(none)'}`);
    console.log('');

    if (execute) {
      // Update the agent document
      // Note: Firestore document ID stays the same (the old name), only the name field changes
      await db.collection('agents').doc(agent.id).update({
        name: newName,
        nip05: newNip05,
      });
      console.log('  --> Updated!\n');
    }
  }

  console.log('---');
  console.log(`Total: ${changes.length} agents ${execute ? 'renamed' : 'would be renamed'}`);

  if (!execute) {
    console.log('\nTo apply these changes, run:');
    console.log('  npx tsx scripts/rename-test-agents.ts --execute');
  }
}

main().catch(console.error);
