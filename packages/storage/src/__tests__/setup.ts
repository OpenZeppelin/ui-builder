/**
 * Test setup and utilities for storage package tests
 */
import 'fake-indexeddb/auto';

import { vi } from 'vitest';

// Mock the logger utility to avoid console noise in tests
vi.mock('@openzeppelin/ui-builder-utils', async () => {
  const actual = await vi.importActual('@openzeppelin/ui-builder-utils');
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
