import { describe, expect, it } from 'vitest';

import type { SolanaNetworkConfig } from '@openzeppelin/ui-types';

import { SolanaAdapter } from '../adapter';

describe('SolanaAdapter.getDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<SolanaNetworkConfig> = {}
  ): SolanaNetworkConfig =>
    ({
      id: 'solana-mainnet',
      exportConstName: 'solanaMainnet',
      name: 'Solana Mainnet',
      ecosystem: 'solana',
      network: 'mainnet-beta',
      type: 'mainnet',
      isTestnet: false,
      rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      ...overrides,
    }) as SolanaNetworkConfig;

  describe('rpc service', () => {
    it('should return RPC config when rpcEndpoint is present', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new SolanaAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('rpc');

      expect(result).toEqual({
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });
    });

    it('should return null when rpcEndpoint is missing', () => {
      const networkConfig = createMockNetworkConfig({
        rpcEndpoint: undefined,
      });
      const adapter = new SolanaAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('rpc');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new SolanaAdapter(networkConfig);

      expect(adapter.getDefaultServiceConfig('explorer')).toBeNull();
      expect(adapter.getDefaultServiceConfig('indexer')).toBeNull();
      expect(adapter.getDefaultServiceConfig('unknown')).toBeNull();
    });
  });
});
