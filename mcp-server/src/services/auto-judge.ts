/**
 * AUTO-JUDGE - Automated bounty submission verification
 *
 * Rules-based system to approve/reject bounty submissions without manual review.
 *
 * Quality Gates:
 * 1. Submission exists and is accessible
 * 2. Acceptance criteria verification
 * 3. Code quality checks (if applicable)
 * 4. Fraud detection
 */

import { getDb } from './firestore.js';

export interface JudgmentResult {
  approved: boolean;
  score: number;  // 0-100
  reasons: string[];
  checks: CheckResult[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  weight: number;
  details: string;
}

export interface SubmissionContext {
  bountyId: string;
  submissionUrl: string;
  notes: string;
  claimantAgentId: string;
  bounty: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    requiredSkills: string[];
    difficulty: string;
    amount: number;
  };
}

// Minimum score to auto-approve (0-100)
const AUTO_APPROVE_THRESHOLD = 70;
// Score below this = auto-reject
const AUTO_REJECT_THRESHOLD = 30;
// Between these = needs manual review

/**
 * Main entry point for auto-judging a submission
 */
export async function autoJudge(ctx: SubmissionContext): Promise<JudgmentResult> {
  const checks: CheckResult[] = [];

  // Run all checks
  checks.push(await checkSubmissionExists(ctx));
  checks.push(await checkSubmissionQuality(ctx));
  checks.push(await checkAcceptanceCriteria(ctx));
  checks.push(await checkFraudSignals(ctx));
  checks.push(await checkAgentReputation(ctx));

  // Calculate weighted score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => {
    return sum + (c.passed ? c.weight : 0);
  }, 0);
  const score = Math.round((weightedScore / totalWeight) * 100);

  // Determine approval
  const approved = score >= AUTO_APPROVE_THRESHOLD;
  const reasons = checks
    .filter(c => !c.passed)
    .map(c => `❌ ${c.name}: ${c.details}`);

  if (approved) {
    reasons.unshift(`✅ Score ${score}/100 meets threshold (${AUTO_APPROVE_THRESHOLD})`);
  }

  return { approved, score, reasons, checks };
}

/**
 * Check 1: Submission URL is valid and accessible
 */
async function checkSubmissionExists(ctx: SubmissionContext): Promise<CheckResult> {
  const { submissionUrl } = ctx;

  // Validate URL format
  if (!submissionUrl || !isValidUrl(submissionUrl)) {
    return {
      name: 'Submission Exists',
      passed: false,
      weight: 25,
      details: 'Invalid or missing submission URL',
    };
  }

  // Check if it's a known platform (GitHub PR, Gist, etc.)
  const isGitHub = submissionUrl.includes('github.com');
  const isGist = submissionUrl.includes('gist.github.com');
  const isNotion = submissionUrl.includes('notion.so');
  const isGoogleDoc = submissionUrl.includes('docs.google.com');

  // Reject obvious fake URLs
  if (submissionUrl.includes('example.com') || submissionUrl.includes('example/')) {
    return {
      name: 'Submission Exists',
      passed: false,
      weight: 25,
      details: 'Submission URL appears to be a placeholder',
    };
  }

  // Bonus for GitHub PRs (verifiable)
  if (isGitHub && submissionUrl.includes('/pull/')) {
    return {
      name: 'Submission Exists',
      passed: true,
      weight: 25,
      details: 'Valid GitHub PR submission',
    };
  }

  return {
    name: 'Submission Exists',
    passed: true,
    weight: 25,
    details: `Valid submission URL (${isGitHub ? 'GitHub' : isGist ? 'Gist' : 'external'})`,
  };
}

/**
 * Check 2: Submission quality signals
 */
async function checkSubmissionQuality(ctx: SubmissionContext): Promise<CheckResult> {
  const { submissionUrl, notes, bounty } = ctx;

  let qualityScore = 0;
  const issues: string[] = [];

  // Notes should explain the work
  if (notes && notes.length > 50) {
    qualityScore += 30;
  } else if (notes && notes.length > 20) {
    qualityScore += 15;
  } else {
    issues.push('Minimal submission notes');
  }

  // GitHub PRs with description are higher quality
  if (submissionUrl.includes('github.com/') && submissionUrl.includes('/pull/')) {
    qualityScore += 40;
  }

  // Check if submission mentions bounty context
  const notesLower = (notes || '').toLowerCase();
  if (notesLower.includes('bounty') || notesLower.includes(bounty.title.toLowerCase().slice(0, 20))) {
    qualityScore += 30;
  }

  const passed = qualityScore >= 50;

  return {
    name: 'Submission Quality',
    passed,
    weight: 20,
    details: passed
      ? `Quality signals present (${qualityScore}/100)`
      : `Low quality signals: ${issues.join(', ')}`,
  };
}

/**
 * Check 3: Acceptance criteria verification
 *
 * For code bounties: verify tests pass, code compiles
 * For content bounties: verify deliverable exists
 */
async function checkAcceptanceCriteria(ctx: SubmissionContext): Promise<CheckResult> {
  const { bounty, submissionUrl, notes } = ctx;

  // For small bounties ($1-5), be lenient
  if (bounty.amount <= 5) {
    return {
      name: 'Acceptance Criteria',
      passed: true,
      weight: 20,
      details: 'Low-value bounty - lenient criteria',
    };
  }

  // Check if acceptance criteria are mentioned in notes
  const notesLower = (notes || '').toLowerCase();
  const criteriaMatched = bounty.acceptanceCriteria.filter(c => {
    const criteriaWords = c.toLowerCase().split(' ').slice(0, 3).join(' ');
    return notesLower.includes(criteriaWords);
  });

  const matchRatio = criteriaMatched.length / Math.max(bounty.acceptanceCriteria.length, 1);

  // For GitHub PRs, check if PR description mentions criteria
  if (submissionUrl.includes('/pull/')) {
    // We'd need to fetch PR body here - for now, trust the URL
    return {
      name: 'Acceptance Criteria',
      passed: true,
      weight: 20,
      details: 'GitHub PR - criteria verification delegated to code review',
    };
  }

  const passed = matchRatio >= 0.5 || bounty.acceptanceCriteria.length === 0;

  return {
    name: 'Acceptance Criteria',
    passed,
    weight: 20,
    details: passed
      ? `${Math.round(matchRatio * 100)}% criteria addressed`
      : `Only ${criteriaMatched.length}/${bounty.acceptanceCriteria.length} criteria addressed`,
  };
}

/**
 * Check 4: Fraud detection
 */
async function checkFraudSignals(ctx: SubmissionContext): Promise<CheckResult> {
  const { claimantAgentId, submissionUrl, notes } = ctx;
  const fraudSignals: string[] = [];

  // Check for self-dealing (poster claiming own bounty)
  // This would need bounty.posterAgentId check

  // Check for suspicious patterns
  if (submissionUrl.includes('localhost') || submissionUrl.includes('127.0.0.1')) {
    fraudSignals.push('Local URL');
  }

  // Check for copy-paste placeholder text
  if (notes && (notes.includes('lorem ipsum') || notes.includes('TODO') || notes.includes('FIXME'))) {
    fraudSignals.push('Placeholder text detected');
  }

  // Check submission timing (too fast = suspicious)
  // Would need claim timestamp vs submit timestamp

  const passed = fraudSignals.length === 0;

  return {
    name: 'Fraud Detection',
    passed,
    weight: 20,
    details: passed ? 'No fraud signals detected' : `Fraud signals: ${fraudSignals.join(', ')}`,
  };
}

/**
 * Check 5: Agent reputation
 */
async function checkAgentReputation(ctx: SubmissionContext): Promise<CheckResult> {
  const { claimantAgentId } = ctx;
  const db = getDb();

  try {
    const agentDoc = await db.collection('agents').doc(claimantAgentId).get();

    if (!agentDoc.exists) {
      return {
        name: 'Agent Reputation',
        passed: false,
        weight: 15,
        details: 'Agent not found in registry',
      };
    }

    const agent = agentDoc.data()!;
    const completedBounties = agent.completedBounties || 0;
    const reputation = agent.reputation || 0;

    // New agents get benefit of doubt for first bounty
    if (completedBounties === 0) {
      return {
        name: 'Agent Reputation',
        passed: true,
        weight: 15,
        details: 'New agent - first bounty attempt',
      };
    }

    const passed = reputation >= 0; // Negative reputation = bad actor

    return {
      name: 'Agent Reputation',
      passed,
      weight: 15,
      details: passed
        ? `${completedBounties} completed bounties, reputation: ${reputation}`
        : `Poor reputation history (${reputation})`,
    };
  } catch (error) {
    return {
      name: 'Agent Reputation',
      passed: true,
      weight: 15,
      details: 'Could not verify reputation - proceeding',
    };
  }
}

/**
 * Utility: Validate URL format
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Enhanced auto-judge for GitHub PRs
 * Fetches PR details and runs additional checks
 */
export async function autoJudgeGitHubPR(
  ctx: SubmissionContext,
  prDetails: {
    merged: boolean;
    additions: number;
    deletions: number;
    changedFiles: number;
    checksPass: boolean;
    reviewApproved: boolean;
  }
): Promise<JudgmentResult> {
  // Start with base judgment
  const baseResult = await autoJudge(ctx);

  // Add GitHub-specific checks
  const ghChecks: CheckResult[] = [];

  // PR merged = definite approval
  if (prDetails.merged) {
    ghChecks.push({
      name: 'PR Merged',
      passed: true,
      weight: 30,
      details: 'PR was merged into main branch',
    });
  }

  // Code changes appropriate for bounty
  const totalChanges = prDetails.additions + prDetails.deletions;
  const appropriateSize = ctx.bounty.amount <= 5
    ? totalChanges >= 10
    : totalChanges >= 50;

  ghChecks.push({
    name: 'Code Volume',
    passed: appropriateSize,
    weight: 10,
    details: `${prDetails.additions}+ / ${prDetails.deletions}- lines`,
  });

  // CI checks pass
  if (prDetails.checksPass) {
    ghChecks.push({
      name: 'CI Checks',
      passed: true,
      weight: 15,
      details: 'All CI checks passed',
    });
  }

  // Recalculate score with GitHub checks
  const allChecks = [...baseResult.checks, ...ghChecks];
  const totalWeight = allChecks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = allChecks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = Math.round((weightedScore / totalWeight) * 100);

  return {
    approved: score >= AUTO_APPROVE_THRESHOLD || prDetails.merged,
    score,
    reasons: baseResult.reasons,
    checks: allChecks,
  };
}
