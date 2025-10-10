import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';
import { appConfigService } from '@openzeppelin/ui-builder-utils';

import { resolveRpcUrl, testStellarRpcConnection, validateStellarRpcEndpoint } from '../rpc';

// Helper to create a mock StellarNetworkConfig
const createMockConfig = (
  id: string,
  sorobanRpcUrl?: string,
  name?: string
): StellarNetworkConfig => ({
  id,
  name: name || `Test ${id}`,
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  exportConstName: id.replace(/-/g, ''),
  horizonUrl: `https://horizon-${id}.stellar.org`,
  sorobanRpcUrl: sorobanRpcUrl || '', // Allow undefined or empty for testing error cases
  networkPassphrase: `Test ${id} Network`,
  explorerUrl: `https://stellar.expert/explorer/${id}`,
});

// Mock the appConfigService from the correct package
vi.mock('@openzeppelin/ui-builder-utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@openzeppelin/ui-builder-utils')>();
  return {
    ...original,
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    appConfigService: {
      getRpcEndpointOverride: vi.fn(),
      getConfig: vi.fn().mockReturnValue({ rpcEndpoints: {} }),
    },
  };
});

describe('resolveRpcUrl', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReset();
    vi.mocked(appConfigService.getConfig).mockReturnValue({ rpcEndpoints: {} });
  });

  it('should use RPC override from AppConfigService if available (string)', () => {
    const networkId = 'stellar-testnet-override';
    const overrideRpcUrl = 'https://custom-soroban-rpc.example.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(overrideRpcUrl);

    const config = createMockConfig(networkId, 'https://soroban-testnet.stellar.org');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  it('should use RPC override from AppConfigService if available (object with http)', () => {
    const networkId = 'stellar-testnet-object-override';
    const overrideRpcUrl = 'https://custom-soroban-object.example.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue({ http: overrideRpcUrl });

    const config = createMockConfig(networkId, 'https://soroban-testnet.stellar.org');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  it('should fall back to networkConfig.sorobanRpcUrl if no override is available', () => {
    const networkId = 'stellar-testnet-fallback';
    const defaultRpcUrl = 'https://soroban-testnet.stellar.org';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);

    const config = createMockConfig(networkId, defaultRpcUrl);
    expect(resolveRpcUrl(config)).toBe(defaultRpcUrl);
  });

  it('should fall back to networkConfig.sorobanRpcUrl if override is invalid URL', () => {
    const networkId = 'stellar-testnet-invalid-override';
    const defaultRpcUrl = 'https://soroban-testnet.stellar.org';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue('invalid-url');

    const config = createMockConfig(networkId, defaultRpcUrl);
    expect(resolveRpcUrl(config)).toBe(defaultRpcUrl);
  });

  it('should throw an error if no valid Soroban RPC URL (override or default) is found', () => {
    const networkId = 'no-valid-soroban-rpc';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);
    const config = createMockConfig(networkId, undefined);

    expect(() => resolveRpcUrl(config)).toThrowError(
      `No valid Soroban RPC URL configured for network Test ${networkId} (ID: ${networkId}).`
    );
  });

  it('should throw an error if default Soroban RPC is invalid and no override is found', () => {
    const networkId = 'invalid-default-soroban-rpc';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);
    const config = createMockConfig(networkId, 'not-a-url');

    expect(() => resolveRpcUrl(config)).toThrowError(
      `No valid Soroban RPC URL configured for network Test ${networkId} (ID: ${networkId}).`
    );
  });

  it('should use override even if default is invalid', () => {
    const networkId = 'override-wins-over-invalid-default';
    const overrideRpcUrl = 'https://good-soroban-override.example.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(overrideRpcUrl);

    const config = createMockConfig(networkId, 'bad-default-url');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  it('should work with mainnet Soroban RPC URL', () => {
    const networkId = 'stellar-mainnet';
    const mainnetRpcUrl = 'https://mainnet.sorobanrpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);

    const config = createMockConfig(networkId, mainnetRpcUrl);
    expect(resolveRpcUrl(config)).toBe(mainnetRpcUrl);
  });
});

describe('validateStellarRpcEndpoint', () => {
  it('should return true for valid Soroban RPC URLs', () => {
    const validConfigs = [
      { url: 'https://soroban-testnet.stellar.org', name: 'Official Testnet', isCustom: false },
      { url: 'https://mainnet.sorobanrpc.com', name: 'Official Mainnet', isCustom: false },
      { url: 'https://stellar.publicnode.com', name: 'Public Node', isCustom: false },
      { url: 'https://custom-soroban.example.com', name: 'Custom', isCustom: true },
    ];

    validConfigs.forEach((config) => {
      expect(validateStellarRpcEndpoint(config)).toBe(true);
    });
  });

  it('should return false for invalid URLs', () => {
    const invalidConfigs = [
      { url: 'not-a-url', name: 'Invalid', isCustom: false },
      { url: '', name: 'Empty URL', isCustom: false },
    ];

    invalidConfigs.forEach((config) => {
      expect(validateStellarRpcEndpoint(config)).toBe(false);
    });
  });

  it('should return true for HTTP localhost URLs (development)', () => {
    const devConfig = {
      url: 'http://localhost:8000/soroban/rpc',
      name: 'Local Dev',
      isCustom: true,
    };
    expect(validateStellarRpcEndpoint(devConfig)).toBe(true);
  });

  it('should handle validation errors gracefully', () => {
    // This test verifies the catch block works, but doMock doesn't work in the middle of test execution
    // Instead, we'll test that the function returns false on invalid input
    const config = { url: null as unknown as string, name: 'Test', isCustom: false };
    expect(validateStellarRpcEndpoint(config)).toBe(false);
  });
});

describe('testStellarRpcConnection', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Mock Date.now to simulate time passage
    const mockDate = new Date('2023-01-01T00:00:00Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return success for healthy Soroban RPC endpoint', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { status: 'healthy' },
      }),
    };

    // Mock fetch to simulate some latency
    vi.mocked(global.fetch).mockImplementation(async () => {
      // Advance time to simulate network latency
      vi.advanceTimersByTime(100);
      return mockResponse as unknown as Response;
    });

    const config = { url: 'https://soroban-testnet.stellar.org', name: 'Testnet', isCustom: false };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(true);
    expect(result.latency).toBeGreaterThan(0);
    expect(result.error).toBeUndefined();
  });

  it('should return success for valid getLatestLedger response (fallback)', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { sequence: 12345, hash: 'abc123' },
      }),
    };

    // Mock fetch to simulate some latency
    vi.mocked(global.fetch).mockImplementation(async () => {
      // Advance time to simulate network latency
      vi.advanceTimersByTime(150);
      return mockResponse as unknown as Response;
    });

    const config = { url: 'https://soroban-testnet.stellar.org', name: 'Testnet', isCustom: false };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(true);
    expect(result.latency).toBeGreaterThan(0);
  });

  it('should return failure for HTTP error responses', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const config = { url: 'https://bad-soroban.example.com', name: 'Bad RPC', isCustom: true };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('HTTP error: 500');
  });

  it('should return failure for JSON-RPC error responses', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Method not found' },
      }),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const config = { url: 'https://soroban-testnet.stellar.org', name: 'Testnet', isCustom: false };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Method not found');
  });

  it('should return failure for unhealthy service status', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { status: 'unhealthy' },
      }),
    };

    // Mock fetch to simulate some latency
    vi.mocked(global.fetch).mockImplementation(async () => {
      // Advance time to simulate network latency
      vi.advanceTimersByTime(120);
      return mockResponse as unknown as Response;
    });

    const config = { url: 'https://soroban-testnet.stellar.org', name: 'Testnet', isCustom: false };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(false);
    expect(result.error).toContain('unhealthy');
    expect(result.latency).toBeGreaterThan(0);
  });

  it('should handle connection timeout', async () => {
    // Create a mock that immediately rejects with AbortError
    vi.mocked(global.fetch).mockRejectedValue(
      (() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return error;
      })()
    );

    const config = { url: 'https://slow-soroban.example.com', name: 'Slow RPC', isCustom: true };
    const result = await testStellarRpcConnection(config, 1000);

    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });

  it('should return failure for missing URL', async () => {
    const config = { url: '', name: 'Empty URL', isCustom: false };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Soroban RPC URL is required');
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const config = {
      url: 'https://unreachable-soroban.example.com',
      name: 'Unreachable',
      isCustom: true,
    };
    const result = await testStellarRpcConnection(config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should use custom timeout value', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { status: 'healthy' },
      }),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const config = { url: 'https://soroban-testnet.stellar.org', name: 'Testnet', isCustom: false };
    const result = await testStellarRpcConnection(config, 10000); // 10 second timeout

    expect(result.success).toBe(true);

    // Verify fetch was called with the signal
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
