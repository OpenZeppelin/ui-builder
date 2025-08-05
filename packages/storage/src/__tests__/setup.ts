/**
 * Test setup and utilities for storage package tests
 */
import 'fake-indexeddb/auto';

import { vi } from 'vitest';

// Mock the logger utility to avoid console noise in tests
vi.mock('@openzeppelin/contracts-ui-builder-utils', async () => {
  const actual = await vi.importActual('@openzeppelin/contracts-ui-builder-utils');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };
});

// Mock toast notifications for React hook tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// React testing utilities for integration tests

// Mock dexie-react-hooks for integration tests
export const mockUseLiveQuery = vi.fn();
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: mockUseLiveQuery,
}));

// Global test utilities
export const createMockContractUIRecord = (overrides = {}) => ({
  id: 'test-id',
  title: 'Test Contract UI',
  ecosystem: 'evm',
  networkId: '1',
  contractAddress: '0x1234567890123456789012345678901234567890',
  functionId: 'transfer',
  formConfig: {
    id: 'test-form',
    title: 'Test Form',
    functionId: 'transfer',
    contractAddress: '0x1234567890123456789012345678901234567890',
    fields: [],
    layout: {
      columns: 1 as const,
      spacing: 'normal' as const,
      labelPosition: 'top' as const,
    },
    validation: {
      mode: 'onChange' as const,
      showErrors: 'inline' as const,
    },
    submitButton: {
      text: 'Submit',
      loadingText: 'Processing...',
    },
    theme: {},
    description: '',
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  metadata: {},
  ...overrides,
});

export const createEmptyContractUIRecord = (overrides = {}) => ({
  id: 'empty-test-id',
  title: 'New Contract UI',
  ecosystem: 'evm',
  networkId: '',
  contractAddress: '',
  functionId: '',
  formConfig: {
    id: 'draft',
    title: 'New Contract UI',
    functionId: '',
    contractAddress: '',
    fields: [],
    layout: {
      columns: 1 as const,
      spacing: 'normal' as const,
      labelPosition: 'top' as const,
    },
    validation: {
      mode: 'onChange' as const,
      showErrors: 'inline' as const,
    },
    submitButton: {
      text: 'Submit',
      loadingText: 'Processing...',
    },
    theme: {},
    description: '',
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  metadata: {
    isDraft: true,
    isManuallyRenamed: false,
  },
  ...overrides,
});

// Test database cleanup utility
export const cleanupTestDb = async () => {
  const { db } = await import('../database/db');

  // Clear all tables instead of deleting the database
  const tables = ['contractUIs'];
  for (const tableName of tables) {
    try {
      await db.table(tableName).clear();
    } catch {
      // Ignore errors if table doesn't exist yet
    }
  }
};
