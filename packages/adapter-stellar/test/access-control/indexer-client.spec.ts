/**
 * Unit tests for StellarIndexerClient
 *
 * Tests: T031 - History queries with mock GraphQL responses
 *        T033 - No indexer configured/unreachable fallback behavior
 *
 * These tests use mocked fetch responses to validate GraphQL query construction,
 * response parsing, error handling, and endpoint resolution logic.
 */
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import {
  createIndexerClient,
  StellarIndexerClient,
  type IndexerHistoryOptions,
} from '../../src/access-control/indexer-client';

// Mock the logger
vi.mock('@openzeppelin/ui-builder-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openzeppelin/ui-builder-utils')>();
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    // Mock appConfigService
    appConfigService: {
      getIndexerEndpointOverride: vi.fn().mockReturnValue(undefined),
    },
  };
});

// Test configuration
const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
const TEST_INDEXER_HTTP = 'https://indexer.example.com/graphql';
const TEST_INDEXER_WS = 'wss://indexer.example.com/graphql';

describe('StellarIndexerClient (T031, T033)', () => {
  let mockNetworkConfig: StellarNetworkConfig;
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    mockNetworkConfig = {
      id: 'stellar-testnet',
      name: 'Stellar Testnet',
      ecosystem: 'stellar',
      network: 'stellar',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'stellarTestnet',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
      indexerUri: TEST_INDEXER_HTTP,
      indexerWsUri: TEST_INDEXER_WS,
    };

    // Setup global fetch mock
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockRestore();
  });

  describe('Factory Function', () => {
    it('should create an indexer client instance', () => {
      const client = createIndexerClient(mockNetworkConfig);
      expect(client).toBeInstanceOf(StellarIndexerClient);
    });
  });

  describe('Availability Check (T033)', () => {
    it('should successfully check availability when indexer responds', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const isAvailable = await client.checkAvailability();

      expect(isAvailable).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        TEST_INDEXER_HTTP,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('__typename'),
        })
      );
    });

    it('should return false when no indexer configured', async () => {
      const noIndexerConfig: StellarNetworkConfig = {
        ...mockNetworkConfig,
        indexerUri: undefined,
        indexerWsUri: undefined,
      };

      const client = new StellarIndexerClient(noIndexerConfig);
      const isAvailable = await client.checkAvailability();

      expect(isAvailable).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return false when indexer returns non-ok status', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const isAvailable = await client.checkAvailability();

      expect(isAvailable).toBe(false);
    });

    it('should return false when fetch throws network error', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const client = new StellarIndexerClient(mockNetworkConfig);
      const isAvailable = await client.checkAvailability();

      expect(isAvailable).toBe(false);
    });

    it('should cache availability check result', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      // First check
      await client.checkAvailability();
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second check should use cache
      await client.checkAvailability();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('Query History - Basic (T031)', () => {
    it('should query history with no filters', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock history query
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'a'.repeat(64),
                  timestamp: '2024-01-01T00:00:00Z',
                  blockHeight: '1000',
                },
                {
                  id: 'event-2',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_REVOKED',
                  txHash: 'b'.repeat(64),
                  timestamp: '2024-01-02T00:00:00Z',
                  blockHeight: '2000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        role: { id: 'admin' },
        account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
        changeType: 'GRANTED',
        txId: 'a'.repeat(64),
        timestamp: '2024-01-01T00:00:00Z',
        ledger: 1000,
      });
      expect(result.items[1]).toMatchObject({
        role: { id: 'admin' },
        changeType: 'REVOKED',
        ledger: 2000,
      });
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should query history with role filter', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'minter',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'c'.repeat(64),
                  timestamp: '2024-01-03T00:00:00Z',
                  blockHeight: '3000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const options: IndexerHistoryOptions = { roleId: 'minter' };
      const result = await client.queryHistory(TEST_CONTRACT, options);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role.id).toBe('minter');

      // Verify query variables include role filter
      const lastCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        role: 'minter',
      });
      expect(body.query).toContain('$role: String');
    });

    it('should query history with account filter', async () => {
      const testAccount = 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5';

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'admin',
                  account: testAccount,
                  type: 'ROLE_GRANTED',
                  txHash: 'd'.repeat(64),
                  timestamp: '2024-01-04T00:00:00Z',
                  blockHeight: '4000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const options: IndexerHistoryOptions = { account: testAccount };
      const result = await client.queryHistory(TEST_CONTRACT, options);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].account).toBe(testAccount);

      // Verify query variables include account filter
      const lastCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        account: testAccount,
      });
      expect(body.query).toContain('$account: String');
    });

    it('should query history with limit', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'e'.repeat(64),
                  timestamp: '2024-01-05T00:00:00Z',
                  blockHeight: '5000',
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'cursor123',
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const options: IndexerHistoryOptions = { limit: 10 };
      const result = await client.queryHistory(TEST_CONTRACT, options);

      expect(result.items).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.endCursor).toBe('cursor123');

      // Verify query variables include limit
      const lastCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        limit: 10,
      });
      expect(body.query).toContain('$limit: Int');
      expect(body.query).toContain('first: $limit');
    });

    it('should query history with multiple filters', async () => {
      const testAccount = 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5';

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'burner',
                  account: testAccount,
                  type: 'ROLE_GRANTED',
                  txHash: 'f'.repeat(64),
                  timestamp: '2024-01-06T00:00:00Z',
                  blockHeight: '6000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const options: IndexerHistoryOptions = {
        roleId: 'burner',
        account: testAccount,
        limit: 5,
      };
      const result = await client.queryHistory(TEST_CONTRACT, options);

      expect(result.items).toHaveLength(1);

      // Verify all filters are applied
      const lastCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        role: 'burner',
        account: testAccount,
        limit: 5,
      });
    });

    it('should query history with cursor for pagination', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-2',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'g'.repeat(64),
                  timestamp: '2024-01-07T00:00:00Z',
                  blockHeight: '7000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const options: IndexerHistoryOptions = {
        limit: 10,
        cursor: 'previousCursor123',
      };
      const result = await client.queryHistory(TEST_CONTRACT, options);

      expect(result.items).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(false);

      // Verify cursor is included in query variables
      const lastCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        limit: 10,
        cursor: 'previousCursor123',
      });
      expect(body.query).toContain('$cursor: Cursor');
      expect(body.query).toContain('after: $cursor');
    });
  });

  describe('Ownership Event Handling (T031)', () => {
    it('should handle ownership transfer events', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-ownership',
                  role: null, // Ownership events don't have a role
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'OWNERSHIP_TRANSFER_COMPLETED',
                  txHash: 'g'.repeat(64),
                  timestamp: '2024-01-07T00:00:00Z',
                  blockHeight: '7000',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role.id).toBe('OWNER'); // Should map null role to 'OWNER'
      expect(result.items[0].changeType).toBe('GRANTED'); // Ownership transfer treated as GRANTED
    });
  });

  describe('Error Handling (T033)', () => {
    it('should throw when querying with unavailable indexer', async () => {
      const noIndexerConfig: StellarNetworkConfig = {
        ...mockNetworkConfig,
        indexerUri: undefined,
      };

      const client = new StellarIndexerClient(noIndexerConfig);

      await expect(client.queryHistory(TEST_CONTRACT)).rejects.toThrow(
        'Indexer not available for this network'
      );
    });

    it('should throw when indexer returns non-ok status', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      await expect(client.queryHistory(TEST_CONTRACT)).rejects.toThrow(
        'Indexer query failed with status 500'
      );
    });

    it('should throw when indexer returns GraphQL errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Invalid query' }, { message: 'Contract not found' }],
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      await expect(client.queryHistory(TEST_CONTRACT)).rejects.toThrow(
        'Indexer query errors: Invalid query; Contract not found'
      );
    });

    it('should return empty result when no events found', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should return empty result when data is null', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: null,
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should throw when fetch throws unexpected error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockRejectedValueOnce(new Error('Network timeout'));

      const client = new StellarIndexerClient(mockNetworkConfig);

      await expect(client.queryHistory(TEST_CONTRACT)).rejects.toThrow('Network timeout');
    });
  });

  describe('Endpoint Resolution Precedence', () => {
    it('should use runtime override from AppConfigService', async () => {
      const { appConfigService } = await import('@openzeppelin/ui-builder-utils');
      const runtimeOverride = 'https://runtime-override.example.com/graphql';

      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(runtimeOverride);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.checkAvailability();

      expect(fetchSpy).toHaveBeenCalledWith(
        runtimeOverride,
        expect.objectContaining({ method: 'POST' })
      );

      // Reset mock
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(undefined);
    });

    it('should use runtime override object with http and ws', async () => {
      const { appConfigService } = await import('@openzeppelin/ui-builder-utils');
      const runtimeOverride = {
        http: 'https://runtime-http.example.com/graphql',
        ws: 'wss://runtime-ws.example.com/graphql',
      };

      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(runtimeOverride);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.checkAvailability();

      expect(fetchSpy).toHaveBeenCalledWith(
        runtimeOverride.http,
        expect.objectContaining({ method: 'POST' })
      );

      // Reset mock
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(undefined);
    });

    it('should fall back to network config when no runtime override', async () => {
      const { appConfigService } = await import('@openzeppelin/ui-builder-utils');
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(undefined);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.checkAvailability();

      expect(fetchSpy).toHaveBeenCalledWith(
        TEST_INDEXER_HTTP,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should cache resolved endpoints', async () => {
      const { appConfigService } = await import('@openzeppelin/ui-builder-utils');
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(undefined);

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      // First availability check should resolve and cache endpoints
      await client.checkAvailability();

      // Change the mock to return a different value
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(
        'https://should-not-be-used.example.com/graphql'
      );

      // Second check should still use cached endpoints
      fetchSpy.mockClear();
      await client.checkAvailability();

      // Should not fetch again due to caching
      expect(fetchSpy).not.toHaveBeenCalled();

      // Reset mock
      vi.mocked(appConfigService.getIndexerEndpointOverride).mockReturnValue(undefined);
    });
  });

  describe('Query Structure Validation (T031)', () => {
    it('should construct GraphQL query with correct structure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { accessControlEvents: { nodes: [] } },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.queryHistory(TEST_CONTRACT);

      const queryCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(queryCall[1]?.body as string);

      // Validate query structure
      expect(body.query).toContain('query GetHistory');
      expect(body.query).toContain('$contract: String!');
      expect(body.query).toContain('accessControlEvents');
      expect(body.query).toContain('filter:');
      expect(body.query).toContain('contract: { equalTo: $contract }');
      expect(body.query).toContain('orderBy: TIMESTAMP_DESC');
      expect(body.query).toContain('nodes {');
      expect(body.query).toContain('id');
      expect(body.query).toContain('role');
      expect(body.query).toContain('account');
      expect(body.query).toContain('type');
      expect(body.query).toContain('txHash');
      expect(body.query).toContain('timestamp');
      expect(body.query).toContain('blockHeight');

      // Validate variables
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
      });
    });

    it('should include filter conditions when options provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { accessControlEvents: { nodes: [] } },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.queryHistory(TEST_CONTRACT, {
        roleId: 'admin',
        account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
        limit: 10,
      });

      const queryCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(queryCall[1]?.body as string);

      // Should include filter parameters in query signature
      expect(body.query).toContain('$role: String');
      expect(body.query).toContain('$account: String');
      expect(body.query).toContain('$limit: Int');

      // Should include filter conditions
      expect(body.query).toContain('role: { equalTo: $role }');
      expect(body.query).toContain('account: { equalTo: $account }');
      expect(body.query).toContain('first: $limit');
    });
  });

  describe('Data Transformation (T031)', () => {
    it('should correctly transform indexer entries to HistoryEntry format', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'test-event-123',
                  role: 'pauser',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'a1b2c3d4e5f6',
                  timestamp: '2024-11-24T12:00:00.000Z',
                  blockHeight: '12345',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items).toHaveLength(1);

      const entry = result.items[0];
      expect(entry).toMatchObject({
        role: {
          id: 'pauser',
        },
        account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
        changeType: 'GRANTED',
        txId: 'a1b2c3d4e5f6',
        timestamp: '2024-11-24T12:00:00.000Z',
        ledger: 12345,
      });

      // Validate types
      expect(typeof entry.role.id).toBe('string');
      expect(typeof entry.account).toBe('string');
      expect(['GRANTED', 'REVOKED']).toContain(entry.changeType);
      expect(typeof entry.txId).toBe('string');
      expect(typeof entry.timestamp).toBe('string');
      expect(typeof entry.ledger).toBe('number');
    });

    it('should map ROLE_REVOKED to REVOKED changeType', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'revoke-event',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_REVOKED',
                  txHash: 'revoke-tx',
                  timestamp: '2024-11-24T13:00:00.000Z',
                  blockHeight: '12346',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items[0].changeType).toBe('REVOKED');
    });

    it('should parse blockHeight string to number', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  id: 'event-1',
                  role: 'admin',
                  account: 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5',
                  type: 'ROLE_GRANTED',
                  txHash: 'tx-1',
                  timestamp: '2024-11-24T14:00:00.000Z',
                  blockHeight: '999999',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: undefined,
              },
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result.items[0].ledger).toBe(999999);
      expect(typeof result.items[0].ledger).toBe('number');
    });
  });

  describe('queryLatestGrants()', () => {
    const TEST_ROLE = 'admin';
    const TEST_ACCOUNT_1 = 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5';
    const TEST_ACCOUNT_2 = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

    it('should return empty map for empty member array', async () => {
      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, []);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      // Should not make any fetch calls
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should query and return grant info for members', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock latest grants query
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  account: TEST_ACCOUNT_1,
                  txHash: 'a'.repeat(64),
                  timestamp: '2024-01-15T10:00:00Z',
                  blockHeight: '5000',
                },
                {
                  account: TEST_ACCOUNT_2,
                  txHash: 'b'.repeat(64),
                  timestamp: '2024-01-10T08:00:00Z',
                  blockHeight: '4000',
                },
              ],
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [
        TEST_ACCOUNT_1,
        TEST_ACCOUNT_2,
      ]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);

      // Check first account's grant info
      const grant1 = result.get(TEST_ACCOUNT_1);
      expect(grant1).toBeDefined();
      expect(grant1?.timestamp).toBe('2024-01-15T10:00:00Z');
      expect(grant1?.txId).toBe('a'.repeat(64));
      expect(grant1?.ledger).toBe(5000);

      // Check second account's grant info
      const grant2 = result.get(TEST_ACCOUNT_2);
      expect(grant2).toBeDefined();
      expect(grant2?.timestamp).toBe('2024-01-10T08:00:00Z');
      expect(grant2?.txId).toBe('b'.repeat(64));
      expect(grant2?.ledger).toBe(4000);
    });

    it('should only keep first (latest) grant per account when multiple events exist', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock query with multiple events for same account (ordered DESC by timestamp)
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  account: TEST_ACCOUNT_1,
                  txHash: 'latest-tx',
                  timestamp: '2024-01-20T12:00:00Z', // Latest
                  blockHeight: '6000',
                },
                {
                  account: TEST_ACCOUNT_1,
                  txHash: 'older-tx',
                  timestamp: '2024-01-10T08:00:00Z', // Older
                  blockHeight: '4000',
                },
              ],
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1]);

      expect(result.size).toBe(1);
      const grant = result.get(TEST_ACCOUNT_1);
      expect(grant?.txId).toBe('latest-tx');
      expect(grant?.timestamp).toBe('2024-01-20T12:00:00Z');
    });

    it('should construct correct GraphQL query with filters', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock query response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { accessControlEvents: { nodes: [] } },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1, TEST_ACCOUNT_2]);

      // Verify the query structure
      const queryCall = fetchSpy.mock.calls[1];
      const body = JSON.parse(queryCall[1]?.body as string);

      // Check query contains expected filters
      expect(body.query).toContain('query LatestGrants');
      expect(body.query).toContain('$contract: String!');
      expect(body.query).toContain('$role: String!');
      expect(body.query).toContain('$accounts: [String!]!');
      expect(body.query).toContain('type: { equalTo: ROLE_GRANTED }');
      expect(body.query).toContain('account: { in: $accounts }');
      expect(body.query).toContain('orderBy: TIMESTAMP_DESC');

      // Check variables
      expect(body.variables).toMatchObject({
        contract: TEST_CONTRACT,
        role: TEST_ROLE,
        accounts: [TEST_ACCOUNT_1, TEST_ACCOUNT_2],
      });
    });

    it('should return empty map when no events found', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock empty response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { accessControlEvents: { nodes: [] } },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should throw when indexer is unavailable', async () => {
      const noIndexerConfig: StellarNetworkConfig = {
        ...mockNetworkConfig,
        indexerUri: undefined,
      };

      const client = new StellarIndexerClient(noIndexerConfig);

      await expect(
        client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1])
      ).rejects.toThrow('Indexer not available');
    });

    it('should throw when indexer returns error status', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock error response
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      await expect(
        client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1])
      ).rejects.toThrow('Indexer query failed with status 500');
    });

    it('should throw when indexer returns GraphQL errors', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock GraphQL error response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Invalid query syntax' }],
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);

      await expect(
        client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [TEST_ACCOUNT_1])
      ).rejects.toThrow('Indexer query errors: Invalid query syntax');
    });

    it('should handle partial results (some members have grants, some do not)', async () => {
      // Mock availability check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { __typename: 'Query' } }),
      } as Response);

      // Mock response with only one account having grants
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessControlEvents: {
              nodes: [
                {
                  account: TEST_ACCOUNT_1,
                  txHash: 'only-tx',
                  timestamp: '2024-01-15T10:00:00Z',
                  blockHeight: '5000',
                },
              ],
            },
          },
        }),
      } as Response);

      const client = new StellarIndexerClient(mockNetworkConfig);
      const result = await client.queryLatestGrants(TEST_CONTRACT, TEST_ROLE, [
        TEST_ACCOUNT_1,
        TEST_ACCOUNT_2,
      ]);

      expect(result.size).toBe(1);
      expect(result.has(TEST_ACCOUNT_1)).toBe(true);
      expect(result.has(TEST_ACCOUNT_2)).toBe(false);
    });
  });
});
