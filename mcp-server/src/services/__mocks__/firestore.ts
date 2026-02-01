import { jest } from '@jest/globals';

export const validateApiKey = jest.fn();
export const getBalance = jest.fn();
export const debitBalance = jest.fn();
export const creditBalance = jest.fn();
export const getDb = jest.fn();
export const collections = {
  escrows: jest.fn(),
  agents: jest.fn(),
  tasks: jest.fn(),
  subscriptions: jest.fn(),
  withdrawals: jest.fn(),
  deposits: jest.fn(),
};
