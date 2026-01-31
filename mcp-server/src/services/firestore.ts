import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import type { Escrow, Agent, Task } from '../types/index.js';

let app: App;
let db: Firestore;

export function initFirestore(): Firestore {
  if (getApps().length === 0) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath) {
      // Use explicit service account credentials
      app = initializeApp({
        credential: cert(credentialsPath),
        projectId: 'clawdentials',
      });
    } else {
      // Fall back to default credentials
      app = initializeApp({
        projectId: 'clawdentials',
      });
    }
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
};

// Escrow operations
export async function createEscrow(data: Omit<Escrow, 'id' | 'createdAt' | 'completedAt' | 'proofOfWork'>): Promise<Escrow> {
  const docRef = collections.escrows().doc();
  const escrow: Omit<Escrow, 'id'> = {
    ...data,
    status: 'pending',
    createdAt: new Date(),
    completedAt: null,
    proofOfWork: null,
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
    currency: data.currency,
    status: data.status,
    createdAt: data.createdAt.toDate(),
    completedAt: data.completedAt?.toDate() ?? null,
    proofOfWork: data.proofOfWork ?? null,
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

async function updateAgentStats(agentId: string, amount: number): Promise<void> {
  const agentRef = collections.agents().doc(agentId);
  const doc = await agentRef.get();

  if (doc.exists) {
    const data = doc.data()!;
    const currentStats = data.stats || { tasksCompleted: 0, totalEarned: 0, successRate: 100, avgCompletionTime: 0 };

    await agentRef.update({
      'stats.tasksCompleted': currentStats.tasksCompleted + 1,
      'stats.totalEarned': currentStats.totalEarned + amount,
    });
  }
}
