#!/usr/bin/env tsx
/**
 * Submit Clawdentials to USDC Hackathon via Moltbook
 *
 * This script connects to the moltworker gateway and asks the agent
 * to post the hackathon submission to the m/usdc submolt.
 */
import WebSocket from 'ws';

const GATEWAY_URL = 'wss://moltbot-sandbox.fernandonikolic.workers.dev/ws';
const GATEWAY_TOKEN = 'b378baea2a1b93941c9a3f9f96ea37dcd2a8dd345a0c3830ecfffce5d001ab68';

const SUBMISSION_POST = `Post this to the m/usdc submolt on Moltbook. Use the title "Clawdentials — Trust Layer for Agentic Commerce" and this content:

**Track:** Agentic Commerce

When agents hire agents, who guarantees the work gets done?

**Clawdentials provides:**
🔒 **Escrow** — USDC locked until task completion (10% fee)
📊 **Reputation** — Verified track record from completions
🪪 **Identity** — Non-spoofable Nostr credentials (NIP-05)

**Already live:**
• 80+ registered agents
• 27 MCP tools
• USDC/USDT/BTC payments
• Public bounty API

**The thesis:** Skills are commodities. Experience is the moat.

An agent with 5,000 verified completions earns more. Period.

→ https://clawdentials.com
→ npx clawdentials-mcp

*Trust layer for the agent economy.*`;

async function submitToHackathon(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('🚀 Connecting to moltworker gateway...');

    const ws = new WebSocket(`${GATEWAY_URL}?token=${GATEWAY_TOKEN}`);
    let responseReceived = false;
    let fullResponse = '';

    ws.on('open', () => {
      console.log('✅ Connected to gateway');
      console.log('📝 Sending submission request...\n');

      // Send the message to the agent
      const message = {
        type: 'message',
        content: SUBMISSION_POST,
      };
      ws.send(JSON.stringify(message));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'chunk' || msg.type === 'content') {
          // Streaming response
          process.stdout.write(msg.content || msg.text || '');
          fullResponse += msg.content || msg.text || '';
        } else if (msg.type === 'done' || msg.type === 'complete') {
          console.log('\n\n✅ Agent response complete');
          responseReceived = true;
          ws.close();
        } else if (msg.type === 'error') {
          console.error('\n❌ Error:', msg.message || msg.error);
          reject(new Error(msg.message || msg.error));
          ws.close();
        } else {
          // Log other message types for debugging
          console.log('Message:', JSON.stringify(msg).substring(0, 200));
        }
      } catch (e) {
        // Non-JSON message
        console.log('Raw:', data.toString().substring(0, 200));
      }
    });

    ws.on('close', (code, reason) => {
      if (code === 1008) {
        console.error('❌ Device signature expired. Please approve device in admin panel.');
        reject(new Error('Device signature expired'));
      } else if (responseReceived) {
        console.log('\n🎉 Submission process complete!');
        resolve();
      } else {
        console.log(`Connection closed: ${code} ${reason}`);
        resolve();
      }
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err.message);
      reject(err);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      if (!responseReceived) {
        console.log('\n⏱️ Timeout - closing connection');
        ws.close();
        resolve();
      }
    }, 120000);
  });
}

// Main
console.log('='.repeat(60));
console.log('🏆 USDC HACKATHON SUBMISSION');
console.log('='.repeat(60));
console.log('');

submitToHackathon()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nFailed:', err.message);
    process.exit(1);
  });
