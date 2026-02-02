import { jest } from '@jest/globals';
import {
  validateApiKey,
  getBalance,
  debitBalance,
  creditBalance,
  getDb,
  collections,
} from '../../services/firestore.js';

const validateApiKeyMock = validateApiKey as unknown as jest.MockedFunction<any>;
const getBalanceMock = getBalance as unknown as jest.MockedFunction<any>;
const debitBalanceMock = debitBalance as unknown as jest.MockedFunction<any>;
const creditBalanceMock = creditBalance as unknown as jest.MockedFunction<any>;
const getDbMock = getDb as unknown as jest.MockedFunction<any>;

let bountyTools: typeof import('../bounty.js').bountyTools;

type MockDoc = { id: string; data: () => any; exists: boolean };

const makeTimestamp = (date: Date) => ({ toDate: () => date });

let bountyIdCounter = 0;
let bountiesStore: Map<string, any>;
let docUpdateMocks: Map<string, any>;

const makeSnapshot = (id: string): MockDoc => {
  const data = bountiesStore.get(id);
  return {
    id,
    exists: !!data,
    data: () => data,
  };
};

const makeDocRef = (id: string) => {
  const update = jest.fn(async (updates: Record<string, any>) => {
    const existing = bountiesStore.get(id);
    if (!existing) {
      throw new Error('Bounty not found');
    }
    bountiesStore.set(id, { ...existing, ...updates });
  });
  docUpdateMocks.set(id, update);
  return {
    id,
    get: jest.fn(async () => makeSnapshot(id)),
    update,
  };
};

const createQuery = (filters: Array<{ field: string; value: any }> = []) => {
  let limitCount: number | undefined;
  const query = {
    where: (field: string, _op: string, value: any) => createQuery([...filters, { field, value }]),
    limit: (count: number) => {
      limitCount = count;
      return query;
    },
    get: async () => {
      let entries = Array.from(bountiesStore.entries());
      for (const filter of filters) {
        entries = entries.filter(([_, data]) => data[filter.field] === filter.value);
      }
      if (limitCount !== undefined) {
        entries = entries.slice(0, limitCount);
      }
      return {
        docs: entries.map(([id, data]) => ({ id, data: () => data })),
      };
    },
  };
  return query;
};

const makeBountyData = (overrides: Record<string, any> = {}) => {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    title: 'Fix issue',
    summary: 'Summary',
    description: 'Details',
    difficulty: 'medium',
    requiredSkills: ['typescript'],
    acceptanceCriteria: ['Tests pass'],
    amount: 100,
    currency: 'USDC',
    submissionMethod: 'pr',
    posterAgentId: 'poster-1',
    status: 'open',
    claims: [],
    createdAt: makeTimestamp(now),
    expiresAt: makeTimestamp(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    viewCount: 0,
    claimCount: 0,
    ...overrides,
  };
};

const makeClaimData = (overrides: Record<string, any> = {}) => {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    agentId: 'agent-1',
    claimedAt: makeTimestamp(now),
    expiresAt: makeTimestamp(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    status: 'active',
    ...overrides,
  };
};

beforeAll(async () => {
  bountyTools = (await import('../bounty.js')).bountyTools;
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  bountyIdCounter = 0;
  bountiesStore = new Map();
  docUpdateMocks = new Map();
  validateApiKeyMock.mockReset();
  getBalanceMock.mockReset();
  debitBalanceMock.mockReset();
  creditBalanceMock.mockReset();
  getDbMock.mockReset();

  const mockCollection = {
    add: jest.fn(async (data: Record<string, any>) => {
      const id = `bounty_${++bountyIdCounter}`;
      bountiesStore.set(id, data);
      const update = jest.fn(async (updates: Record<string, any>) => {
        const existing = bountiesStore.get(id);
        bountiesStore.set(id, { ...existing, ...updates });
      });
      docUpdateMocks.set(id, update);
      return {
        id,
        update,
        get: jest.fn(async () => makeSnapshot(id)),
      };
    }),
    doc: jest.fn((id: string) => makeDocRef(id)),
    where: jest.fn((field: string, op: string, value: any) => createQuery([{ field, value }])),
  };

  getDbMock.mockReturnValue({
    collection: jest.fn(() => mockCollection),
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('bounty_create', () => {
  it('returns error for invalid API key', async () => {
    validateApiKeyMock.mockResolvedValue(false);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: 'poster-1',
      apiKey: 'bad',
      title: 'New',
      summary: 'Summary',
      description: 'Desc',
      difficulty: 'easy',
      requiredSkills: ['ts'],
      acceptanceCriteria: ['done'],
      amount: 50,
      currency: 'USDC',
      expiresInDays: 7,
      submissionMethod: 'pr',
      fundNow: false,
    });

    expect(result).toEqual({ success: false, error: 'Invalid API key' });
  });

  it('returns error for insufficient balance when funding', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    getBalanceMock.mockResolvedValue(10);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: 'poster-1',
      apiKey: 'good',
      title: 'New',
      summary: 'Summary',
      description: 'Desc',
      difficulty: 'easy',
      requiredSkills: ['ts'],
      acceptanceCriteria: ['done'],
      amount: 50,
      currency: 'USDC',
      expiresInDays: 7,
      submissionMethod: 'pr',
      fundNow: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });

  it('creates a draft bounty without funding', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: 'poster-1',
      apiKey: 'good',
      title: 'Draft',
      summary: 'Summary',
      description: 'Desc',
      difficulty: 'easy',
      requiredSkills: ['ts'],
      acceptanceCriteria: ['done'],
      amount: 50,
      currency: 'USDC',
      expiresInDays: 7,
      submissionMethod: 'pr',
      fundNow: false,
    });

    expect(result.success).toBe(true);
    expect(result.bounty?.status).toBe('draft');
    expect(result.message).toContain('draft');
  });

  it('creates and funds an open bounty', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    getBalanceMock.mockResolvedValue(1000);

    const result = await bountyTools.bounty_create.handler({
      posterAgentId: 'poster-1',
      apiKey: 'good',
      title: 'Open',
      summary: 'Summary',
      description: 'Desc',
      difficulty: 'easy',
      requiredSkills: ['ts'],
      acceptanceCriteria: ['done'],
      amount: 100,
      currency: 'USDC',
      expiresInDays: 7,
      submissionMethod: 'pr',
      fundNow: true,
    });

    expect(result.success).toBe(true);
    expect(debitBalanceMock).toHaveBeenCalledWith('poster-1', 100);
    const update = docUpdateMocks.get(result.bounty!.id)!;
    expect(update).toHaveBeenCalledWith({ escrowId: `bounty_${result.bounty!.id}` });
  });
});

describe('bounty_fund', () => {
  it('rejects invalid API key', async () => {
    validateApiKeyMock.mockResolvedValue(false);

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'bad',
      bountyId: 'bounty_1',
    });

    expect(result).toEqual({ success: false, error: 'Invalid API key' });
  });

  it('rejects if bounty not found', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'missing',
    });

    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('rejects if not poster', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'draft', posterAgentId: 'poster-2' }));

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result).toEqual({ success: false, error: 'Only the poster can fund this bounty' });
  });

  it('rejects if bounty not draft', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'open' }));

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result).toEqual({ success: false, error: 'Bounty is already open' });
  });

  it('rejects if insufficient balance', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    getBalanceMock.mockResolvedValue(50);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'draft', amount: 100 }));

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });

  it('funds a draft bounty', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    getBalanceMock.mockResolvedValue(1000);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'draft', amount: 100 }));

    const result = await bountyTools.bounty_fund.handler({
      agentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result.success).toBe(true);
    expect(debitBalanceMock).toHaveBeenCalledWith('poster-1', 100);
    const update = docUpdateMocks.get('bounty_1')!;
    expect(update).toHaveBeenCalledWith({ status: 'open', escrowId: 'bounty_bounty_1' });
  });
});

describe('bounty_claim', () => {
  it('rejects invalid API key', async () => {
    validateApiKeyMock.mockResolvedValue(false);

    const result = await bountyTools.bounty_claim.handler({
      agentId: 'agent-1',
      apiKey: 'bad',
      bountyId: 'bounty_1',
    });

    expect(result).toEqual({ success: false, error: 'Invalid API key' });
  });

  it('rejects when bounty not found', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    const result = await bountyTools.bounty_claim.handler({
      agentId: 'agent-1',
      apiKey: 'good',
      bountyId: 'missing',
    });

    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('rejects when bounty not open', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'draft' }));

    const result = await bountyTools.bounty_claim.handler({
      agentId: 'agent-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result).toEqual({ success: false, error: 'Bounty is not open (status: draft)' });
  });

  it('rejects when already actively claimed', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    const future = new Date('2024-01-02T00:00:00.000Z');
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'open',
      claims: [makeClaimData({ expiresAt: makeTimestamp(future) })],
    }));

    const result = await bountyTools.bounty_claim.handler({
      agentId: 'agent-2',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('currently claimed');
  });

  it('claims bounty and expires old claims', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    const past = new Date('2023-12-31T00:00:00.000Z');
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'open',
      claimCount: 1,
      claims: [makeClaimData({ expiresAt: makeTimestamp(past) })],
    }));

    const result = await bountyTools.bounty_claim.handler({
      agentId: 'agent-2',
      apiKey: 'good',
      bountyId: 'bounty_1',
    });

    expect(result.success).toBe(true);
    const update = docUpdateMocks.get('bounty_1')!;
    expect(update).toHaveBeenCalled();
    const updated = bountiesStore.get('bounty_1');
    const expiredClaim = updated.claims.find((c: any) => c.agentId === 'agent-1');
    expect(expiredClaim.status).toBe('expired');
  });
});

describe('bounty_submit', () => {
  it('rejects invalid API key', async () => {
    validateApiKeyMock.mockResolvedValue(false);

    const result = await bountyTools.bounty_submit.handler({
      agentId: 'agent-1',
      apiKey: 'bad',
      bountyId: 'bounty_1',
      submissionUrl: 'http://example.com',
    });

    expect(result).toEqual({ success: false, error: 'Invalid API key' });
  });

  it('rejects when bounty not found', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    const result = await bountyTools.bounty_submit.handler({
      agentId: 'agent-1',
      apiKey: 'good',
      bountyId: 'missing',
      submissionUrl: 'http://example.com',
    });

    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('rejects when no active claim', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'claimed', claims: [] }));

    const result = await bountyTools.bounty_submit.handler({
      agentId: 'agent-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
      submissionUrl: 'http://example.com',
    });

    expect(result).toEqual({ success: false, error: 'You do not have an active claim on this bounty' });
  });

  it('submits work for an active claim', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'claimed',
      claims: [makeClaimData({ agentId: 'agent-1' })],
    }));

    const result = await bountyTools.bounty_submit.handler({
      agentId: 'agent-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
      submissionUrl: 'http://example.com',
      notes: 'Here is the fix',
    });

    expect(result.success).toBe(true);
    expect(result.submission?.status).toBe('in_review');
    const updated = bountiesStore.get('bounty_1');
    expect(updated.status).toBe('in_review');
    expect(updated.claims[0].status).toBe('submitted');
  });
});

describe('bounty_judge', () => {
  it('rejects invalid API key', async () => {
    validateApiKeyMock.mockResolvedValue(false);

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'mod-1',
      apiKey: 'bad',
      bountyId: 'bounty_1',
      winnerAgentId: 'agent-1',
    });

    expect(result).toEqual({ success: false, error: 'Invalid API key' });
  });

  it('rejects when bounty not found', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'mod-1',
      apiKey: 'good',
      bountyId: 'missing',
      winnerAgentId: 'agent-1',
    });

    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('rejects unauthorized judge', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'in_review', posterAgentId: 'poster-1', modAgentId: 'mod-1' }));

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'intruder',
      apiKey: 'good',
      bountyId: 'bounty_1',
      winnerAgentId: 'agent-1',
    });

    expect(result).toEqual({ success: false, error: 'Only the poster or mod agent can judge' });
  });

  it('rejects if bounty not in review', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({ status: 'claimed', posterAgentId: 'poster-1' }));

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
      winnerAgentId: 'agent-1',
    });

    expect(result).toEqual({ success: false, error: 'Bounty is not in review (status: claimed)' });
  });

  it('rejects if winner has no submitted claim', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'in_review',
      posterAgentId: 'poster-1',
      claims: [makeClaimData({ agentId: 'agent-1', status: 'active' })],
    }));

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
      winnerAgentId: 'agent-1',
    });

    expect(result).toEqual({ success: false, error: 'Winner has no submitted claim' });
  });

  it('judges and pays winner', async () => {
    validateApiKeyMock.mockResolvedValue(true);
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'in_review',
      posterAgentId: 'poster-1',
      claims: [makeClaimData({ agentId: 'agent-1', status: 'submitted', submissionUrl: 'http://pr' })],
    }));

    const result = await bountyTools.bounty_judge.handler({
      judgeAgentId: 'poster-1',
      apiKey: 'good',
      bountyId: 'bounty_1',
      winnerAgentId: 'agent-1',
      notes: 'Well done',
    });

    expect(result.success).toBe(true);
    expect(creditBalanceMock).toHaveBeenCalledWith('agent-1', 100);
    const updated = bountiesStore.get('bounty_1');
    expect(updated.status).toBe('completed');
    expect(updated.winnerAgentId).toBe('agent-1');
  });
});

describe('bounty_search', () => {
  it('filters and sorts bounties', async () => {
    bountiesStore.set('bounty_1', makeBountyData({ status: 'open', amount: 100, requiredSkills: ['typescript'] }));
    bountiesStore.set('bounty_2', makeBountyData({ status: 'open', amount: 300, requiredSkills: ['python'] }));
    bountiesStore.set('bounty_3', makeBountyData({ status: 'open', amount: 200, requiredSkills: ['TypeScript', 'node'] }));

    const result = await bountyTools.bounty_search.handler({
      status: 'open',
      skill: 'typescript',
      minAmount: 150,
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.bounties[0].id).toBe('bounty_3');
  });
});

describe('bounty_get', () => {
  it('returns error when bounty not found', async () => {
    const result = await bountyTools.bounty_get.handler({ bountyId: 'missing' });
    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('returns bounty details and increments view count', async () => {
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'open',
      viewCount: 2,
      claims: [makeClaimData({ status: 'submitted', submissionUrl: 'http://pr' })],
    }));

    const result = await bountyTools.bounty_get.handler({ bountyId: 'bounty_1' });

    expect(result.success).toBe(true);
    expect(result.bounty?.claims[0].submissionUrl).toBe('http://pr');
    const update = docUpdateMocks.get('bounty_1')!;
    expect(update).toHaveBeenCalledWith({ viewCount: 3 });
  });
});

describe('bounty_export_markdown', () => {
  it('returns error when bounty not found', async () => {
    const result = await bountyTools.bounty_export_markdown.handler({ bountyId: 'missing' });
    expect(result).toEqual({ success: false, error: 'Bounty not found' });
  });

  it('exports markdown for bounty', async () => {
    bountiesStore.set('bounty_1', makeBountyData({
      status: 'open',
      claims: [makeClaimData({ status: 'submitted', submissionUrl: 'http://pr' })],
    }));

    const result = await bountyTools.bounty_export_markdown.handler({ bountyId: 'bounty_1' });

    expect(result.success).toBe(true);
    expect(result.filename).toBe('bounty-bounty_1.md');
    expect(result.markdown).toContain('Fix issue');
    expect(result.markdown).toContain('Current Submissions');
  });
});
