import { describe, expect, it } from 'vitest';

import type { MidnightNetworkConfig } from '@openzeppelin/ui-types';

import { MidnightAdapter } from '../adapter';

describe('MidnightAdapter.getDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<MidnightNetworkConfig> = {}
  ): MidnightNetworkConfig => ({
    id: 'midnight-testnet',
    exportConstName: 'midnightTestnet',
    name: 'Midnight Testnet',
    ecosystem: 'midnight',
    network: 'midnight-testnet',
    type: 'testnet',
    isTestnet: true,
    networkId: { 2: 'TestNet' },
    rpcEndpoints: { default: 'https://rpc.testnet.midnight.network' },
    indexerUri: 'https://indexer.testnet.midnight.network/api/v1/graphql',
    indexerWsUri: 'wss://indexer.testnet.midnight.network/api/v1/graphql/ws',
    ...overrides,
  });

  describe('indexer service', () => {
    it('should return indexer config when both URLs are present', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new MidnightAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('indexer');

      expect(result).toEqual({
        httpUrl: 'https://indexer.testnet.midnight.network/api/v1/graphql',
        wsUrl: 'wss://indexer.testnet.midnight.network/api/v1/graphql/ws',
      });
    });

    it('should return null when indexerUri is missing', () => {
      const networkConfig = createMockNetworkConfig({
        indexerUri: undefined,
      });
      const adapter = new MidnightAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('indexer');

      expect(result).toBeNull();
    });

    it('should return null when indexerWsUri is missing', () => {
      const networkConfig = createMockNetworkConfig({
        indexerWsUri: undefined,
      });
      const adapter = new MidnightAdapter(networkConfig);

      const result = adapter.getDefaultServiceConfig('indexer');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();
      const adapter = new MidnightAdapter(networkConfig);

      expect(adapter.getDefaultServiceConfig('rpc')).toBeNull();
      expect(adapter.getDefaultServiceConfig('explorer')).toBeNull();
      expect(adapter.getDefaultServiceConfig('unknown')).toBeNull();
    });
  });
});
