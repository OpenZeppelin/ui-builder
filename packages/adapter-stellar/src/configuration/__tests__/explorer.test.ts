import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StellarNetworkConfig, UserExplorerConfig } from '@openzeppelin/contracts-ui-builder-types';

import {
  testStellarExplorerConnection,
  validateStellarExplorerConfig,
} from '../../configuration/explorer';

describe('validateStellarExplorerConfig', () => {
  it('should return true for valid configuration with all fields', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return false for invalid explorerUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'invalid-url',
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });

  it('should return false for invalid apiUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'invalid-url',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });

  it('should return true for configuration without apiKey', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'https://api.stellarchain.io',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return true for configuration without apiUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return false for configuration without explorerUrl', () => {
    const config = {
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    } as UserExplorerConfig;
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });
});

describe('testStellarExplorerConnection', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockNetworkConfig: StellarNetworkConfig = {
    id: 'stellar-testnet',
    name: 'Stellar Testnet',
    ecosystem: 'stellar',
    network: 'stellar',
    type: 'testnet',
    isTestnet: true,
    exportConstName: 'stellartestnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    explorerUrl: 'https://stellarchain.io/testnet',
  };

  it('should return success for working explorer', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
    };

    // Mock fetch to resolve after some time
    vi.mocked(global.fetch).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResponse as unknown as Response), 100);
      });
    });

    const explorerConfig: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      name: 'Test Explorer',
      isCustom: true,
    };

    // Start the test
    const resultPromise = testStellarExplorerConnection(explorerConfig, mockNetworkConfig);

    // Advance timers to simulate the fetch delay
    vi.advanceTimersByTime(100);

    const result = await resultPromise;
    expect(result.success).toBe(true);
    expect(result.latency).toBeGreaterThan(0);
  });

  it('should return failure for non-200 response', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const explorerConfig: UserExplorerConfig = {
      explorerUrl: 'https://nonexistent.stellarchain.io',
      name: 'Test Explorer',
      isCustom: true,
    };

    const result = await testStellarExplorerConnection(explorerConfig, mockNetworkConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('404');
  });

  it('should return failure for network error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const explorerConfig: UserExplorerConfig = {
      explorerUrl: 'https://unreachable.stellarchain.io',
      name: 'Test Explorer',
      isCustom: true,
    };

    const result = await testStellarExplorerConnection(explorerConfig, mockNetworkConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should handle connection timeout', async () => {
    // Create a mock that simulates a hanging request
    vi.mocked(global.fetch).mockImplementation((_url, options) => {
      const signal = options?.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        // Don't resolve - this simulates a hanging request
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
      });
    });

    const explorerConfig: UserExplorerConfig = {
      explorerUrl: 'https://slow.stellarchain.io',
      name: 'Slow Explorer',
      isCustom: true,
    };

    // Start the connection test with a 1 second timeout
    const resultPromise = testStellarExplorerConnection(explorerConfig, mockNetworkConfig, 1000);

    // Advance time to trigger the timeout
    vi.advanceTimersByTime(1000);

    const result = await resultPromise;
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  }, 10000); // Increase test timeout to 10 seconds
});
