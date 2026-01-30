import { describe, expect, it } from 'vitest';

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
    it('should return explorer config when explorerUrl is present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toEqual({
        explorerUrl: 'https://moonbeam.moonscan.io',
      });
    });

    it('should return null when explorerUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        explorerUrl: undefined,
      });

      const result = getPolkadotDefaultServiceConfig(networkConfig, 'explorer');

      expect(result).toBeNull();
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
