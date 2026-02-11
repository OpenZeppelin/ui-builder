/**
 * Indexer Client Tests for EVM Access Control
 *
 * Tests the EvmIndexerClient class for:
 * - Phase 4: Constructor, endpoint resolution, availability, pending transfer queries
 * - Phase 5: Role membership queries (queryLatestGrants)
 * - Phase 9 (US7): History queries with filtering, pagination, and event type mapping
 * - Phase 11 (US9): Role discovery via indexer (discoverRoleIds)
 *
 * @see quickstart.md §Step 4
 * @see contracts/indexer-queries.graphql §GetPendingOwnershipTransfer + §GetPendingAdminTransfer + §QueryAccessControlEvents + §DiscoverRoles
 * @see research.md §R6 — EVM event type mapping
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ADMIN_ROLE } from '../../src/access-control/constants';
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

  // ── queryHistory (Phase 9 — US7) ────────────────────────────────────

  describe('queryHistory', () => {
    it('should return paginated history events in reverse chronological order', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-3',
              eventType: 'ROLE_GRANTED',
              blockNumber: '300',
              timestamp: '2026-01-20T12:00:00Z',
              txHash: '0xhash3',
              role: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
              account: '0xAccount1000000000000000000000000000000001',
            },
            {
              id: 'evt-2',
              eventType: 'OWNERSHIP_TRANSFER_STARTED',
              blockNumber: '200',
              timestamp: '2026-01-15T08:00:00Z',
              txHash: '0xhash2',
              newOwner: '0xNewOwner000000000000000000000000000000aa',
            },
            {
              id: 'evt-1',
              eventType: 'ROLE_REVOKED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              role: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a',
              account: '0xAccount2000000000000000000000000000000002',
            },
          ],
          totalCount: 3,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(3);
      expect(result!.pageInfo.hasNextPage).toBe(false);

      // Verify reverse chronological order maintained
      expect(result!.items[0].timestamp).toBe('2026-01-20T12:00:00Z');
      expect(result!.items[2].timestamp).toBe('2026-01-10T06:00:00Z');
    });

    it('should map all 13 EVM indexer event types to HistoryChangeType (research.md §R6)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'e1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '1',
              timestamp: '2026-01-01T00:00:00Z',
              txHash: '0x1',
              role: '0x01',
              account: '0xAcc1',
            },
            {
              id: 'e2',
              eventType: 'ROLE_REVOKED',
              blockNumber: '2',
              timestamp: '2026-01-01T00:01:00Z',
              txHash: '0x2',
              role: '0x01',
              account: '0xAcc1',
            },
            {
              id: 'e3',
              eventType: 'ROLE_ADMIN_CHANGED',
              blockNumber: '3',
              timestamp: '2026-01-01T00:02:00Z',
              txHash: '0x3',
              role: '0x01',
              account: '0xAcc1',
            },
            {
              id: 'e4',
              eventType: 'OWNERSHIP_TRANSFER_STARTED',
              blockNumber: '4',
              timestamp: '2026-01-01T00:03:00Z',
              txHash: '0x4',
              newOwner: '0xNew1',
            },
            {
              id: 'e5',
              eventType: 'OWNERSHIP_TRANSFER_COMPLETED',
              blockNumber: '5',
              timestamp: '2026-01-01T00:04:00Z',
              txHash: '0x5',
              newOwner: '0xNew1',
            },
            {
              id: 'e6',
              eventType: 'OWNERSHIP_RENOUNCED',
              blockNumber: '6',
              timestamp: '2026-01-01T00:05:00Z',
              txHash: '0x6',
              newOwner: '0x0',
            },
            {
              id: 'e7',
              eventType: 'ADMIN_TRANSFER_INITIATED',
              blockNumber: '7',
              timestamp: '2026-01-01T00:06:00Z',
              txHash: '0x7',
              newAdmin: '0xAdm1',
            },
            {
              id: 'e8',
              eventType: 'ADMIN_TRANSFER_COMPLETED',
              blockNumber: '8',
              timestamp: '2026-01-01T00:07:00Z',
              txHash: '0x8',
              newAdmin: '0xAdm1',
            },
            {
              id: 'e9',
              eventType: 'ADMIN_RENOUNCED',
              blockNumber: '9',
              timestamp: '2026-01-01T00:08:00Z',
              txHash: '0x9',
              newAdmin: '0x0',
            },
            {
              id: 'e10',
              eventType: 'DEFAULT_ADMIN_TRANSFER_SCHEDULED',
              blockNumber: '10',
              timestamp: '2026-01-01T00:09:00Z',
              txHash: '0xa',
              newAdmin: '0xAdm2',
              acceptSchedule: '1700000000',
            },
            {
              id: 'e11',
              eventType: 'DEFAULT_ADMIN_TRANSFER_CANCELED',
              blockNumber: '11',
              timestamp: '2026-01-01T00:10:00Z',
              txHash: '0xb',
            },
            {
              id: 'e12',
              eventType: 'DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED',
              blockNumber: '12',
              timestamp: '2026-01-01T00:11:00Z',
              txHash: '0xc',
            },
            {
              id: 'e13',
              eventType: 'DEFAULT_ADMIN_DELAY_CHANGE_CANCELED',
              blockNumber: '13',
              timestamp: '2026-01-01T00:12:00Z',
              txHash: '0xd',
            },
          ],
          totalCount: 13,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(13);

      // Direct matches (10 types)
      expect(result!.items[0].changeType).toBe('GRANTED');
      expect(result!.items[1].changeType).toBe('REVOKED');
      expect(result!.items[2].changeType).toBe('ROLE_ADMIN_CHANGED');
      expect(result!.items[3].changeType).toBe('OWNERSHIP_TRANSFER_STARTED');
      expect(result!.items[4].changeType).toBe('OWNERSHIP_TRANSFER_COMPLETED');
      expect(result!.items[5].changeType).toBe('OWNERSHIP_RENOUNCED');
      expect(result!.items[6].changeType).toBe('ADMIN_TRANSFER_INITIATED');
      expect(result!.items[7].changeType).toBe('ADMIN_TRANSFER_COMPLETED');
      expect(result!.items[8].changeType).toBe('ADMIN_RENOUNCED');

      // EVM-specific aliases and mapped types
      expect(result!.items[9].changeType).toBe('ADMIN_TRANSFER_INITIATED'); // DEFAULT_ADMIN_TRANSFER_SCHEDULED → ADMIN_TRANSFER_INITIATED
      expect(result!.items[10].changeType).toBe('ADMIN_TRANSFER_CANCELED'); // DEFAULT_ADMIN_TRANSFER_CANCELED → ADMIN_TRANSFER_CANCELED (PR-2 done)
      expect(result!.items[11].changeType).toBe('ADMIN_DELAY_CHANGE_SCHEDULED'); // DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED → ADMIN_DELAY_CHANGE_SCHEDULED (PR-2 done)
      expect(result!.items[12].changeType).toBe('ADMIN_DELAY_CHANGE_CANCELED'); // DEFAULT_ADMIN_DELAY_CHANGE_CANCELED → ADMIN_DELAY_CHANGE_CANCELED (PR-2 done)
    });

    it('should correctly map account field for role events', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              role: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
              account: '0xTheGrantedAccount0000000000000000000000aa',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].account).toBe('0xTheGrantedAccount0000000000000000000000aa');
    });

    it('should correctly map newOwner for ownership events', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'OWNERSHIP_TRANSFER_STARTED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              newOwner: '0xNewOwner000000000000000000000000000000bb',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].account).toBe('0xNewOwner000000000000000000000000000000bb');
    });

    it('should correctly map newAdmin for admin events', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ADMIN_TRANSFER_INITIATED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              newAdmin: '0xNewAdmin000000000000000000000000000000cc',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].account).toBe('0xNewAdmin000000000000000000000000000000cc');
    });

    it('should set ledger field to parsed blockNumber', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '54321',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              role: '0x01',
              account: '0xAcc1',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].ledger).toBe(54321);
    });

    it('should use DEFAULT_ADMIN_ROLE with label "OWNER" for ownership events without a role field', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'OWNERSHIP_TRANSFER_COMPLETED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              newOwner: '0xNew1',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].role.id).toBe(DEFAULT_ADMIN_ROLE);
      expect(result!.items[0].role.label).toBe('OWNER');
    });

    it('should use DEFAULT_ADMIN_ROLE with label "DEFAULT_ADMIN_ROLE" for admin events', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ADMIN_TRANSFER_INITIATED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              newAdmin: '0xNewAdmin000000000000000000000000000000cc',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].role.id).toBe(DEFAULT_ADMIN_ROLE);
      expect(result!.items[0].role.label).toBe('DEFAULT_ADMIN_ROLE');
    });

    it('should support pagination with first/offset', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '300',
              timestamp: '2026-01-20T12:00:00Z',
              txHash: '0xhash1',
              role: '0x01',
              account: '0xAcc1',
            },
          ],
          totalCount: 50,
          pageInfo: {
            hasNextPage: true,
          },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS, {
        limit: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.pageInfo.hasNextPage).toBe(true);
    });

    it('should filter by role ID', async () => {
      mockFetchHealthy();

      const roleId = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              role: roleId,
              account: '0xAcc1',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS, {
        roleId,
      });

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);

      // Verify the query included role filter
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.role).toBe(roleId);
    });

    it('should filter by account', async () => {
      mockFetchHealthy();

      const account = '0xAccount1000000000000000000000000000000001';

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false },
        },
      });

      await client.queryHistory(CONTRACT_ADDRESS, { account });

      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.account).toBe(account);
    });

    it('should filter by event type (changeType)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false },
        },
      });

      await client.queryHistory(CONTRACT_ADDRESS, { changeType: 'GRANTED' });

      // Verify the query contains the event type filter
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.query).toContain('ROLE_GRANTED');
    });

    it('should filter by time range (timestampFrom / timestampTo)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false },
        },
      });

      await client.queryHistory(CONTRACT_ADDRESS, {
        timestampFrom: '2026-01-01T00:00:00',
        timestampTo: '2026-02-01T00:00:00',
      });

      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.timestampFrom).toBe('2026-01-01T00:00:00');
      expect(secondCallBody.variables.timestampTo).toBe('2026-02-01T00:00:00');
    });

    it('should return null when indexer is unavailable', async () => {
      mockFetchError(500);

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when indexer has no endpoint configured', async () => {
      const noIndexerClient = new EvmIndexerClient(createNetworkConfigNoIndexer());

      const result = await noIndexerClient.queryHistory(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when fetch throws a network error', async () => {
      mockFetchHealthy();
      mockFetchNetworkError();

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when GraphQL errors are returned', async () => {
      mockFetchHealthy();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'some GraphQL error' }],
        }),
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return empty items when no history events exist', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(0);
      expect(result!.pageInfo.hasNextPage).toBe(false);
    });

    it('should use networkConfig.id as network filter (FR-027)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false },
        },
      });

      await client.queryHistory(CONTRACT_ADDRESS);

      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.network).toBe('ethereum-mainnet');
      expect(secondCallBody.variables.contract).toBe(CONTRACT_ADDRESS);
    });

    it('should map UNKNOWN for completely unrecognized event types', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'COMPLETELY_NEW_UNKNOWN_TYPE',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              account: '0xAcc1',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS);

      expect(result!.items[0].changeType).toBe('UNKNOWN');
    });

    it('should support cursor-based pagination', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            {
              id: 'evt-1',
              eventType: 'ROLE_GRANTED',
              blockNumber: '100',
              timestamp: '2026-01-10T06:00:00Z',
              txHash: '0xhash1',
              role: '0x01',
              account: '0xAcc1',
            },
          ],
          totalCount: 50,
          pageInfo: {
            hasNextPage: true,
            endCursor: 'cursor-abc123',
          },
        },
      });

      const result = await client.queryHistory(CONTRACT_ADDRESS, { limit: 1 });

      expect(result).not.toBeNull();
      expect(result!.pageInfo.hasNextPage).toBe(true);
      expect(result!.pageInfo.endCursor).toBe('cursor-abc123');
    });
  });

  // ── discoverRoleIds (Phase 11 — US9) ────────────────────────────────

  describe('discoverRoleIds', () => {
    it('should return unique role IDs from historical events', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            { role: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' },
            { role: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a' },
            { role: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' },
            { role: '0x0000000000000000000000000000000000000000000000000000000000000000' },
          ],
        },
      });

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(3);
      expect(result!).toContain(
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
      expect(result!).toContain(
        '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'
      );
      expect(result!).toContain(
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      );
    });

    it('should return empty array when no events exist', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [],
        },
      });

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(0);
    });

    it('should return null when indexer is unavailable', async () => {
      mockFetchError(500);

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when no indexer endpoint is configured', async () => {
      const noIndexerClient = new EvmIndexerClient(createNetworkConfigNoIndexer());

      const result = await noIndexerClient.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when fetch throws a network error', async () => {
      mockFetchHealthy();
      mockFetchNetworkError();

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should return null when GraphQL errors are returned', async () => {
      mockFetchHealthy();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'some GraphQL error' }],
        }),
      });

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).toBeNull();
    });

    it('should filter out null/undefined/empty role values', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: {
          nodes: [
            { role: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' },
            { role: null },
            { role: undefined },
            { role: '' },
            { role: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a' },
          ],
        },
      });

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(2);
      expect(result!).toContain(
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
      expect(result!).toContain(
        '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'
      );
    });

    it('should use networkConfig.id as the network filter value (FR-027)', async () => {
      mockFetchHealthy();

      mockFetchSuccess({
        accessControlEvents: { nodes: [] },
      });

      await client.discoverRoleIds(CONTRACT_ADDRESS);

      // The second fetch call (after health check) should include the network ID in variables
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.variables.network).toBe('ethereum-mainnet');
      expect(secondCallBody.variables.contract).toBe(CONTRACT_ADDRESS);
    });

    it('should deduplicate role IDs across multiple events', async () => {
      mockFetchHealthy();

      const sameRole = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
      mockFetchSuccess({
        accessControlEvents: {
          nodes: [{ role: sameRole }, { role: sameRole }, { role: sameRole }],
        },
      });

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(1);
      expect(result![0]).toBe(sameRole);
    });

    it('should handle non-OK response gracefully', async () => {
      mockFetchHealthy();
      mockFetchError(502);

      const result = await client.discoverRoleIds(CONTRACT_ADDRESS);

      expect(result).toBeNull();
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
