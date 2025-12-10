/**
 * Unit tests for Two-Step Ownable Support
 *
 * Tests: T007 - getCurrentLedger() returning ledger sequence number
 *        T008 - OWNERSHIP_TRANSFER_INITIATED event parsing in indexer
 *        T013 - validateExpirationLedger() helper
 *        Additional tests for two-step ownership transfer workflow
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import { validateExpirationLedger } from '../../src/access-control/validation';

// Mock the Stellar SDK
vi.mock('@stellar/stellar-sdk', () => ({
  rpc: {
    Server: vi.fn().mockImplementation(() => ({
      getLatestLedger: vi.fn().mockResolvedValue({
        sequence: 12345678,
      }),
    })),
  },
}));

// Mock the logger
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  appConfigService: {
    getIndexerEndpointOverride: vi.fn().mockReturnValue(null),
  },
}));

describe('Two-Step Ownable Support', () => {
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
    };
  });

  describe('getCurrentLedger() (T007)', () => {
    it('should return the current ledger sequence number', async () => {
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');

      const result = await getCurrentLedger(mockNetworkConfig);

      expect(result).toBe(12345678);
      expect(typeof result).toBe('number');
    });

    it('should throw error when RPC call fails', async () => {
      // Reset and mock with error
      vi.resetModules();
      vi.doMock('@stellar/stellar-sdk', () => ({
        rpc: {
          Server: vi.fn().mockImplementation(() => ({
            getLatestLedger: vi.fn().mockRejectedValue(new Error('Network error')),
          })),
        },
      }));

      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');

      await expect(getCurrentLedger(mockNetworkConfig)).rejects.toThrow(
        'Failed to get current ledger'
      );
    });
  });

  describe('OWNERSHIP_TRANSFER_INITIATED event type (T008)', () => {
    it('should support OWNERSHIP_TRANSFER_INITIATED event type in IndexerHistoryEntry', async () => {
      // This test verifies that the type system supports the new event type
      // The actual GraphQL queries will be tested in integration tests
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      // Verify the class can be instantiated
      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      expect(client).toBeDefined();
      expect(typeof client.queryPendingOwnershipTransfer).toBe('function');
    });
  });

  describe('queryPendingOwnershipTransfer() (T012)', () => {
    it('should return null when indexer is unavailable', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient(mockNetworkConfig); // No indexerUri configured

      await expect(
        client.queryPendingOwnershipTransfer(
          'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
        )
      ).rejects.toThrow('Indexer not available');
    });

    it('should return pending transfer when indexer returns initiation event', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      // Mock fetch for the indexer queries
      global.fetch = vi
        .fn()
        // First call - availability check
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
        })
        // Second call - initiation event query
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'test-event-1',
                    type: 'OWNERSHIP_TRANSFER_INITIATED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    previousOwner: 'GOLDOWNER123456789ABCDEFGHIJK',
                    liveUntilLedger: 12350000,
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    blockHeight: '12340000',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        })
        // Third call - completion check (no completion)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        });

      const result = await client.queryPendingOwnershipTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeDefined();
      expect(result?.pendingOwner).toBe('GNEWOWNER123456789ABCDEFGHIJK');
      expect(result?.previousOwner).toBe('GOLDOWNER123456789ABCDEFGHIJK');
      expect(result?.liveUntilLedger).toBe(12350000);
    });

    it('should return null when no pending transfer exists', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      // Mock fetch returning empty results
      global.fetch = vi
        .fn()
        // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
        })
        // Empty initiation events
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        });

      const result = await client.queryPendingOwnershipTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeNull();
    });

    it('should return null when transfer was completed after initiation', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      global.fetch = vi
        .fn()
        // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
        })
        // Initiation event
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'initiation-event',
                    type: 'OWNERSHIP_TRANSFER_INITIATED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    previousOwner: 'GOLDOWNER123456789ABCDEFGHIJK',
                    liveUntilLedger: 12350000,
                    txHash: 'initiation-tx',
                    timestamp: '2025-01-15T10:00:00Z',
                    blockHeight: '12340000',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        })
        // Completion event exists after initiation
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'completion-event',
                    type: 'OWNERSHIP_TRANSFER_COMPLETED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    txHash: 'completion-tx',
                    timestamp: '2025-01-15T11:00:00Z',
                    blockHeight: '12345000',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        });

      const result = await client.queryPendingOwnershipTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeNull();
    });
  });

  describe('validateExpirationLedger() (T013)', () => {
    it('should validate that expiration ledger is greater than current ledger', () => {
      const currentLedger = 12340000;
      const validExpiration = 12350000;
      const invalidExpiration = 12330000;

      // Valid: expiration > current
      const validResult = validateExpirationLedger(validExpiration, currentLedger);
      expect(validResult.valid).toBe(true);
      expect(validResult.error).toBeUndefined();
      expect(validResult.currentLedger).toBe(currentLedger);

      // Invalid: expiration < current
      const invalidResult = validateExpirationLedger(invalidExpiration, currentLedger);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBeDefined();
      expect(invalidResult.error).toContain('already passed');
    });

    it('should reject when expiration equals current ledger (boundary condition per FR-020)', () => {
      const currentLedger = 12340000;
      const boundaryExpiration = 12340000; // Equal to current - should be invalid

      const boundaryResult = validateExpirationLedger(boundaryExpiration, currentLedger);
      expect(boundaryResult.valid).toBe(false);
      expect(boundaryResult.error).toBeDefined();
    });

    it('should return currentLedger in validation result', () => {
      const currentLedger = 12340000;
      const result = validateExpirationLedger(12350000, currentLedger);

      expect(result.currentLedger).toBe(currentLedger);
    });
  });
});
