import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserExplorerConfig } from '@openzeppelin/ui-types';
import { appConfigService, userNetworkServiceConfigService } from '@openzeppelin/ui-utils';

import { EvmCompatibleNetworkConfig } from '../../types/network';
import {
  resolveExplorerConfig,
  testEvmExplorerConnection,
  validateEvmExplorerConfig,
} from '../explorer';

// Mock @openzeppelin/ui-utils
vi.mock('@openzeppelin/ui-utils', async () => {
  const actual = await vi.importActual('@openzeppelin/ui-utils');
  return {
    ...actual,
    appConfigService: {
      getGlobalServiceConfig: vi.fn(),
      getExplorerApiKey: vi.fn(),
    },
    userNetworkServiceConfigService: {
      get: vi.fn(),
    },
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('resolveExplorerConfig', () => {
  // Mock services
  const mockGetGlobalServiceConfig = vi.mocked(appConfigService.getGlobalServiceConfig);
  const mockGetExplorerApiKey = vi.mocked(appConfigService.getExplorerApiKey);
  const mockUserConfigGet = vi.mocked(userNetworkServiceConfigService.get);

  // Base network config for tests
  const baseNetworkConfig: EvmCompatibleNetworkConfig = {
    id: 'test-network',
    name: 'Test Network',
    ecosystem: 'evm',
    network: 'test',
    type: 'testnet',
    isTestnet: true,
    exportConstName: 'testNetwork',
    chainId: 1,
    rpcUrl: 'https://rpc.test-network.io',
    nativeCurrency: { name: 'Test', symbol: 'TEST', decimals: 18 },
    explorerUrl: 'https://default-explorer.io',
    apiUrl: 'https://api.default-explorer.io/api',
    supportsEtherscanV2: false,
    primaryExplorerApiIdentifier: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGlobalServiceConfig.mockReturnValue(undefined);
    mockGetExplorerApiKey.mockReturnValue(undefined);
    mockUserConfigGet.mockReturnValue(null);
  });

  describe('priority 1: user-configured explorer settings', () => {
    it('should use user-configured apiKey when available', () => {
      mockUserConfigGet.mockReturnValue({
        apiKey: 'user-api-key',
        explorerUrl: 'https://user-explorer.io',
        apiUrl: 'https://api.user-explorer.io/api',
      });

      const result = resolveExplorerConfig(baseNetworkConfig);

      expect(result.apiKey).toBe('user-api-key');
      expect(result.explorerUrl).toBe('https://user-explorer.io');
      expect(result.apiUrl).toBe('https://api.user-explorer.io/api');
      expect(result.isCustom).toBe(true);
    });

    it('should fall back to network defaults for missing user config fields', () => {
      mockUserConfigGet.mockReturnValue({
        apiKey: 'user-api-key',
        // explorerUrl and apiUrl not provided
      });

      const result = resolveExplorerConfig(baseNetworkConfig);

      expect(result.apiKey).toBe('user-api-key');
      expect(result.explorerUrl).toBe('https://default-explorer.io');
      expect(result.apiUrl).toBe('https://api.default-explorer.io/api');
    });

    it('should fall back to global V2 key when user config has no apiKey', () => {
      const v2NetworkConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: true,
        primaryExplorerApiIdentifier: 'etherscan-v2',
      };

      mockUserConfigGet.mockReturnValue({
        explorerUrl: 'https://user-explorer.io',
        // apiKey not provided
      });

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'etherscanv2') return { apiKey: 'global-v2-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(v2NetworkConfig);

      expect(result.apiKey).toBe('global-v2-key');
      expect(result.isCustom).toBe(true);
    });
  });

  describe('priority 2: global Etherscan V2 API key', () => {
    it('should use global V2 API key for etherscan-v2 networks', () => {
      const v2NetworkConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: true,
        primaryExplorerApiIdentifier: 'etherscan-v2',
      };

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'etherscanv2') return { apiKey: 'global-v2-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(v2NetworkConfig);

      expect(result.apiKey).toBe('global-v2-key');
      expect(result.isCustom).toBe(false);
      expect(result.name).toContain('V2 API');
    });

    it('should NOT use global V2 key when supportsEtherscanV2 is false', () => {
      const nonV2Config: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'etherscan-v2',
      };

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'etherscanv2') return { apiKey: 'global-v2-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(nonV2Config);

      expect(result.apiKey).toBeUndefined();
    });

    it('should NOT use global V2 key when primaryExplorerApiIdentifier is not etherscan-v2', () => {
      const routescanConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: true,
        primaryExplorerApiIdentifier: 'routescan',
      };

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'etherscanv2') return { apiKey: 'global-v2-key' };
        if (name === 'routescan') return { apiKey: 'routescan-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(routescanConfig);

      // Should use routescan key via the appApiKey path, not V2 path
      expect(result.apiKey).toBe('routescan-key');
      expect(result.name).not.toContain('V2 API');
    });
  });

  describe('priority 3: app-configured API key via globalServiceConfigs', () => {
    it('should use API key from globalServiceConfigs for routescan', () => {
      const routescanConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'routescan',
      };

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'routescan') return { apiKey: 'routescan-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(routescanConfig);

      expect(result.apiKey).toBe('routescan-key');
      expect(result.isCustom).toBe(false);
    });

    it('should use API key from globalServiceConfigs for blockscout', () => {
      const blockscoutConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'blockscout',
      };

      mockGetGlobalServiceConfig.mockImplementation((name) => {
        if (name === 'blockscout') return { apiKey: 'blockscout-key' };
        return undefined;
      });

      const result = resolveExplorerConfig(blockscoutConfig);

      expect(result.apiKey).toBe('blockscout-key');
    });
  });

  describe('priority 4: app-configured API key via getExplorerApiKey (fallback)', () => {
    it('should fall back to getExplorerApiKey if globalServiceConfig has no apiKey', () => {
      const customExplorerConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        primaryExplorerApiIdentifier: 'custom-explorer',
      };

      mockGetGlobalServiceConfig.mockReturnValue(undefined);
      mockGetExplorerApiKey.mockReturnValue('legacy-api-key');

      const result = resolveExplorerConfig(customExplorerConfig);

      expect(result.apiKey).toBe('legacy-api-key');
      expect(mockGetExplorerApiKey).toHaveBeenCalledWith('custom-explorer');
    });

    it('should prefer globalServiceConfig.apiKey over getExplorerApiKey', () => {
      const explorerConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        primaryExplorerApiIdentifier: 'some-explorer',
      };

      mockGetGlobalServiceConfig.mockReturnValue({ apiKey: 'global-service-key' });
      mockGetExplorerApiKey.mockReturnValue('legacy-key');

      const result = resolveExplorerConfig(explorerConfig);

      // globalServiceConfig takes precedence
      expect(result.apiKey).toBe('global-service-key');
    });
  });

  describe('priority 5: default network explorer (no API key)', () => {
    it('should return network defaults when no API key is configured', () => {
      const result = resolveExplorerConfig(baseNetworkConfig);

      expect(result.explorerUrl).toBe('https://default-explorer.io');
      expect(result.apiUrl).toBe('https://api.default-explorer.io/api');
      expect(result.apiKey).toBeUndefined();
      expect(result.isCustom).toBe(false);
    });

    it('should return network defaults when primaryExplorerApiIdentifier is not set', () => {
      const noIdentifierConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        primaryExplorerApiIdentifier: undefined,
      };

      const result = resolveExplorerConfig(noIdentifierConfig);

      expect(result.apiKey).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle user config with empty object', () => {
      mockUserConfigGet.mockReturnValue({});

      const result = resolveExplorerConfig(baseNetworkConfig);

      // Should still be treated as user config (isCustom: true) but fall back to defaults
      expect(result.isCustom).toBe(true);
      expect(result.explorerUrl).toBe('https://default-explorer.io');
      expect(result.apiKey).toBeUndefined();
    });

    it('should handle globalServiceConfig with empty object', () => {
      const explorerConfig: EvmCompatibleNetworkConfig = {
        ...baseNetworkConfig,
        primaryExplorerApiIdentifier: 'some-explorer',
      };

      mockGetGlobalServiceConfig.mockReturnValue({});
      mockGetExplorerApiKey.mockReturnValue('fallback-key');

      const result = resolveExplorerConfig(explorerConfig);

      // Should fall back to getExplorerApiKey since globalServiceConfig has no apiKey
      expect(result.apiKey).toBe('fallback-key');
    });
  });
});

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
    expect(result.error).toBe('API key is required for testing connection to this explorer');
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
    const networkConfig: EvmCompatibleNetworkConfig = {
      id: 'test',
      name: 'Test',
      ecosystem: 'evm',
      network: 'test',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'testNetwork',
      chainId: 1,
      rpcUrl: 'https://rpc.test.io',
      nativeCurrency: { name: 'Test', symbol: 'TEST', decimals: 18 },
      apiUrl: 'https://api.etherscan.io/api',
    };

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
