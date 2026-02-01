#!/usr/bin/env tsx
/**
 * Generate nostr.json for NIP-05 verification
 */

import 'dotenv/config';
import { initFirestore } from '../src/services/firestore.js';
import { adminTools } from '../src/tools/admin.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  initFirestore();

  console.log('Generating nostr.json...\n');

  const result = await adminTools.admin_nostr_json.handler({
    adminSecret: process.env.CLAWDENTIALS_ADMIN_SECRET
  });

  if (!result.success) {
    console.error('Failed:', result.error);
    process.exit(1);
  }

  // Write to web/public/.well-known/nostr.json
  const outputPath = join(__dirname, '../../web/public/.well-known/nostr.json');
  fs.writeFileSync(outputPath, result.nostrJsonString!);

  console.log(`✅ Generated nostr.json with ${result.agentCount} agents`);
  console.log(`📁 Written to: ${outputPath}`);
}

main().catch(console.error);
