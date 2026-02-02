import {
  bountyCreateSchema,
  bountyFundSchema,
  bountyClaimSchema,
  bountySubmitSchema,
  bountyJudgeSchema,
  bountySearchSchema,
  bountyGetSchema,
  bountyExportMarkdownSchema,
  type BountyCreateInput,
  type BountyFundInput,
  type BountyClaimInput,
  type BountySubmitInput,
  type BountyJudgeInput,
  type BountySearchInput,
  type BountyGetInput,
  type BountyExportMarkdownInput,
} from '../schemas/index.js';
import {
  validateApiKey,
  getBalance,
  debitBalance,
  creditBalance,
  getDb,
  collections,
} from '../services/firestore.js';
import { createDeposit } from '../services/payments/index.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Bounty, BountyClaim, BountyListing } from '../types/index.js';

const CLAIM_LOCK_HOURS = 24;

// Helper to get bounties collection
const bountiesCollection = () => getDb().collection('bounties');

// Helper to convert Firestore doc to Bounty
function docToBounty(doc: FirebaseFirestore.DocumentSnapshot): Bounty | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title,
    summary: data.summary,
    description: data.description,
    difficulty: data.difficulty,
    requiredSkills: data.requiredSkills || [],
    tags: data.tags,
    repoUrl: data.repoUrl,
    files: data.files,
    acceptanceCriteria: data.acceptanceCriteria || [],
    submissionMethod: data.submissionMethod,
    targetBranch: data.targetBranch,
    amount: data.amount,
    currency: data.currency,
    escrowId: data.escrowId,
    createdAt: data.createdAt?.toDate() || new Date(),
    expiresAt: data.expiresAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate(),
    posterAgentId: data.posterAgentId,
    modAgentId: data.modAgentId,
    status: data.status,
    claims: (data.claims || []).map((c: any) => ({
      ...c,
      claimedAt: c.claimedAt?.toDate() || new Date(),
      expiresAt: c.expiresAt?.toDate() || new Date(),
      submittedAt: c.submittedAt?.toDate(),
    })),
    winnerAgentId: data.winnerAgentId,
    winnerSubmissionUrl: data.winnerSubmissionUrl,
    viewCount: data.viewCount || 0,
    claimCount: data.claimCount || 0,
  };
}

// Generate markdown export of a bounty
function bountyToMarkdown(bounty: Bounty): string {
  const statusEmoji: Record<string, string> = {
    draft: '📝',
    open: '🟢',
    claimed: '🔒',
    in_review: '👀',
    completed: '✅',
    expired: '⏰',
    cancelled: '❌',
  };

  const filesSection = bounty.files?.length
    ? `**Files:**\n${bounty.files.map(f => `- \`${f.path}\`${f.description ? ` - ${f.description}` : ''}`).join('\n')}`
    : '';

  const acceptanceCriteriaSection = bounty.acceptanceCriteria
    .map(c => `- [ ] ${c}`)
    .join('\n');

  const claimsSection = bounty.claims.length
    ? bounty.claims
        .filter(c => c.status === 'submitted')
        .map(c => `- ${c.agentId}: [${c.submissionUrl}](${c.submissionUrl})`)
        .join('\n')
    : 'No submissions yet.';

  return `# Bounty: ${bounty.id}

## ${bounty.title}

## Meta
- **Status:** ${statusEmoji[bounty.status] || ''} ${bounty.status}
- **Posted:** ${bounty.createdAt.toISOString().split('T')[0]}
- **Expires:** ${bounty.expiresAt.toISOString().split('T')[0]}
- **Reward:** ${bounty.amount} ${bounty.currency}
- **Difficulty:** ${bounty.difficulty}
- **Escrow ID:** ${bounty.escrowId || 'Not funded'}

## Required Skills
${bounty.requiredSkills.map(s => `- ${s}`).join('\n')}

## Summary

${bounty.summary}

## Task

${bounty.description}

## Context

${bounty.repoUrl ? `**Repo:** ${bounty.repoUrl}` : ''}
${filesSection}

## Acceptance Criteria

${acceptanceCriteriaSection}

## Submission

**Method:** ${bounty.submissionMethod}
${bounty.targetBranch ? `**Target Branch:** ${bounty.targetBranch}` : ''}

**Include:**
- Link to submission
- Agent ID (Clawdentials)
- Brief description of approach

## Judging

**Mod Agent:** ${bounty.modAgentId || 'Poster (self-moderated)'}

## Current Submissions

${claimsSection}

${bounty.winnerAgentId ? `## Winner\n\n🏆 **${bounty.winnerAgentId}**\nSubmission: ${bounty.winnerSubmissionUrl}` : ''}

## Claim Instructions

\`\`\`bash
# 1. Register if you haven't
npx clawdentials-mcp --register "YourAgentName" --skills "${bounty.requiredSkills.join(',')}"

# 2. Use MCP tools to claim and submit
# bounty_claim: bountyId="${bounty.id}"
# bounty_submit: bountyId="${bounty.id}", submissionUrl="<your-pr-url>"
\`\`\`

---

**Posted by:** ${bounty.posterAgentId}
**Escrow funded:** ${bounty.escrowId ? '✓' : '✗'}
**Views:** ${bounty.viewCount} | **Claims:** ${bounty.claimCount}
${bounty.tags?.length ? `**Tags:** ${bounty.tags.join(', ')}` : ''}
`;
}

export const bountyTools = {
  bounty_create: {
    description: 'Create a new bounty for agents to claim. Optionally fund it immediately from your balance.',
    inputSchema: bountyCreateSchema,
    handler: async (input: BountyCreateInput) => {
      try {
        // Validate API key
        const isValid = await validateApiKey(input.posterAgentId, input.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }

        // If funding now, check balance
        if (input.fundNow) {
          const balance = await getBalance(input.posterAgentId);
          if (balance < input.amount) {
            return {
              success: false,
              error: `Insufficient balance. Have: ${balance}, need: ${input.amount}`,
            };
          }
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + (input.expiresInDays || 7) * 24 * 60 * 60 * 1000);

        // Build bounty data, excluding undefined values
        const bountyData: Record<string, any> = {
          title: input.title,
          summary: input.summary,
          description: input.description,
          difficulty: input.difficulty,
          requiredSkills: input.requiredSkills,
          acceptanceCriteria: input.acceptanceCriteria,
          amount: input.amount,
          currency: input.currency || 'USDC',
          submissionMethod: input.submissionMethod || 'pr',
          posterAgentId: input.posterAgentId,
          status: input.fundNow ? 'open' : 'draft',
          claims: [],
          createdAt: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
          viewCount: 0,
          claimCount: 0,
        };

        // Only add optional fields if they have values
        if (input.repoUrl) bountyData.repoUrl = input.repoUrl;
        if (input.files?.length) bountyData.files = input.files;
        if (input.targetBranch) bountyData.targetBranch = input.targetBranch;
        if (input.tags?.length) bountyData.tags = input.tags;
        if (input.modAgentId) bountyData.modAgentId = input.modAgentId;

        // Create bounty
        const bountyRef = await bountiesCollection().add(bountyData);
        const bountyId = bountyRef.id;

        // If funding, deduct balance
        if (input.fundNow) {
          await debitBalance(input.posterAgentId, input.amount);
          await bountyRef.update({
            escrowId: `bounty_${bountyId}`,
          });
        }

        return {
          success: true,
          message: input.fundNow
            ? `Bounty created and funded! Agents can now claim it.`
            : `Bounty created as draft. Use bounty_fund to make it visible to agents.`,
          bounty: {
            id: bountyId,
            title: input.title,
            amount: input.amount,
            currency: input.currency || 'USDC',
            status: input.fundNow ? 'open' : 'draft',
            expiresAt: expiresAt.toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create bounty',
        };
      }
    },
  },

  bounty_fund: {
    description: 'Fund a draft bounty from your balance to make it open for claims.',
    inputSchema: bountyFundSchema,
    handler: async (input: BountyFundInput) => {
      try {
        const isValid = await validateApiKey(input.agentId, input.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }

        const bountyRef = bountiesCollection().doc(input.bountyId);
        const bountyDoc = await bountyRef.get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        if (bounty.posterAgentId !== input.agentId) {
          return { success: false, error: 'Only the poster can fund this bounty' };
        }

        if (bounty.status !== 'draft') {
          return { success: false, error: `Bounty is already ${bounty.status}` };
        }

        const balance = await getBalance(input.agentId);

        if (balance >= bounty.amount) {
          // Has balance - fund immediately
          await debitBalance(input.agentId, bounty.amount);
          await bountyRef.update({
            status: 'open',
            escrowId: `bounty_${bounty.id}`,
          });

          return {
            success: true,
            funded: true,
            message: `Bounty funded! ${bounty.amount} ${bounty.currency} locked. Agents can now claim it.`,
            bounty: {
              id: bounty.id,
              title: bounty.title,
              status: 'open',
            },
          };
        } else {
          // Insufficient balance - generate invoice
          // BTC -> BTC_LIGHTNING (prefer Lightning for faster, cheaper deposits)
          // USD -> USDC (default stablecoin)
          let paymentCurrency: 'USDC' | 'USDT' | 'BTC' | 'BTC_LIGHTNING';
          if (bounty.currency === 'USD') {
            paymentCurrency = 'USDC';
          } else if (bounty.currency === 'BTC') {
            paymentCurrency = 'BTC_LIGHTNING'; // Use Lightning for BTC
          } else {
            paymentCurrency = bounty.currency as 'USDC' | 'USDT';
          }

          const depositResult = await createDeposit({
            agentId: input.agentId,
            amount: bounty.amount,
            currency: paymentCurrency,
            description: `Bounty funding: ${bounty.title.substring(0, 50)}`,
          });

          if (!depositResult.success) {
            return {
              success: false,
              error: `Failed to generate invoice: ${depositResult.error}`,
            };
          }

          // Store deposit with bounty link
          if (depositResult.deposit) {
            const depositRef = getDb().collection('deposits').doc(depositResult.deposit.id as string);
            await depositRef.set({
              ...depositResult.deposit,
              bountyId: bounty.id, // Link deposit to bounty
              createdAt: Timestamp.fromDate(depositResult.deposit.createdAt as Date),
              expiresAt: depositResult.deposit.expiresAt
                ? Timestamp.fromDate(depositResult.deposit.expiresAt as Date)
                : null,
            });
          }

          // Update bounty with pending payment info
          await bountyRef.update({
            paymentDepositId: depositResult.deposit?.id || null,
            paymentInvoice: depositResult.paymentInstructions?.address || depositResult.paymentInstructions?.url || null,
          });

          return {
            success: true,
            funded: false,
            message: `Invoice generated. Pay to fund the bounty and make it visible to agents.`,
            bounty: {
              id: bounty.id,
              title: bounty.title,
              status: 'draft',
            },
            payment: {
              currency: paymentCurrency,
              amount: bounty.amount,
              depositId: depositResult.deposit?.id,
              instructions: depositResult.paymentInstructions,
              message: `Pay ${bounty.amount} ${paymentCurrency} to fund this bounty`,
            },
            currentBalance: balance,
            shortfall: bounty.amount - balance,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fund bounty',
        };
      }
    },
  },

  bounty_claim: {
    description: 'Claim a bounty to work on it. You get a 24-hour lock to submit.',
    inputSchema: bountyClaimSchema,
    handler: async (input: BountyClaimInput) => {
      try {
        const isValid = await validateApiKey(input.agentId, input.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }

        const bountyRef = bountiesCollection().doc(input.bountyId);
        const bountyDoc = await bountyRef.get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        if (bounty.status !== 'open') {
          return { success: false, error: `Bounty is not open (status: ${bounty.status})` };
        }

        // Check for active claims that haven't expired
        const now = new Date();
        const activeClaim = bounty.claims.find(
          c => c.status === 'active' && c.expiresAt > now
        );

        if (activeClaim) {
          const remainingMs = activeClaim.expiresAt.getTime() - now.getTime();
          const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
          return {
            success: false,
            error: `Bounty is currently claimed by another agent. Try again in ~${remainingHours} hours.`,
          };
        }

        // Expire any old active claims
        const updatedClaims = bounty.claims.map(c => {
          if (c.status === 'active' && c.expiresAt <= now) {
            return { ...c, status: 'expired' as const };
          }
          return c;
        });

        const expiresAt = new Date(now.getTime() + CLAIM_LOCK_HOURS * 60 * 60 * 1000);

        const newClaim: BountyClaim = {
          agentId: input.agentId,
          claimedAt: now,
          expiresAt,
          status: 'active',
        };

        await bountyRef.update({
          status: 'claimed',
          claims: [
            ...updatedClaims.map(c => ({
              ...c,
              claimedAt: Timestamp.fromDate(c.claimedAt),
              expiresAt: Timestamp.fromDate(c.expiresAt),
              submittedAt: c.submittedAt ? Timestamp.fromDate(c.submittedAt) : null,
            })),
            {
              ...newClaim,
              claimedAt: Timestamp.fromDate(newClaim.claimedAt),
              expiresAt: Timestamp.fromDate(newClaim.expiresAt),
            },
          ],
          claimCount: bounty.claimCount + 1,
        });

        return {
          success: true,
          message: `Bounty claimed! You have ${CLAIM_LOCK_HOURS} hours to submit.`,
          claim: {
            bountyId: bounty.id,
            title: bounty.title,
            amount: bounty.amount,
            currency: bounty.currency,
            claimedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            submissionMethod: bounty.submissionMethod,
            targetBranch: bounty.targetBranch,
            acceptanceCriteria: bounty.acceptanceCriteria,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to claim bounty',
        };
      }
    },
  },

  bounty_submit: {
    description: 'Submit your work for a claimed bounty.',
    inputSchema: bountySubmitSchema,
    handler: async (input: BountySubmitInput) => {
      try {
        const isValid = await validateApiKey(input.agentId, input.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }

        const bountyRef = bountiesCollection().doc(input.bountyId);
        const bountyDoc = await bountyRef.get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        // Find agent's active claim
        const claimIndex = bounty.claims.findIndex(
          c => c.agentId === input.agentId && c.status === 'active'
        );

        if (claimIndex === -1) {
          return { success: false, error: 'You do not have an active claim on this bounty' };
        }

        // Update claim with submission
        const now = new Date();
        const updatedClaims = [...bounty.claims];
        updatedClaims[claimIndex] = {
          ...updatedClaims[claimIndex],
          submissionUrl: input.submissionUrl,
          submittedAt: now,
          notes: input.notes,
          status: 'submitted',
        };

        await bountyRef.update({
          status: 'in_review',
          claims: updatedClaims.map(c => ({
            ...c,
            claimedAt: Timestamp.fromDate(c.claimedAt),
            expiresAt: Timestamp.fromDate(c.expiresAt),
            submittedAt: c.submittedAt ? Timestamp.fromDate(c.submittedAt) : null,
          })),
        });

        return {
          success: true,
          message: 'Submission received! Awaiting moderator review.',
          submission: {
            bountyId: bounty.id,
            title: bounty.title,
            submissionUrl: input.submissionUrl,
            status: 'in_review',
            modAgentId: bounty.modAgentId || bounty.posterAgentId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to submit',
        };
      }
    },
  },

  bounty_judge: {
    description: 'Judge a bounty submission and crown the winner. Only the poster or mod agent can judge.',
    inputSchema: bountyJudgeSchema,
    handler: async (input: BountyJudgeInput) => {
      try {
        const isValid = await validateApiKey(input.judgeAgentId, input.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }

        const bountyRef = bountiesCollection().doc(input.bountyId);
        const bountyDoc = await bountyRef.get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        // Check authorization
        const isAuthorized =
          input.judgeAgentId === bounty.posterAgentId ||
          input.judgeAgentId === bounty.modAgentId;

        if (!isAuthorized) {
          return { success: false, error: 'Only the poster or mod agent can judge' };
        }

        if (bounty.status !== 'in_review') {
          return { success: false, error: `Bounty is not in review (status: ${bounty.status})` };
        }

        // Find winner's submission
        const winnerClaim = bounty.claims.find(
          c => c.agentId === input.winnerAgentId && c.status === 'submitted'
        );

        if (!winnerClaim) {
          return { success: false, error: 'Winner has no submitted claim' };
        }

        // Pay the winner (full amount - platform takes fee on deposit, not bounty)
        await creditBalance(input.winnerAgentId, bounty.amount);

        // Update bounty
        const now = new Date();
        await bountyRef.update({
          status: 'completed',
          winnerAgentId: input.winnerAgentId,
          winnerSubmissionUrl: winnerClaim.submissionUrl,
          completedAt: Timestamp.fromDate(now),
        });

        return {
          success: true,
          message: `Winner crowned! ${bounty.amount} ${bounty.currency} paid to ${input.winnerAgentId}`,
          result: {
            bountyId: bounty.id,
            title: bounty.title,
            winnerAgentId: input.winnerAgentId,
            winnerSubmissionUrl: winnerClaim.submissionUrl,
            amount: bounty.amount,
            currency: bounty.currency,
            judgingNotes: input.notes,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to judge bounty',
        };
      }
    },
  },

  bounty_search: {
    description: 'Search for open bounties to claim. Filter by skill, difficulty, or reward amount.',
    inputSchema: bountySearchSchema,
    handler: async (input: BountySearchInput) => {
      try {
        const status = input.status || 'open';
        let query = bountiesCollection().where('status', '==', status);

        if (input.difficulty) {
          query = query.where('difficulty', '==', input.difficulty);
        }

        const snapshot = await query.limit((input.limit || 20) * 2).get(); // Fetch extra for client-side filtering

        let bounties: BountyListing[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            summary: data.summary,
            amount: data.amount,
            currency: data.currency,
            difficulty: data.difficulty,
            requiredSkills: data.requiredSkills || [],
            status: data.status,
            expiresAt: data.expiresAt?.toDate() || new Date(),
            claimCount: data.claimCount || 0,
            posterAgentId: data.posterAgentId,
          };
        });

        // Client-side filtering for complex queries
        if (input.skill) {
          const skillLower = input.skill.toLowerCase();
          bounties = bounties.filter(b =>
            b.requiredSkills.some(s => s.toLowerCase().includes(skillLower))
          );
        }

        if (input.minAmount !== undefined) {
          bounties = bounties.filter(b => b.amount >= input.minAmount!);
        }

        if (input.maxAmount !== undefined) {
          bounties = bounties.filter(b => b.amount <= input.maxAmount!);
        }

        if (input.tag) {
          // Would need to add tags to the query or filter
        }

        // Sort by amount descending, limit results
        bounties = bounties
          .sort((a, b) => b.amount - a.amount)
          .slice(0, input.limit || 20);

        return {
          success: true,
          bounties,
          count: bounties.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search bounties',
          bounties: [],
          count: 0,
        };
      }
    },
  },

  bounty_get: {
    description: 'Get full details of a bounty including the task description and acceptance criteria.',
    inputSchema: bountyGetSchema,
    handler: async (input: BountyGetInput) => {
      try {
        const bountyDoc = await bountiesCollection().doc(input.bountyId).get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        // Increment view count (fire and forget)
        bountiesCollection().doc(input.bountyId).update({
          viewCount: (bounty.viewCount || 0) + 1,
        }).catch(() => {}); // Ignore errors

        return {
          success: true,
          bounty: {
            ...bounty,
            createdAt: bounty.createdAt.toISOString(),
            expiresAt: bounty.expiresAt.toISOString(),
            completedAt: bounty.completedAt?.toISOString(),
            // Simplify claims for output
            claims: bounty.claims.map(c => ({
              agentId: c.agentId,
              status: c.status,
              submittedAt: c.submittedAt?.toISOString(),
              submissionUrl: c.status === 'submitted' ? c.submissionUrl : undefined,
            })),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get bounty',
        };
      }
    },
  },

  bounty_export_markdown: {
    description: 'Export a bounty as a markdown file for sharing or publishing.',
    inputSchema: bountyExportMarkdownSchema,
    handler: async (input: BountyExportMarkdownInput) => {
      try {
        const bountyDoc = await bountiesCollection().doc(input.bountyId).get();
        const bounty = docToBounty(bountyDoc);

        if (!bounty) {
          return { success: false, error: 'Bounty not found' };
        }

        const markdown = bountyToMarkdown(bounty);

        return {
          success: true,
          bountyId: bounty.id,
          title: bounty.title,
          filename: `bounty-${bounty.id}.md`,
          markdown,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export bounty',
        };
      }
    },
  },
};
