import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { EvmNetworkConfig } from '@openzeppelin/ui-types';
import { appConfigService } from '@openzeppelin/ui-utils';

import { getEvmDefaultServiceConfig } from '../configuration/network-services';

describe('getEvmDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<TypedEvmNetworkConfig> = {}
  ): EvmNetworkConfig => ({
    id: 'ethereum',
    exportConstName: 'ethereum',
    name: 'Ethereum',
    ecosystem: 'evm',
    network: 'mainnet',
    type: 'mainnet',
    isTestnet: false,
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
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

      const result = getEvmDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toEqual({
        rpcUrl: 'https://eth.llamarpc.com',
      });
    });

    it('should return null when rpcUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        rpcUrl: undefined,
      });

      const result = getEvmDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toBeNull();
    });
  });

  describe('explorer service', () => {
    it('should return explorer config with explorerUrl and apiUrl when present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
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

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: 'test-v2-api-key',
      });
      expect(appConfigService.getGlobalServiceConfig).toHaveBeenCalledWith('etherscanv2');
    });

    it('should include app API key from globalServiceConfigs for non-V2 networks', () => {
      vi.spyOn(appConfigService, 'getGlobalServiceConfig').mockReturnValue({
        apiKey: 'test-routescan-key',
      });

      const networkConfig = createMockNetworkConfig({
        supportsEtherscanV2: false,
        primaryExplorerApiIdentifier: 'routescan',
      });

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
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

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: 'fallback-api-key',
      });
      expect(appConfigService.getExplorerApiKey).toHaveBeenCalledWith('blockscout');
    });

    it('should return null when explorerUrl is missing and no API key configured', () => {
      const networkConfig = createMockNetworkConfig({
        explorerUrl: undefined,
        apiUrl: undefined,
      });

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

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

      const result = getEvmDefaultServiceConfig(networkConfig, 'explorer');

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

      const result = getEvmDefaultServiceConfig(networkConfig, 'contract-definitions');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();

      expect(getEvmDefaultServiceConfig(networkConfig, 'indexer')).toBeNull();
      expect(getEvmDefaultServiceConfig(networkConfig, 'unknown')).toBeNull();
    });
  });
});
