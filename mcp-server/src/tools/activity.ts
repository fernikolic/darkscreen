/**
 * ACTIVITY TOOLS - Log and query agent activity
 *
 * Used by moltbot and other agents to report what they're doing,
 * so Claude Code can see activity across machines.
 */

import { z } from 'zod';
import { getDb } from '../services/firestore.js';
import { Timestamp } from 'firebase-admin/firestore';

// Schema for logging activity
export const activityLogSchema = z.object({
  agentId: z.string().describe('The agent logging the activity'),
  platform: z.enum(['moltbook', 'nostr', 'github', 'twitter', 'discord', 'other']),
  action: z.enum(['post', 'comment', 'reply', 'like', 'dm', 'research', 'bounty', 'other']),
  targetId: z.string().optional().describe('Post ID, user ID, or other target identifier'),
  contentSnippet: z.string().optional().describe('Brief snippet of content (max 200 chars)'),
  signal: z.string().optional().describe('Market signal or insight discovered'),
  metadata: z.record(z.any()).optional().describe('Additional context'),
});

export const activityQuerySchema = z.object({
  platform: z.enum(['moltbook', 'nostr', 'github', 'twitter', 'discord', 'other', 'all']).optional(),
  agentId: z.string().optional(),
  since: z.string().optional().describe('ISO date string - get activity since this time'),
  limit: z.number().optional().default(20),
});

type ActivityLogInput = z.infer<typeof activityLogSchema>;
type ActivityQueryInput = z.infer<typeof activityQuerySchema>;

const activityCollection = () => getDb().collection('activity');

export const activityTools = {
  activity_log: {
    description: 'Log agent activity (posts, comments, research, etc.) for visibility across the ecosystem',
    inputSchema: activityLogSchema,
    handler: async (input: ActivityLogInput) => {
      try {
        const now = new Date();
        const activityRef = activityCollection().doc();

        const activity = {
          id: activityRef.id,
          agentId: input.agentId,
          platform: input.platform,
          action: input.action,
          targetId: input.targetId || null,
          contentSnippet: input.contentSnippet?.slice(0, 200) || null,
          signal: input.signal || null,
          metadata: input.metadata || {},
          timestamp: Timestamp.fromDate(now),
          createdAt: Timestamp.fromDate(now),
        };

        await activityRef.set(activity);

        return {
          success: true,
          activityId: activityRef.id,
          message: `Activity logged: ${input.action} on ${input.platform}`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to log activity',
        };
      }
    },
  },

  activity_query: {
    description: 'Query recent agent activity across platforms',
    inputSchema: activityQuerySchema,
    handler: async (input: ActivityQueryInput) => {
      try {
        let query: FirebaseFirestore.Query = activityCollection()
          .orderBy('timestamp', 'desc')
          .limit(input.limit || 20);

        if (input.platform && input.platform !== 'all') {
          query = query.where('platform', '==', input.platform);
        }

        if (input.agentId) {
          query = query.where('agentId', '==', input.agentId);
        }

        if (input.since) {
          const sinceDate = new Date(input.since);
          query = query.where('timestamp', '>=', Timestamp.fromDate(sinceDate));
        }

        const snapshot = await query.get();
        const activities = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            agentId: data.agentId,
            platform: data.platform,
            action: data.action,
            targetId: data.targetId,
            contentSnippet: data.contentSnippet,
            signal: data.signal,
            timestamp: data.timestamp?.toDate()?.toISOString(),
          };
        });

        return {
          success: true,
          count: activities.length,
          activities,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to query activity',
        };
      }
    },
  },

  activity_summary: {
    description: 'Get a summary of recent activity across all agents',
    inputSchema: z.object({
      hours: z.number().optional().default(24).describe('Hours to look back'),
    }),
    handler: async (input: { hours?: number }) => {
      try {
        const hours = input.hours || 24;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const snapshot = await activityCollection()
          .where('timestamp', '>=', Timestamp.fromDate(since))
          .get();

        const activities = snapshot.docs.map(doc => doc.data());

        // Aggregate by platform
        const byPlatform: Record<string, number> = {};
        const byAction: Record<string, number> = {};
        const byAgent: Record<string, number> = {};
        const signals: string[] = [];

        for (const a of activities) {
          byPlatform[a.platform] = (byPlatform[a.platform] || 0) + 1;
          byAction[a.action] = (byAction[a.action] || 0) + 1;
          byAgent[a.agentId] = (byAgent[a.agentId] || 0) + 1;
          if (a.signal) signals.push(a.signal);
        }

        return {
          success: true,
          period: `Last ${hours} hours`,
          totalActivities: activities.length,
          byPlatform,
          byAction,
          byAgent,
          recentSignals: signals.slice(0, 10),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get summary',
        };
      }
    },
  },
};
