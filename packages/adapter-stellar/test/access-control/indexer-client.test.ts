/**
 * Unit tests for StellarIndexerClient
 *
 * Tests user configuration from localStorage, config priority, and cache reset behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-types';

import { createIndexerClient } from '../../src/access-control/indexer-client';

// Mock the utils module
const mockUserConfigGet = vi.fn();
const mockUserConfigSubscribe = vi.fn().mockReturnValue(() => {});
const mockAppConfigGetIndexer = vi.fn();

vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('wss://') ||
        url.startsWith('ws://')
      );
    } catch {
      return false;
    }
  },
  userNetworkServiceConfigService: {
    get: (...args: unknown[]) => mockUserConfigGet(...args),
    subscribe: (...args: unknown[]) => mockUserConfigSubscribe(...args),
  },
  appConfigService: {
    getIndexerEndpointOverride: (...args: unknown[]) => mockAppConfigGetIndexer(...args),
  },
}));

describe('StellarIndexerClient - User Configuration', () => {
  let mockNetworkConfig: StellarNetworkConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNetworkConfig = {
      id: 'stellar-testnet',
      name: 'Stellar Testnet',
      ecosystem: 'stellar',
      network: 'stellar',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'stellarTestnet',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
      explorerUrl: 'https://stellar.expert/explorer/testnet',
    };
  });

  describe('getUserIndexerEndpoints', () => {
    it('should read user config from localStorage via userNetworkServiceConfigService', async () => {
      const userIndexerUrl = 'https://user-configured-indexer.example.com/graphql';
      mockUserConfigGet.mockReturnValue({
        indexerUri: userIndexerUrl,
      });
      mockAppConfigGetIndexer.mockReturnValue(undefined);

      const client = createIndexerClient(mockNetworkConfig);

      // Trigger endpoint resolution by calling checkAvailability
      // The client will try to resolve endpoints
      await client.checkAvailability().catch(() => {});

      // Verify userNetworkServiceConfigService.get was called with correct params
      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
    });

    it('should prioritize user config over AppConfigService', async () => {
      const userIndexerUrl = 'https://user-configured-indexer.example.com/graphql';
      const appConfigIndexerUrl = 'https://app-config-indexer.example.com/graphql';

      mockUserConfigGet.mockReturnValue({
        indexerUri: userIndexerUrl,
      });
      mockAppConfigGetIndexer.mockReturnValue(appConfigIndexerUrl);

      const client = createIndexerClient(mockNetworkConfig);

      // Trigger endpoint resolution
      await client.checkAvailability().catch(() => {});

      // User config should be checked first
      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
    });

    it('should fall back to AppConfigService when no user config', async () => {
      mockUserConfigGet.mockReturnValue(null);
      mockAppConfigGetIndexer.mockReturnValue('https://app-config-indexer.example.com/graphql');

      const client = createIndexerClient(mockNetworkConfig);

      await client.checkAvailability().catch(() => {});

      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
      expect(mockAppConfigGetIndexer).toHaveBeenCalledWith('stellar-testnet');
    });

    it('should fall back to network config when no user or app config', async () => {
      mockUserConfigGet.mockReturnValue(null);
      mockAppConfigGetIndexer.mockReturnValue(undefined);

      const configWithIndexer: StellarNetworkConfig = {
        ...mockNetworkConfig,
        indexerUri: 'https://network-default-indexer.example.com/graphql',
      };

      const client = createIndexerClient(configWithIndexer);

      await client.checkAvailability().catch(() => {});

      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
      expect(mockAppConfigGetIndexer).toHaveBeenCalledWith('stellar-testnet');
    });

    it('should ignore invalid URLs from user config', async () => {
      mockUserConfigGet.mockReturnValue({
        indexerUri: 'not-a-valid-url',
      });
      mockAppConfigGetIndexer.mockReturnValue('https://valid-fallback.example.com/graphql');

      const client = createIndexerClient(mockNetworkConfig);

      await client.checkAvailability().catch(() => {});

      // Should have tried user config but fallen back due to invalid URL
      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
      expect(mockAppConfigGetIndexer).toHaveBeenCalledWith('stellar-testnet');
    });

    it('should handle both HTTP and WebSocket endpoints from user config', async () => {
      mockUserConfigGet.mockReturnValue({
        indexerUri: 'https://user-http.example.com/graphql',
        indexerWsUri: 'wss://user-ws.example.com/graphql',
      });

      const client = createIndexerClient(mockNetworkConfig);

      await client.checkAvailability().catch(() => {});

      expect(mockUserConfigGet).toHaveBeenCalledWith('stellar-testnet', 'indexer');
    });
  });

  describe('config change subscription', () => {
    it('should subscribe to config changes on construction', () => {
      mockUserConfigGet.mockReturnValue(null);

      createIndexerClient(mockNetworkConfig);

      expect(mockUserConfigSubscribe).toHaveBeenCalledWith(
        'stellar-testnet',
        'indexer',
        expect.any(Function)
      );
    });

    it('should reset cache when config changes', async () => {
      mockUserConfigGet.mockReturnValue({
        indexerUri: 'https://initial-indexer.example.com/graphql',
      });

      let configChangeCallback: (() => void) | undefined;
      mockUserConfigSubscribe.mockImplementation(
        (_networkId: string, _serviceId: string, callback: () => void) => {
          configChangeCallback = callback;
          return () => {};
        }
      );

      const client = createIndexerClient(mockNetworkConfig);

      // First call to checkAvailability
      await client.checkAvailability().catch(() => {});
      const firstCallCount = mockUserConfigGet.mock.calls.length;

      // Simulate config change
      if (configChangeCallback) {
        configChangeCallback();
      }

      // Second call should re-read config (cache was reset)
      await client.checkAvailability().catch(() => {});
      const secondCallCount = mockUserConfigGet.mock.calls.length;

      // Should have called get again after cache reset
      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });
  });

  describe('dispose', () => {
    it('should unsubscribe from config changes when disposed', () => {
      const unsubscribeMock = vi.fn();
      mockUserConfigSubscribe.mockReturnValue(unsubscribeMock);

      const client = createIndexerClient(mockNetworkConfig);
      client.dispose();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
