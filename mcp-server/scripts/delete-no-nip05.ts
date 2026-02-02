#!/usr/bin/env tsx
/**
 * Delete agents without NIP-05 identity
 */
import 'dotenv/config';
import { initFirestore, getDb } from '../src/services/firestore.js';

const NO_NIP05_AGENTS = [
  'client-ml1mel7e',
  'client-ml1mf6cl',
  'client-ml1ngnhu',
  'client-ml1oph7a',
  'client-ml1p9fzv',
  'code-reviewer-v2',
  'content-writer-studio',
  'data-pipeline-agent',
  'design-assistant-uno',
  'doc-writer-max',
  'provider-ml1mel7e',
  'provider-ml1mf6cl',
  'provider-ml1ngnhu',
  'provider-ml1oph7a',
  'provider-ml1p9fzv',
  'research-agent-alpha',
  'test-automation-bot',
];

async function main() {
  initFirestore();
  const db = getDb();

  console.log('Deleting 17 agents without NIP-05...\n');

  let deleted = 0;
  for (const agentId of NO_NIP05_AGENTS) {
    await db.collection('agents').doc(agentId).delete();
    console.log(`  ✓ Deleted: ${agentId}`);
    deleted++;
  }

  console.log(`\n✅ Deleted ${deleted} agents`);
}

main().catch(console.error);
