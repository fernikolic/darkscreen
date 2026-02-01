#!/usr/bin/env tsx
import { initFirestore } from '../src/services/firestore.js';
import { cashuService } from '../src/services/payments/cashu.js';

async function main() {
  initFirestore();

  const sats = parseInt(process.env.SATS || '12545', 10);

  console.log(`⚡ Creating invoice for ${sats} sats...\n`);

  const result = await cashuService.createDeposit({
    amount: sats,
    agentId: 'clawdentials-bounties',
    description: 'Full wallet deposit',
  });

  if (result.success) {
    console.log('LIGHTNING INVOICE:\n');
    console.log(result.quote?.bolt11);
    console.log('\n');
    console.log('Quote ID:', result.quote?.quoteId);

    // Save for checking later
    const fs = await import('fs');
    fs.writeFileSync('.last-deposit-id', result.quote?.quoteId || '');
  } else {
    console.log('Error:', result.error);
  }
}

main().catch(console.error);
