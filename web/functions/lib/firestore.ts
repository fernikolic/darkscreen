/**
 * Firestore utilities for Cloudflare Workers/Pages Functions
 * Uses Firebase REST API (edge-compatible, no Node.js dependencies)
 */

// Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  createdAt: string;
  verified: boolean;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  stats: {
    tasksCompleted: number;
    totalEarned: number;
    successRate: number;
    avgCompletionTime: number;
    disputeCount: number;
    disputeRate: number;
  };
  apiKeyHash: string;
  balance: number;
  nostrPubkey?: string;
  nip05?: string;
}

interface FirestoreDocument {
  fields: Record<string, FirestoreValue>;
  name?: string;
  createTime?: string;
  updateTime?: string;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
}

// Environment interface
export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
}

const PROJECT_ID = 'clawdentials';

// Convert Firestore document to plain object
function fromFirestore(doc: FirestoreDocument): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(doc.fields || {})) {
    result[key] = parseFirestoreValue(value);
  }

  // Extract ID from document name
  if (doc.name) {
    const parts = doc.name.split('/');
    result.id = parts[parts.length - 1];
  }

  return result;
}

function parseFirestoreValue(value: FirestoreValue): any {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue?.values) {
    return value.arrayValue.values.map(parseFirestoreValue);
  }
  if (value.mapValue?.fields) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

// Convert plain object to Firestore format
function toFirestore(data: Record<string, any>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};

  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }

  return fields;
}

function toFirestoreValue(value: any): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return { timestampValue: value };
    }
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestore(value) } };
  }
  return { nullValue: null };
}

// Hash API key using Web Crypto API (edge-compatible)
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate API key using Web Crypto API
export function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `clw_${hex}`;
}

// Generate Nostr keypair (simplified for edge)
export async function generateNostrKeypair(): Promise<{
  secretKey: string;
  publicKey: string;
  nsec: string;
  npub: string;
}> {
  // Generate 32 random bytes for the secret key
  const secretBytes = new Uint8Array(32);
  crypto.getRandomValues(secretBytes);
  const secretKey = Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // For a proper implementation, we'd use secp256k1 to derive the public key
  // For now, we'll use a placeholder (the MCP server will handle the real keys)
  // This is just for the HTTP API - the MCP flow does the real key generation
  const publicKey = await hashApiKey(secretKey); // Simplified placeholder

  // nsec and npub would need bech32 encoding - simplified for edge
  const nsec = `nsec1${secretKey.slice(0, 58)}`;
  const npub = `npub1${publicKey.slice(0, 58)}`;

  return { secretKey, publicKey, nsec, npub };
}

// Firestore REST API client
export class FirestoreClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  }

  async getDocument(collection: string, docId: string): Promise<Record<string, any> | null> {
    const url = `${this.baseUrl}/${collection}/${docId}`;

    try {
      const response = await fetch(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Firestore error: ${response.status}`);
      }

      const doc = await response.json() as FirestoreDocument;
      return fromFirestore(doc);
    } catch (error) {
      console.error('Firestore get error:', error);
      return null;
    }
  }

  async createDocument(collection: string, docId: string, data: Record<string, any>): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/${collection}?documentId=${docId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: toFirestore(data),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firestore create error: ${error}`);
    }

    const doc = await response.json() as FirestoreDocument;
    return fromFirestore(doc);
  }

  async queryCollection(
    collection: string,
    filters?: Array<{ field: string; op: string; value: any }>,
    limit?: number
  ): Promise<Record<string, any>[]> {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

    const structuredQuery: any = {
      from: [{ collectionId: collection }],
    };

    if (filters && filters.length > 0) {
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: filters.map(f => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: toFirestoreValue(f.value),
            },
          })),
        },
      };
    }

    if (limit) {
      structuredQuery.limit = limit;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ structuredQuery }),
    });

    if (!response.ok) {
      throw new Error(`Firestore query error: ${response.status}`);
    }

    const results = await response.json() as Array<{ document?: FirestoreDocument }>;
    return results
      .filter(r => r.document)
      .map(r => fromFirestore(r.document!));
  }
}

// Create singleton instance
export const firestore = new FirestoreClient();

// Calculate reputation score
export function calculateReputationScore(agent: Record<string, any>): number {
  const stats = agent.stats || {
    tasksCompleted: 0,
    totalEarned: 0,
    successRate: 100,
    disputeCount: 0,
    avgCompletionTime: 0,
  };

  const createdAt = agent.createdAt ? new Date(agent.createdAt).getTime() : Date.now();
  const accountAgeDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

  const effectiveSuccessRate = stats.tasksCompleted > 0
    ? ((stats.tasksCompleted - stats.disputeCount) / stats.tasksCompleted) * 100
    : 100;

  const speedBonus = stats.avgCompletionTime > 0 ? Math.max(0, 10 - stats.avgCompletionTime / 60) : 5;

  const taskScore = stats.tasksCompleted * 2;
  const successScore = effectiveSuccessRate * 0.3;
  const earningsScore = Math.log10(stats.totalEarned + 1) * 10;
  const speedScore = speedBonus;
  const ageScore = accountAgeDays * 0.1;

  const maxPossible = (10000 * 2) + (100 * 0.3) + (Math.log10(1000001) * 10) + 10 + (365 * 0.1);
  const rawScore = taskScore + successScore + earningsScore + speedScore + ageScore;
  const normalizedScore = (rawScore / maxPossible) * 100;

  return Math.min(100, Math.max(0, Math.round(normalizedScore * 10) / 10));
}
