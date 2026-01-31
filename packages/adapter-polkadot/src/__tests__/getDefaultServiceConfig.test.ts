import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appConfigService } from '@openzeppelin/ui-utils';

import { getPolkadotDefaultServiceConfig } from '../evm/configuration/network-services';
import type { TypedPolkadotNetworkConfig } from '../types';

/**
 * Tests for getPolkadotDefaultServiceConfig function.
 *
 * Note: We test the pure function directly instead of instantiating PolkadotAdapter
 * to avoid loading heavy dependencies which can cause memory issues during test execution.
 */
describe('getPolkadotDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<TypedPolkadotNetworkConfig> = {}
  ): TypedPolkadotNetworkConfig => ({
    id: 'moonbeam',
    exportConstName: 'moonbeam',
    name: 'Moonbeam',
    ecosystem: 'polkadot',
    network: 'moonbeam',
    type: 'mainnet',
    isTestnet: false,
    chainId: 1284,
    rpcUrl: 'https://rpc.api.moonbeam.network',
    explorerUrl: 'https://moonbeam.moonscan.io',
    apiUrl: 'https://api.etherscan.io/v2/api',
    supportsEtherscanV2: true,
    networkCategory: 'parachain',
    executionType: 'evm',
    relayChain: 'polkadot',
    nativeCurrency: {
      name: 'Glimmer',
      symbol: 'GLMR',
      decimals: 18,
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue(undefined);
    vi.spyOn(appConfigService, 'getExplorerApiKey').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rpc service', () => {
    it('should return RPC config when rpcUrl is present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toEqual({
        rpcUrl: 'https://rpc.api.moonbeam.network',
      });
    });

    it('should return null when rpcUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        rpcUrl: undefined,
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toBeNull();
    });
  });

  describe('explorer service', () => {
    it('should return explorer config with explorerUrl and apiUrl when present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://moonbeam.moonscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
      });
    });

    it('should include global V2 API key for V2-compatible networks', () => {
      vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue({
        apiKey: 'test-v2-api-key',
      });

      const networkConfig = createMockNetworkConfig({
        supportsEtherscanV2: true,
        primaryExplorerApiIdentifier: 'etherscan-v2',
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://moonbeam.moonscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
        apiKey: 'test-v2-api-key',
      });
      expect(appConfigService.getGlobalServiceConfig).toHaveBeenCalledWith('etherscanv2');
    });

    it('should include app API key from globalServiceConfigs for Hub networks (routescan)', () => {
      vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue({
        apiKey: 'test-routescan-key',
      });

      const networkConfig = createMockNetworkConfig({
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'routescan',
        networkCategory: 'hub',
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://moonbeam.moonscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
        apiKey: 'test-routescan-key',
      });
      expect(appConfigService.getGlobalServiceConfig).toHaveBeenCalledWith('routescan');
    });

    it('should fallback to getExplorerApiKey when globalServiceConfig has no apiKey', () => {
      vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue(undefined);
      vi.spyOn(appConfigService, 'getExplorerApiKey').mockReturnValue('fallback-api-key');

      const networkConfig = createMockNetworkConfig({
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'blockscout',
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://moonbeam.moonscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
        apiKey: 'fallback-api-key',
      });
      expect(appConfigService.getExplorerApiKey).toHaveBeenCalledWith('blockscout');
    });

    it('should return null when explorerUrl is missing and no API key configured', () => {
      const networkConfig = createMockNetworkConfig({
        explorerUrl: undefined,
        apiUrl: undefined,
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toBeNull();
    });

    it('should return config with API key when explorerUrl is missing but API key is available', () => {
      vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue({
        apiKey: 'test-api-key-only',
      });

      const networkConfig = createMockNetworkConfig({
        explorerUrl: undefined,
        apiUrl: undefined,
        supportsEtherscanV2: true,
        primaryExplorerApiIdentifier: 'etherscan-v2',
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: undefined,
        apiUrl: undefined,
        apiKey: 'test-api-key-only',
      });
    });
  });

  describe('contract-definitions service', () => {
    it('should return null for contract-definitions service', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'contract-definitions');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();

      expect(getPolkadotDefaultServiceConfig(networkConfig, 'indexer')).toBeNull();
      expect(getPolkadotDefaultServiceConfig(networkConfig, 'unknown')).toBeNull();
    });
  });
});
