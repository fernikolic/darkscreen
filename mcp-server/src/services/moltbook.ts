/**
 * Moltbook Identity Verification Service
 *
 * Verifies Moltbook identity tokens and retrieves agent profiles.
 * See: https://www.moltbook.com/developers
 */

const MOLTBOOK_API_BASE = 'https://www.moltbook.com/api/v1';

// App key for verifying identity tokens (set via environment)
const MOLTBOOK_APP_KEY = process.env.MOLTBOOK_APP_KEY || '';

export interface MoltbookProfile {
  id: string;
  name: string;
  description: string | null;
  karma: number;
  avatar_url: string | null;
  claimed: boolean;
  created_at: string;
  follower_count: number;
  post_count: number;
  comment_count: number;
  owner_x_handle: string | null;
}

export interface MoltbookVerifyResponse {
  success: boolean;
  agent?: MoltbookProfile;
  error?: string;
}

/**
 * Verify a Moltbook identity token and retrieve the agent's profile.
 *
 * @param identityToken - The JWT identity token from the agent
 * @returns The verified agent profile or an error
 */
export async function verifyMoltbookIdentity(identityToken: string): Promise<MoltbookVerifyResponse> {
  if (!MOLTBOOK_APP_KEY) {
    return {
      success: false,
      error: 'Moltbook integration not configured (missing MOLTBOOK_APP_KEY)',
    };
  }

  try {
    const response = await fetch(`${MOLTBOOK_API_BASE}/agents/verify-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Moltbook-App-Key': MOLTBOOK_APP_KEY,
      },
      body: JSON.stringify({ token: identityToken }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid or expired Moltbook identity token',
        };
      }
      return {
        success: false,
        error: `Moltbook verification failed: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      agent: {
        id: data.id,
        name: data.name,
        description: data.description,
        karma: data.karma || 0,
        avatar_url: data.avatar_url,
        claimed: data.claimed || false,
        created_at: data.created_at,
        follower_count: data.follower_count || 0,
        post_count: data.post_count || 0,
        comment_count: data.comment_count || 0,
        owner_x_handle: data.owner_x_handle,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify Moltbook identity',
    };
  }
}

/**
 * Convert Moltbook karma to an initial Clawdentials reputation boost.
 *
 * Karma on Moltbook is unbounded, so we use a log scale to convert
 * to a reasonable starting boost (0-20 points on the reputation score).
 *
 * @param karma - The agent's Moltbook karma
 * @returns Initial reputation boost (0-20)
 */
export function karmaToReputationBoost(karma: number): number {
  if (karma <= 0) return 0;
  // Log scale: 1 karma = 0, 10 karma = ~7, 100 karma = ~14, 1000 karma = ~20
  const boost = Math.log10(karma + 1) * 7;
  return Math.min(20, Math.round(boost * 10) / 10);
}

/**
 * Check if Moltbook integration is configured.
 */
export function isMoltbookConfigured(): boolean {
  return !!MOLTBOOK_APP_KEY;
}
