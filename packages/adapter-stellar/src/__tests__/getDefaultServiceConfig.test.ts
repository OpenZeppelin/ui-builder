import { describe, expect, it } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-types';

import { getStellarDefaultServiceConfig } from '../configuration/network-services';

/**
 * Tests for getStellarDefaultServiceConfig function.
 *
 * Note: We test the pure function directly instead of instantiating StellarAdapter
 * to avoid loading heavy Stellar SDK dependencies (WASM modules, etc.) which can
 * cause memory issues during test execution.
 */
describe('getStellarDefaultServiceConfig', () => {
  const createMockNetworkConfig = (
    overrides: Partial<StellarNetworkConfig> = {}
  ): StellarNetworkConfig =>
    ({
      id: 'stellar-testnet',
      exportConstName: 'stellarTestnet',
      name: 'Stellar Testnet',
      ecosystem: 'stellar',
      network: 'testnet',
      type: 'testnet',
      isTestnet: true,
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
      ...overrides,
    }) as StellarNetworkConfig;

  describe('rpc service', () => {
    it('should return RPC config when sorobanRpcUrl is present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getStellarDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toEqual({
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      });
    });

    it('should return null when sorobanRpcUrl is missing', () => {
      const networkConfig = createMockNetworkConfig({
        sorobanRpcUrl: undefined,
      });

      const result = getStellarDefaultServiceConfig(networkConfig, 'rpc');

      expect(result).toBeNull();
    });
  });

  describe('indexer service', () => {
    it('should return indexer config when both URLs are present', () => {
      const networkConfig = createMockNetworkConfig({
        indexerUri: 'https://indexer.stellar.example/graphql',
        indexerWsUri: 'wss://indexer.stellar.example/graphql',
      });

      const result = getStellarDefaultServiceConfig(networkConfig, 'indexer');

      expect(result).toEqual({
        indexerUri: 'https://indexer.stellar.example/graphql',
        indexerWsUri: 'wss://indexer.stellar.example/graphql',
      });
    });

    it('should return null when indexerUri is missing', () => {
      const networkConfig = createMockNetworkConfig({
        indexerWsUri: 'wss://indexer.stellar.example/graphql',
      });

      const result = getStellarDefaultServiceConfig(networkConfig, 'indexer');

      expect(result).toBeNull();
    });

    it('should return null when indexerWsUri is missing', () => {
      const networkConfig = createMockNetworkConfig({
        indexerUri: 'https://indexer.stellar.example/graphql',
      });

      const result = getStellarDefaultServiceConfig(networkConfig, 'indexer');

      expect(result).toBeNull();
    });

    it('should return null when neither indexer URL is present', () => {
      const networkConfig = createMockNetworkConfig();

      const result = getStellarDefaultServiceConfig(networkConfig, 'indexer');

      expect(result).toBeNull();
    });
  });

  describe('unknown service', () => {
    it('should return null for unknown service IDs', () => {
      const networkConfig = createMockNetworkConfig();

      expect(getStellarDefaultServiceConfig(networkConfig, 'explorer')).toBeNull();
      expect(getStellarDefaultServiceConfig(networkConfig, 'unknown')).toBeNull();
    });
  });
});
