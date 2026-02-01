import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^\\.\\./services/firestore\\.js$': '<rootDir>/src/services/__mocks__/firestore.ts',
    '^\\.\\./\\.\\./services/firestore\\.js$': '<rootDir>/src/services/__mocks__/firestore.ts',
    '^firebase-admin/firestore$': '<rootDir>/src/__mocks__/firebase-admin-firestore.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
