# Moltbot Integration Guide

How moltbot (running on `/root/clawd/`) can log activity so Claude Code can see what's happening.

## Option 1: Direct Firestore Writes (Recommended)

Moltbot can write directly to the `activity` collection in Firestore.

### Setup

1. Get Firebase service account key:
   - Download from Firebase Console → Project Settings → Service Accounts
   - Save to `/root/clawd/firebase-service-account.json`

2. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

3. Use this snippet to log activity:

```typescript
import admin from 'firebase-admin';

// Initialize once
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Log activity function
async function logActivity(activity: {
  agentId: string;
  platform: 'moltbook' | 'nostr' | 'github' | 'twitter' | 'discord' | 'other';
  action: 'post' | 'comment' | 'reply' | 'like' | 'dm' | 'research' | 'bounty' | 'other';
  targetId?: string;
  contentSnippet?: string;
  signal?: string;
  metadata?: Record<string, any>;
}) {
  const ref = db.collection('activity').doc();
  await ref.set({
    ...activity,
    id: ref.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Activity logged: ${activity.action} on ${activity.platform}`);
}

// Example usage
await logActivity({
  agentId: 'moltbot',
  platform: 'moltbook',
  action: 'comment',
  targetId: 'b1daf344-cbfd-4a71-944f-de710f4b0d1d',
  contentSnippet: 'Great point about agent persistence...',
  signal: 'Agent persistence layer exists, needs verification layer',
});
```

## Option 2: HTTP API (Coming Soon)

We can add an activity logging endpoint:
```
POST https://clawdentials.pages.dev/api/activity/log
```

## Option 3: Git Push to Shared Repo

Moltbot can push activity logs to a shared git repo that Claude Code can read.

```bash
# In /root/clawd/
echo '{"timestamp":"2026-02-02T08:10:56Z","platform":"moltbook","action":"comment"}' >> activity.jsonl
git add activity.jsonl
git commit -m "Activity log update"
git push
```

## Activity Schema

Each activity entry should have:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentId | string | Yes | Agent identifier (e.g., "moltbot") |
| platform | enum | Yes | moltbook, nostr, github, twitter, discord, other |
| action | enum | Yes | post, comment, reply, like, dm, research, bounty, other |
| targetId | string | No | Post ID, user ID, etc. |
| contentSnippet | string | No | Brief content preview (max 200 chars) |
| signal | string | No | Market signal or insight discovered |
| metadata | object | No | Additional context |
| timestamp | date | Auto | Set by Firestore |

## Querying Activity (Claude Code)

Claude Code can query activity using the MCP tools:

```
activity_query({ platform: 'moltbook', limit: 10 })
activity_summary({ hours: 24 })
```

Or directly via Firestore Firebase MCP tools.

## Heartbeat Pattern

Recommended: Log a heartbeat entry every few hours so Claude Code knows moltbot is alive:

```typescript
await logActivity({
  agentId: 'moltbot',
  platform: 'other',
  action: 'other',
  contentSnippet: 'Heartbeat - system running normally',
  metadata: {
    type: 'heartbeat',
    uptime: process.uptime(),
    lastMoltbookCheck: '2026-02-02T08:00:00Z',
    lastNostrCheck: '2026-02-02T07:30:00Z',
  },
});
```

## Current State File

Moltbot should also maintain `/root/clawd/AGENT_STATE.md` with:
- Current mission
- Active engagement patterns
- Key signals from market research
- Links to memory files

This gives Claude Code context when it needs to understand what moltbot is doing.
