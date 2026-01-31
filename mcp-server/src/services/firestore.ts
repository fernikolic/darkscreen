import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { createHash, randomBytes } from 'crypto';
import type { Escrow, Agent, Task, AgentStats, Withdrawal } from '../types/index.js';

// Platform fee rate (10%)
export const FEE_RATE = 0.10;

// Admin secret (in production, use environment variable)
export const ADMIN_SECRET = process.env.CLAWDENTIALS_ADMIN_SECRET || 'clawdentials-admin-secret-change-me';

// API Key utilities
export function generateApiKey(): string {
  return `clw_${randomBytes(24).toString('hex')}`;
}

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

let app: App;
let db: Firestore;

export function initFirestore(): Firestore {
  if (getApps().length === 0) {
    // Use Application Default Credentials (gcloud auth)
    // This works with: gcloud auth application-default login
    // Or with GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key
    app = initializeApp({
      credential: applicationDefault(),
      projectId: 'clawdentials',
    });
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  return db;
}

export function getDb(): Firestore {
  if (!db) {
    return initFirestore();
  }
  return db;
}

// Collection references
export const collections = {
  escrows: () => getDb().collection('escrows'),
  agents: () => getDb().collection('agents'),
  tasks: () => getDb().collection('tasks'),
  subscriptions: () => getDb().collection('subscriptions'),
  withdrawals: () => getDb().collection('withdrawals'),
};

// Escrow operations
export async function createEscrow(data: Omit<Escrow, 'id' | 'createdAt' | 'completedAt' | 'proofOfWork' | 'fee' | 'feeRate' | 'disputeReason'>): Promise<Escrow> {
  const docRef = collections.escrows().doc();
  const fee = data.amount * FEE_RATE;

  const escrow: Omit<Escrow, 'id'> = {
    ...data,
    fee,
    feeRate: FEE_RATE,
    status: 'pending',
    createdAt: new Date(),
    completedAt: null,
    proofOfWork: null,
    disputeReason: null,
  };

  await docRef.set({
    ...escrow,
    createdAt: Timestamp.fromDate(escrow.createdAt),
  });

  return { id: docRef.id, ...escrow };
}

export async function getEscrow(escrowId: string): Promise<Escrow | null> {
  const doc = await collections.escrows().doc(escrowId).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    clientAgentId: data.clientAgentId,
    providerAgentId: data.providerAgentId,
    taskDescription: data.taskDescription,
    amount: data.amount,
    fee: data.fee ?? 0,
    feeRate: data.feeRate ?? FEE_RATE,
    currency: data.currency,
    status: data.status,
    createdAt: data.createdAt.toDate(),
    completedAt: data.completedAt?.toDate() ?? null,
    proofOfWork: data.proofOfWork ?? null,
    disputeReason: data.disputeReason ?? null,
  };
}

export async function completeEscrow(escrowId: string, proofOfWork: string): Promise<Escrow | null> {
  const escrowRef = collections.escrows().doc(escrowId);
  const doc = await escrowRef.get();

  if (!doc.exists) {
    return null;
  }

  const completedAt = new Date();
  await escrowRef.update({
    status: 'completed',
    completedAt: Timestamp.fromDate(completedAt),
    proofOfWork,
  });

  const escrow = await getEscrow(escrowId);

  // Update agent stats
  if (escrow) {
    await updateAgentStats(escrow.providerAgentId, escrow.amount);
  }

  return escrow;
}

// Default stats for new agents
function defaultAgentStats(): AgentStats {
  return {
    tasksCompleted: 0,
    totalEarned: 0,
    successRate: 100,
    avgCompletionTime: 0,
    disputeCount: 0,
    disputeRate: 0,
  };
}

// Agent operations
export async function createAgent(data: Omit<Agent, 'id' | 'createdAt' | 'stats' | 'apiKeyHash' | 'balance'>): Promise<{ agent: Agent; apiKey: string }> {
  const docRef = collections.agents().doc(data.name); // Use name as ID for simplicity
  const existingDoc = await docRef.get();

  if (existingDoc.exists) {
    throw new Error(`Agent with name "${data.name}" already exists`);
  }

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const agent: Omit<Agent, 'id'> = {
    ...data,
    createdAt: new Date(),
    stats: defaultAgentStats(),
    apiKeyHash,
    balance: 0,
  };

  await docRef.set({
    ...agent,
    createdAt: Timestamp.fromDate(agent.createdAt),
  });

  return { agent: { id: docRef.id, ...agent }, apiKey };
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  const doc = await collections.agents().doc(agentId).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    skills: data.skills || [],
    createdAt: data.createdAt.toDate(),
    verified: data.verified || false,
    subscriptionTier: data.subscriptionTier || 'free',
    stats: {
      tasksCompleted: data.stats?.tasksCompleted || 0,
      totalEarned: data.stats?.totalEarned || 0,
      successRate: data.stats?.successRate || 100,
      avgCompletionTime: data.stats?.avgCompletionTime || 0,
      disputeCount: data.stats?.disputeCount || 0,
      disputeRate: data.stats?.disputeRate || 0,
    },
    apiKeyHash: data.apiKeyHash || '',
    balance: data.balance || 0,
  };
}

// Validate API key for an agent
export async function validateApiKey(agentId: string, apiKey: string): Promise<boolean> {
  const agent = await getAgent(agentId);
  if (!agent || !agent.apiKeyHash) {
    return false;
  }
  return agent.apiKeyHash === hashApiKey(apiKey);
}

export async function getOrCreateAgent(agentId: string): Promise<Agent> {
  const existing = await getAgent(agentId);
  if (existing) {
    return existing;
  }

  // Auto-create minimal agent record for tracking
  const { agent } = await createAgent({
    name: agentId,
    description: 'Auto-registered agent',
    skills: [],
    verified: false,
    subscriptionTier: 'free',
  });
  return agent;
}

export async function searchAgents(query: {
  skill?: string;
  verified?: boolean;
  minTasksCompleted?: number;
  limit?: number;
}): Promise<Agent[]> {
  let ref = collections.agents().limit(query.limit || 20);

  if (query.verified !== undefined) {
    ref = ref.where('verified', '==', query.verified);
  }

  if (query.minTasksCompleted !== undefined) {
    ref = ref.where('stats.tasksCompleted', '>=', query.minTasksCompleted);
  }

  const snapshot = await ref.get();
  const agents: Agent[] = [];

  for (const doc of snapshot.docs) {
    const agent = await getAgent(doc.id);
    if (agent) {
      // Filter by skill in memory (Firestore array-contains limitation)
      if (query.skill && !agent.skills.some(s => s.toLowerCase().includes(query.skill!.toLowerCase()))) {
        continue;
      }
      agents.push(agent);
    }
  }

  return agents;
}

async function updateAgentStats(agentId: string, amount: number): Promise<void> {
  // Ensure agent exists (auto-create if needed)
  await getOrCreateAgent(agentId);

  const agentRef = collections.agents().doc(agentId);
  const doc = await agentRef.get();
  const data = doc.data()!;
  const currentStats = data.stats || defaultAgentStats();

  const newTasksCompleted = currentStats.tasksCompleted + 1;
  const newTotalEarned = currentStats.totalEarned + amount;

  await agentRef.update({
    'stats.tasksCompleted': newTasksCompleted,
    'stats.totalEarned': newTotalEarned,
    // Recalculate dispute rate
    'stats.disputeRate': currentStats.disputeCount / newTasksCompleted * 100,
  });
}

export async function incrementAgentDisputes(agentId: string): Promise<void> {
  await getOrCreateAgent(agentId);

  const agentRef = collections.agents().doc(agentId);
  const doc = await agentRef.get();
  const data = doc.data()!;
  const currentStats = data.stats || defaultAgentStats();

  const newDisputeCount = currentStats.disputeCount + 1;
  const totalTasks = currentStats.tasksCompleted || 1;

  await agentRef.update({
    'stats.disputeCount': newDisputeCount,
    'stats.disputeRate': (newDisputeCount / totalTasks) * 100,
  });
}

export async function disputeEscrow(escrowId: string, reason: string): Promise<Escrow | null> {
  const escrowRef = collections.escrows().doc(escrowId);
  const doc = await escrowRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;

  // Can only dispute pending or in_progress escrows
  if (data.status === 'completed' || data.status === 'cancelled') {
    throw new Error(`Cannot dispute escrow with status: ${data.status}`);
  }

  await escrowRef.update({
    status: 'disputed',
    disputeReason: reason,
  });

  // Increment dispute count for the provider agent
  await incrementAgentDisputes(data.providerAgentId);

  return getEscrow(escrowId);
}

// Reputation scoring algorithm (from ARCHITECTURE.md)
// score = (
//   (tasks_completed * 2) +
//   (success_rate * 30) +
//   (log(total_earned + 1) * 10) +
//   (speed_bonus * 10) +
//   (account_age_days * 0.1)
// ) / max_possible * 100
export function calculateReputationScore(agent: Agent): number {
  const stats = agent.stats;
  const accountAgeDays = Math.floor((Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate success rate (accounting for disputes)
  const effectiveSuccessRate = stats.tasksCompleted > 0
    ? ((stats.tasksCompleted - stats.disputeCount) / stats.tasksCompleted) * 100
    : 100;

  // Speed bonus (placeholder - would need actual timing data)
  const speedBonus = stats.avgCompletionTime > 0 ? Math.max(0, 10 - stats.avgCompletionTime / 60) : 5;

  // Raw score components
  const taskScore = stats.tasksCompleted * 2;
  const successScore = effectiveSuccessRate * 0.3; // Normalized (max 30)
  const earningsScore = Math.log10(stats.totalEarned + 1) * 10;
  const speedScore = speedBonus;
  const ageScore = accountAgeDays * 0.1;

  // Max possible (for normalization)
  // Assuming max: 10000 tasks, 100% success, $1M earned, max speed, 365 days
  const maxPossible = (10000 * 2) + (100 * 0.3) + (Math.log10(1000001) * 10) + 10 + (365 * 0.1);

  const rawScore = taskScore + successScore + earningsScore + speedScore + ageScore;
  const normalizedScore = (rawScore / maxPossible) * 100;

  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, Math.round(normalizedScore * 10) / 10));
}

// Balance operations
export async function getBalance(agentId: string): Promise<number> {
  const agent = await getAgent(agentId);
  return agent?.balance ?? 0;
}

export async function creditBalance(agentId: string, amount: number, notes?: string): Promise<number> {
  const agentRef = collections.agents().doc(agentId);
  const doc = await agentRef.get();

  if (!doc.exists) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const currentBalance = doc.data()!.balance || 0;
  const newBalance = currentBalance + amount;

  await agentRef.update({ balance: newBalance });

  return newBalance;
}

export async function debitBalance(agentId: string, amount: number): Promise<number> {
  const agentRef = collections.agents().doc(agentId);
  const doc = await agentRef.get();

  if (!doc.exists) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const currentBalance = doc.data()!.balance || 0;

  if (currentBalance < amount) {
    throw new Error(`Insufficient balance: have ${currentBalance}, need ${amount}`);
  }

  const newBalance = currentBalance - amount;
  await agentRef.update({ balance: newBalance });

  return newBalance;
}

// Escrow with balance (new flow)
export async function createEscrowWithBalance(
  data: Omit<Escrow, 'id' | 'createdAt' | 'completedAt' | 'proofOfWork' | 'fee' | 'feeRate' | 'disputeReason'>
): Promise<Escrow> {
  // First, check and debit client balance
  const clientBalance = await getBalance(data.clientAgentId);
  if (clientBalance < data.amount) {
    throw new Error(`Insufficient balance: have ${clientBalance} ${data.currency}, need ${data.amount} ${data.currency}`);
  }

  // Debit the full amount from client
  await debitBalance(data.clientAgentId, data.amount);

  // Create the escrow
  const docRef = collections.escrows().doc();
  const fee = data.amount * FEE_RATE;

  const escrow: Omit<Escrow, 'id'> = {
    ...data,
    fee,
    feeRate: FEE_RATE,
    status: 'pending',
    createdAt: new Date(),
    completedAt: null,
    proofOfWork: null,
    disputeReason: null,
  };

  await docRef.set({
    ...escrow,
    createdAt: Timestamp.fromDate(escrow.createdAt),
  });

  return { id: docRef.id, ...escrow };
}

export async function completeEscrowWithBalance(escrowId: string, proofOfWork: string): Promise<Escrow | null> {
  const escrowRef = collections.escrows().doc(escrowId);
  const doc = await escrowRef.get();

  if (!doc.exists) {
    return null;
  }

  const escrowData = doc.data()!;

  // Credit provider with amount minus fee
  const netAmount = escrowData.amount - (escrowData.fee || escrowData.amount * FEE_RATE);
  await creditBalance(escrowData.providerAgentId, netAmount);

  const completedAt = new Date();
  await escrowRef.update({
    status: 'completed',
    completedAt: Timestamp.fromDate(completedAt),
    proofOfWork,
  });

  const escrow = await getEscrow(escrowId);

  // Update agent stats
  if (escrow) {
    await updateAgentStats(escrow.providerAgentId, netAmount);
  }

  return escrow;
}

export async function refundEscrow(escrowId: string): Promise<Escrow | null> {
  const escrow = await getEscrow(escrowId);
  if (!escrow) {
    return null;
  }

  if (escrow.status !== 'disputed') {
    throw new Error('Can only refund disputed escrows');
  }

  // Refund full amount to client
  await creditBalance(escrow.clientAgentId, escrow.amount);

  // Update escrow status
  const escrowRef = collections.escrows().doc(escrowId);
  await escrowRef.update({ status: 'cancelled' });

  return getEscrow(escrowId);
}

// Withdrawal operations
export async function createWithdrawal(
  agentId: string,
  amount: number,
  currency: 'USD' | 'USDC' | 'BTC',
  paymentMethod: string
): Promise<Withdrawal> {
  // Check balance
  const balance = await getBalance(agentId);
  if (balance < amount) {
    throw new Error(`Insufficient balance: have ${balance}, need ${amount}`);
  }

  // Debit balance (hold funds)
  await debitBalance(agentId, amount);

  // Create withdrawal record
  const docRef = collections.withdrawals().doc();
  const withdrawal: Omit<Withdrawal, 'id'> = {
    agentId,
    amount,
    currency,
    status: 'pending',
    paymentMethod,
    requestedAt: new Date(),
    processedAt: null,
    notes: null,
  };

  await docRef.set({
    ...withdrawal,
    requestedAt: Timestamp.fromDate(withdrawal.requestedAt),
  });

  return { id: docRef.id, ...withdrawal };
}

export async function getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
  const doc = await collections.withdrawals().doc(withdrawalId).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    agentId: data.agentId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    paymentMethod: data.paymentMethod,
    requestedAt: data.requestedAt.toDate(),
    processedAt: data.processedAt?.toDate() ?? null,
    notes: data.notes ?? null,
  };
}

export async function listWithdrawals(status?: string, limit: number = 50): Promise<Withdrawal[]> {
  // Simple query without compound index - filter in memory
  const snapshot = await collections.withdrawals().limit(limit * 2).get();
  let withdrawals: Withdrawal[] = [];

  for (const doc of snapshot.docs) {
    const w = await getWithdrawal(doc.id);
    if (w) {
      if (!status || w.status === status) {
        withdrawals.push(w);
      }
    }
  }

  // Sort by requestedAt descending and limit
  withdrawals = withdrawals
    .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
    .slice(0, limit);

  return withdrawals;
}

export async function processWithdrawal(
  withdrawalId: string,
  action: 'complete' | 'reject',
  notes?: string
): Promise<Withdrawal | null> {
  const withdrawal = await getWithdrawal(withdrawalId);
  if (!withdrawal) {
    return null;
  }

  if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
    throw new Error(`Cannot process withdrawal with status: ${withdrawal.status}`);
  }

  const withdrawalRef = collections.withdrawals().doc(withdrawalId);

  if (action === 'complete') {
    await withdrawalRef.update({
      status: 'completed',
      processedAt: Timestamp.fromDate(new Date()),
      notes: notes || 'Payment sent',
    });
  } else {
    // Refund the held amount back to agent
    await creditBalance(withdrawal.agentId, withdrawal.amount);
    await withdrawalRef.update({
      status: 'rejected',
      processedAt: Timestamp.fromDate(new Date()),
      notes: notes || 'Withdrawal rejected',
    });
  }

  return getWithdrawal(withdrawalId);
}
