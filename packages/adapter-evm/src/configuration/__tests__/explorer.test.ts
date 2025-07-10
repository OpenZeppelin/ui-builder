import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EvmNetworkConfig, UserExplorerConfig } from '@openzeppelin/transaction-form-types';

import { testEvmExplorerConnection, validateEvmExplorerConfig } from '../../configuration/explorer';

describe('validateEvmExplorerConfig', () => {
  it('should return true for valid configuration with all fields', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateEvmExplorerConfig(config)).toBe(true);
  });

  it('should return false for invalid explorerUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'invalid-url',
      apiKey: 'valid-key',
      isCustom: true,
    };
    expect(validateEvmExplorerConfig(config)).toBe(false);
  });

  it('should return false for invalid apiUrl', () => {
    const config: UserExplorerConfig = {
      apiUrl: 'invalid-url',
      apiKey: 'valid-key',
      isCustom: true,
    };
    expect(validateEvmExplorerConfig(config)).toBe(false);
  });

  it('should return false for empty apiKey', () => {
    const config: UserExplorerConfig = {
      apiKey: '',
      isCustom: true,
    };
    expect(validateEvmExplorerConfig(config)).toBe(false);
  });

  it('should return true for configuration without optional fields', () => {
    const config: UserExplorerConfig = {
      apiKey: 'valid-key',
      isCustom: true,
    };
    expect(validateEvmExplorerConfig(config)).toBe(true);
  });
});

describe('testEvmExplorerConnection', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fail without apiKey', async () => {
    const config: UserExplorerConfig = {
      apiUrl: 'https://api.etherscan.io/api',
      isCustom: true,
    };
    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toBe('API key is required for testing connection');
  });

  it('should fail without apiUrl and no networkConfig', async () => {
    const config: UserExplorerConfig = {
      apiKey: 'test-key',
      isCustom: true,
    };
    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('API URL is required');
  });

  it('should use networkConfig apiUrl if not provided', async () => {
    const config: UserExplorerConfig = {
      apiKey: 'test-key',
      isCustom: true,
    };
    const networkConfig: EvmNetworkConfig = {
      id: 'test',
      name: 'Test',
      network: 'test',
      type: 'testnet',
      isTestnet: true,
      apiUrl: 'https://api.etherscan.io/api',
    } as EvmNetworkConfig;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '1', result: '123' }),
    });

    const result = await testEvmExplorerConnection(config, networkConfig);
    expect(result.success).toBe(true);
    expect(result.latency).toBeDefined();
  });

  it('should succeed with valid response', async () => {
    const config: UserExplorerConfig = {
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'test-key',
      isCustom: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '1', result: '123' }),
    });

    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(true);
    expect(result.latency).toBeDefined();
  });

  it('should fail on HTTP error', async () => {
    const config: UserExplorerConfig = {
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'test-key',
      isCustom: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 403');
  });

  it('should fail on API error in response', async () => {
    const config: UserExplorerConfig = {
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'invalid-key',
      isCustom: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '0', message: 'Invalid API Key' }),
    });

    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API Key');
  });

  it('should handle fetch errors', async () => {
    const config: UserExplorerConfig = {
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'test-key',
      isCustom: true,
    };

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await testEvmExplorerConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
