import { describe, expect, it } from 'vitest';

import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

import { EvmAdapter } from '../adapter';

describe('EvmAdapter.getDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<TypedEvmNetworkConfig> = {}
  ): TypedEvmNetworkConfig => ({
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
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    ...overrides,
  });

  describe('rpc service', () => {
    it('should return RPC config when rpcUrl is present', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new EvmAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('rpc');

      expect(result).toEqual({
        rpcUrl: 'https://eth.llamarpc.com',
      });
    });

    it('should return null when rpcUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        rpcUrl: undefined,
      });
      const adapter = new EvmAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('rpc');

      expect(result).toBeNull();
    });
  });

  describe('explorer service', () => {
    it('should return explorer config when explorerUrl is present', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new EvmAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('explorer');

      expect(result).toEqual({
        explorerUrl: 'https://etherscan.io',
      });
    });

    it('should return null when explorerUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        explorerUrl: undefined,
      });
      const adapter = new EvmAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('explorer');

      expect(result).toBeNull();
    });
  });

  describe('contract-definitions service', () => {
    it('should return null for contract-definitions service', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new EvmAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('contract-definitions');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new EvmAdapter(networkConfig);

      expect(adapter.getDefaultServiceConfig('indexer')).toBeNull();
      expect(adapter.getDefaultServiceConfig('unknown')).toBeNull();
    });
  });
});
