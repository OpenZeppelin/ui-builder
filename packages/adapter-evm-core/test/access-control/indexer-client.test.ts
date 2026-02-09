/**
 * Indexer Client Tests for EVM Access Control (Phase 4 — Constructor + Availability + Pending Transfer Suites)
 *
 * Tests the EvmIndexerClient class for endpoint resolution, health checking,
 * pending ownership transfer queries, and pending admin transfer queries.
 *
 * @see quickstart.md §Step 4
 * @see contracts/indexer-queries.graphql §GetPendingOwnershipTransfer + §GetPendingAdminTransfer
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocking
import { createIndexerClient, EvmIndexerClient } from '../../src/access-control/indexer-client';
import type { EvmCompatibleNetworkConfig } from '../../src/types';

// ---------------------------------------------------------------------------
// Mock fetch before importing the module under test
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDEXER_URL = 'https://indexer.example.com/graphql';
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNetworkConfig(
  overrides: Partial<EvmCompatibleNetworkConfig> = {}
): EvmCompatibleNetworkConfig {
  return {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    ecosystem: 'evm',
    chainId: 1,
    rpcUrl: 'https://rpc.example.com',
    explorerUrl: 'https://etherscan.io',
    accessControlIndexerUrl: INDEXER_URL,
    ...overrides,
  } as unknown as EvmCompatibleNetworkConfig;
}

function createNetworkConfigNoIndexer(): EvmCompatibleNetworkConfig {
  return {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    ecosystem: 'evm',
    chainId: 1,
    rpcUrl: 'https://rpc.example.com',
    explorerUrl: 'https://etherscan.io',
  } as unknown as EvmCompatibleNetworkConfig;
}

function mockFetchSuccess(data: unknown): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  });
}

function mockFetchHealthy(): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { __typename: 'Query' } }),
  });
}

function mockFetchError(status = 500): void {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
  });
}

function mockFetchNetworkError(): void {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EvmIndexerClient', () => {
  let client: EvmIndexerClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new EvmIndexerClient(createNetworkConfig());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Constructor & Factory ──────────────────────────────────────────────

  describe('constructor', () => {
    it('should create a client with network config', () => {
      const newClient = new EvmIndexerClient(createNetworkConfig());
      expect(newClient).toBeInstanceOf(EvmIndexerClient);
    });

    it('should create a client via createIndexerClient factory', () => {
      const newClient = createIndexerClient(createNetworkConfig());
      expect(newClient).toBeInstanceOf(EvmIndexerClient);
    });
  });

  // ── Endpoint Resolution ────────────────────────────────────────────────

  describe('endpoint resolution', () => {
    it('should use accessControlIndexerUrl from network config', async () => {
      mockFetchHealthy();

      const result = await client.isAvailable();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        INDEXER_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return unavailable when no indexer URL is configured', async () => {
      const noIndexerClient = new EvmIndexerClient(createNetworkConfigNoIndexer());

      const result = await noIndexerClient.isAvailable();

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── isAvailable ────────────────────────────────────────────────────────

  describe('isAvailable', () => {
    it('should return true when indexer endpoint responds successfully', async () => {
      mockFetchHealthy();

      const result = await client.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when indexer endpoint returns error status', async () => {
      mockFetchError(500);

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when fetch throws network error', async () => {
      mockFetchNetworkError();

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('should cache availability result after first check', async () => {
      mockFetchHealthy();

      const result1 = await client.isAvailable();
      const result2 = await client.isAvailable();

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Only one fetch call — cached after first check
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should send a health check query ({ __typename })', async () => {
      mockFetchHealthy();

      await client.isAvailable();

      expect(mockFetch).toHaveBeenCalledWith(
        INDEXER_URL,
        expect.objectContaining({
          body: expect.stringContaining('__typename'),
        })
      );
    });
  });

  // ── queryPendingOwnershipTransfer ──────────────────────────────────────

  describe('queryPendingOwnershipTransfer', () => {
    it('should return pending ownership transfer data when available', async () => {
      // Health check
      mockFetchHealthy();

      // Query result
      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'event-1',
              eventType: 'OWNERSHIP_TRANSFER_STARTED',
              blockNumber: '12345',
              timestamp: '2026-01-15T10:00:00Z',
              txHash: '0xabc123',
              newOwner: '0xNewOwner000000000000000000000000000000aa',
            },
          ],
        },
      });

      const result = await client.queryPendingOwnershipTransfer(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!.pendingOwner).toBe('0xNewOwner000000000000000000000000000000aa');
      expect(result!.initiatedAt).toBe('2026-01-15T10:00:00Z');
      expect(result!.initiatedTxId).toBe('0xabc123');
      expect(result!.initiatedBlock).toBe(12345);
    });

    it('should return null when no pending transfer exists', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
        },
      });

      const result = await client.queryPendingOwnershipTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when indexer is unavailable', async () => {
      mockFetchError(500);

      const result = await client.queryPendingOwnershipTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should use networkConfig.id (kebab-case) as the network filter value (FR-027)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: { nodes: [] },
      });

      await client.queryPendingOwnershipTransfer(CONTRACT_ADDRESS);

      // The second fetch call (after health check) should include the network ID in variables
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.network).toBe('ethereum-mainnet');
      expect(secondCallBody.variables.contract).toBe(CONTRACT_ADDRESS);
    });
  });

  // ── queryPendingAdminTransfer ──────────────────────────────────────────

  describe('queryPendingAdminTransfer', () => {
    it('should return pending admin transfer data when available', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'event-2',
              eventType: 'DEFAULT_ADMIN_TRANSFER_SCHEDULED',
              blockNumber: '67890',
              timestamp: '2026-01-20T14:00:00Z',
              txHash: '0xdef456',
              newAdmin: '0xNewAdmin000000000000000000000000000000bb',
              acceptSchedule: '1700000000',
            },
          ],
        },
      });

      const result = await client.queryPendingAdminTransfer(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!.pendingAdmin).toBe('0xNewAdmin000000000000000000000000000000bb');
      expect(result!.acceptSchedule).toBe(1700000000);
      expect(result!.initiatedAt).toBe('2026-01-20T14:00:00Z');
      expect(result!.initiatedTxId).toBe('0xdef456');
      expect(result!.initiatedBlock).toBe(67890);
    });

    it('should return null when no pending admin transfer exists', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: { nodes: [] },
      });

      const result = await client.queryPendingAdminTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when indexer is unavailable', async () => {
      mockFetchError(500);

      const result = await client.queryPendingAdminTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should gracefully handle fetch errors', async () => {
      mockFetchHealthy();
      mockFetchNetworkError();

      const result = await client.queryPendingAdminTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });
  });

  // ── queryLatestGrants (Phase 5 — US3) ───────────────────────────────

  describe('queryLatestGrants', () => {
    const ROLE_ID_MINTER = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    const ROLE_ID_PAUSER = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a';

    it('should return grant data for role members', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        roleMemberships: {
          nodes: [
            {
              role: ROLE_ID_MINTER,
              account: '0xMember1000000000000000000000000000000001',
              grantedAt: '2026-01-10T08:00:00Z',
              grantedBy: '0xGranter0000000000000000000000000000000001',
              txHash: '0xgrant1',
            },
            {
              role: ROLE_ID_MINTER,
              account: '0xMember2000000000000000000000000000000002',
              grantedAt: '2026-01-12T12:00:00Z',
              grantedBy: '0xGranter0000000000000000000000000000000001',
              txHash: '0xgrant2',
            },
          ],
        },
      });

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      expect(result).not.toBeNull();
      expect(result!.size).toBe(2);
    });

    it('should return empty map when no grant data exists', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        roleMemberships: {
          nodes: [],
        },
      });

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      expect(result).not.toBeNull();
      expect(result!.size).toBe(0);
    });

    it('should return null when indexer is unavailable', async () => {
      mockFetchError(500);

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      expect(result).toBeNull();
    });

    it('should handle multiple role IDs', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        roleMemberships: {
          nodes: [
            {
              role: ROLE_ID_MINTER,
              account: '0xMember1000000000000000000000000000000001',
              grantedAt: '2026-01-10T08:00:00Z',
              grantedBy: '0xGranter0000000000000000000000000000000001',
              txHash: '0xgrant1',
            },
            {
              role: ROLE_ID_PAUSER,
              account: '0xMember3000000000000000000000000000000003',
              grantedAt: '2026-01-11T09:00:00Z',
              grantedBy: '0xGranter0000000000000000000000000000000001',
              txHash: '0xgrant3',
            },
          ],
        },
      });

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [
        ROLE_ID_MINTER,
        ROLE_ID_PAUSER,
      ]);

      expect(result).not.toBeNull();
      expect(result!.size).toBe(2);
    });

    it('should use networkConfig.id as the network filter value (FR-027)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        roleMemberships: { nodes: [] },
      });

      await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      // The second fetch call (after health check) should include the network ID
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.network).toBe('ethereum-mainnet');
      expect(secondCallBody.variables.contract).toBe(CONTRACT_ADDRESS);
    });

    it('should gracefully handle fetch errors', async () => {
      mockFetchHealthy();
      mockFetchNetworkError();

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      expect(result).toBeNull();
    });

    it('should handle GraphQL errors gracefully', async () => {
      mockFetchHealthy();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'some GraphQL error' }],
        }),
      });

      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, [ROLE_ID_MINTER]);

      expect(result).toBeNull();
    });

    it('should return empty map for empty roleIds array', async () => {
      // No fetch should be made for empty roleIds
      const result = await client.queryLatestGrants(CONTRACT_ADDRESS, []);

      expect(result).not.toBeNull();
      expect(result!.size).toBe(0);
    });
  });

  // ── Graceful degradation ──────────────────────────────────────────────

  describe('graceful degradation', () => {
    it('should not throw on any query when indexer is down', async () => {
      const downClient = new EvmIndexerClient(createNetworkConfig());

      // Simulate down indexer
      mockFetchNetworkError();

      await expect(downClient.isAvailable()).resolves.toBe(false);
      await expect(downClient.queryPendingOwnershipTransfer(CONTRACT_ADDRESS)).resolves.toBeNull();
      await expect(downClient.queryPendingAdminTransfer(CONTRACT_ADDRESS)).resolves.toBeNull();
    });

    it('should handle GraphQL errors gracefully for pending ownership', async () => {
      mockFetchHealthy();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'some GraphQL error' }],
        }),
      });

      const result = await client.queryPendingOwnershipTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should handle GraphQL errors gracefully for pending admin', async () => {
      mockFetchHealthy();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'some GraphQL error' }],
        }),
      });

      const result = await client.queryPendingAdminTransfer(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });
  });
});
