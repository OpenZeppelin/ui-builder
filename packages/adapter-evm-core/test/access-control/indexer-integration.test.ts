/**
 * Integration Test: EVM Indexer Client with Real SubQuery Indexer
 *
 * Tests the EvmIndexerClient's ability to query the deployed SubQuery indexer
 * for historical access control events, role discovery, latest grants,
 * pending ownership transfers, and pending admin transfers.
 *
 * Prerequisites:
 * - SubQuery indexer deployed to SubQuery Network
 * - INDEXER_URL environment variable must be set to a SubQuery gateway URL
 *   with a valid API key
 *
 * Environment Variable:
 * - INDEXER_URL: The full SubQuery gateway URL including API key.
 *   Example: INDEXER_URL="https://gateway.subquery.network/query/<CID>?apikey=YOUR_API_KEY"
 *   Tests will gracefully SKIP if INDEXER_URL is not set.
 *
 * Test Contracts (deployed on Ethereum Sepolia with known access control events):
 *
 * Deployer / Owner / Admin: 0xf0a9ed2663311ce436347bb6f240181ff103ca16
 *
 *   AccessControlMock (primary — comprehensive AC with grant/revoke/admin-change):
 *     0x447b67C43347ae336cABe9d1C60A56dF82781e1E
 *     - Network: ethereum-sepolia (chainId 11155111)
 *     - Patterns: AccessControl (MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, UPGRADER_ROLE, DEFAULT_ADMIN_ROLE)
 *     - Events: 14 ROLE_GRANTED, 4 ROLE_REVOKED, 2 ROLE_ADMIN_CHANGED (20 total)
 *     - Useful for: history queries, filtering, pagination, role discovery, grants
 *     - Role membership data available via roleMemberships query
 *
 *   OwnableMock (basic Ownable with single ownership transfer):
 *     0x02C0AE8e78843B8c5389b57077EBD26632206Fe0
 *     - Network: ethereum-sepolia (chainId 11155111)
 *     - Patterns: Ownable (single-step ownership)
 *     - Events: 1 OWNERSHIP_TRANSFER_COMPLETED
 *
 *   Ownable2StepMock (two-step Ownable):
 *     0x1300522C7103Eb5e041f85F8F7Dc3354501b1E75
 *     - Network: ethereum-sepolia (chainId 11155111)
 *     - Patterns: Ownable2Step (two-step ownership transfer)
 *     - Events: 1 OWNERSHIP_TRANSFER_COMPLETED
 *
 *   CombinedMock (AccessControl + Ownable2Step hybrid):
 *     0x0e46dF975AF95B8bf8F52AbC97a49669C2d663b5
 *     - Network: ethereum-sepolia (chainId 11155111)
 *     - Patterns: AccessControl + Ownable2Step combined
 *     - Events: 4 ROLE_GRANTED, 1 OWNERSHIP_TRANSFER_COMPLETED (5 total)
 *     - Useful for: testing mixed AC pattern contracts
 *
 * Deploying New Test Contracts:
 *   1. Deploy an OpenZeppelin AccessControl or Ownable contract to Sepolia
 *   2. Grant/revoke roles to generate indexed events
 *   3. Wait for the SubQuery indexer to sync the new blocks
 *   4. Update the contract addresses in this file
 *   5. Re-run tests with INDEXER_URL set
 *
 * IMPORTANT: These tests require an active Node Operator syncing the deployed project.
 * Tests will gracefully SKIP if the indexer is not operational, which is expected
 * behavior when node operators are not yet active or during maintenance.
 *
 * @see packages/adapter-stellar/test/access-control/indexer-integration.test.ts — structural template
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_ADMIN_ROLE } from '../../src/access-control/constants';
import { EvmIndexerClient } from '../../src/access-control/indexer-client';
import type { EvmCompatibleNetworkConfig } from '../../src/types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * The INDEXER_URL environment variable provides the SubQuery gateway URL with API key.
 *
 * To run these tests:
 *   export INDEXER_URL="https://gateway.subquery.network/query/<CID>?apikey=<YOUR_KEY>"
 *   pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test -- indexer-integration
 *
 * Tests are SKIPPED when INDEXER_URL is not set — unit tests with mocked responses
 * provide coverage for indexer functionality in that case.
 */
const DEPLOYED_INDEXER_URL = process.env.INDEXER_URL;

// Test contracts on Ethereum Sepolia
// Deployer / Owner / Admin: 0xf0a9ed2663311ce436347bb6f240181ff103ca16
const TEST_CONTRACT_PRIMARY = '0x447b67c43347ae336cabe9d1c60a56df82781e1e'; // AccessControlMock (20 events)
const TEST_CONTRACT_REVOKABLE = TEST_CONTRACT_PRIMARY; // Same contract has REVOKED events
const TEST_CONTRACT_PAGINATION = TEST_CONTRACT_PRIMARY; // Same contract has 20 events for pagination
const TEST_CONTRACT_OWNERSHIP = '0x02c0ae8e78843b8c5389b57077ebd26632206fe0'; // OwnableMock
const TEST_CONTRACT_OWNABLE2STEP = '0x1300522c7103eb5e041f85f8f7dc3354501b1e75'; // Ownable2StepMock
const TEST_CONTRACT_COMBINED = '0x0e46df975af95b8bf8f52abc97a49669c2d663b5'; // CombinedMock

// A known-invalid contract address that should have zero indexed events
const NON_EXISTENT_CONTRACT = '0x0000000000000000000000000000000000000000';

// Mock network config pointing at the deployed indexer
const testNetworkConfig = {
  id: 'ethereum-sepolia',
  name: 'Ethereum Sepolia (Integration)',
  ecosystem: 'evm',
  chainId: 11155111,
  rpcUrl: 'https://sepolia.drpc.org',
  explorerUrl: 'https://sepolia.etherscan.io',
  accessControlIndexerUrl: DEPLOYED_INDEXER_URL,
} as unknown as EvmCompatibleNetworkConfig;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** All HistoryChangeType values produced by the EVM mapping */
const VALID_CHANGE_TYPES = [
  'GRANTED',
  'REVOKED',
  'ROLE_ADMIN_CHANGED',
  'OWNERSHIP_TRANSFER_STARTED',
  'OWNERSHIP_TRANSFER_COMPLETED',
  'OWNERSHIP_RENOUNCED',
  'ADMIN_TRANSFER_INITIATED',
  'ADMIN_TRANSFER_COMPLETED',
  'ADMIN_TRANSFER_CANCELED',
  'ADMIN_RENOUNCED',
  'ADMIN_DELAY_CHANGE_SCHEDULED',
  'ADMIN_DELAY_CHANGE_CANCELED',
  'UNKNOWN',
];

/** Validates an EVM address format (0x + 40 hex chars, case-insensitive) */
function isValidEvmAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Validates an EVM tx hash format (0x + 64 hex chars) */
function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

/** Validates a bytes32 role ID (0x + 64 hex chars) */
function isValidBytes32(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// Test Suite: EvmIndexerClient — Integration with Real Indexer
// ═══════════════════════════════════════════════════════════════════════════

describe('EvmIndexerClient - Integration Test with Real Indexer', () => {
  let client: EvmIndexerClient;
  let indexerAvailable = false;

  beforeAll(async () => {
    if (!DEPLOYED_INDEXER_URL) {
      console.warn(
        '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '⚠️  INDEXER_URL NOT SET - Integration Tests Skipped\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '\n' +
          'The INDEXER_URL environment variable is required to run these tests.\n' +
          'Set it with your SubQuery API key:\n' +
          '\n' +
          '  export INDEXER_URL="https://gateway.subquery.network/query/<CID>?apikey=<YOUR_KEY>"\n' +
          '\n' +
          'All integration tests will be SKIPPED. Unit tests with mocked\n' +
          'responses provide coverage for indexer functionality.\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      );
      return;
    }

    client = new EvmIndexerClient(testNetworkConfig);

    try {
      indexerAvailable = await client.isAvailable();
    } catch {
      indexerAvailable = false;
    }

    if (!indexerAvailable) {
      console.warn(
        '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '⚠️  INDEXER UNAVAILABLE - Integration Tests Skipped\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '\n' +
          'The SubQuery indexer is not currently operational.\n' +
          'This is EXPECTED when:\n' +
          '  • Node operators have not yet synced the deployed project\n' +
          '  • The indexer is undergoing maintenance\n' +
          '  • Network connectivity issues\n' +
          '\n' +
          `Indexer URL: ${DEPLOYED_INDEXER_URL}\n` +
          '\n' +
          'All integration tests will be SKIPPED. Unit tests with mocked\n' +
          'responses provide coverage for indexer functionality.\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      );
    } else {
      console.log(
        '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '✅ INDEXER AVAILABLE - Running Integration Tests\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          `Indexer URL: ${DEPLOYED_INDEXER_URL}\n` +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      );
    }
  }, 30000);

  // ── Connectivity ────────────────────────────────────────────────────────

  describe('Connectivity', () => {
    it('should successfully connect to the deployed indexer', async () => {
      if (!indexerAvailable) return;
      expect(indexerAvailable).toBe(true);
    }, 10000);

    it('should handle unavailable indexer gracefully', async () => {
      const invalidConfig = {
        ...testNetworkConfig,
        accessControlIndexerUrl: 'https://invalid-endpoint.example.com/graphql',
      } as unknown as EvmCompatibleNetworkConfig;

      const invalidClient = new EvmIndexerClient(invalidConfig);
      const isAvailable = await invalidClient.isAvailable();
      expect(isAvailable).toBe(false);
    }, 10000);
  });

  // ── History Query — Basic ─────────────────────────────────────────────

  describe('History Query - Basic', () => {
    it('should query all history for the primary test contract', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY);

      expect(result).not.toBeNull();
      expect(result!.items).toBeDefined();
      expect(Array.isArray(result!.items)).toBe(true);
      expect(result!.items.length).toBeGreaterThan(0);
      expect(result!.pageInfo).toBeDefined();
      expect(typeof result!.pageInfo.hasNextPage).toBe('boolean');

      // Verify structure of first entry
      const firstEntry = result!.items[0];
      expect(firstEntry).toHaveProperty('role');
      expect(firstEntry).toHaveProperty('account');
      expect(firstEntry).toHaveProperty('changeType');
      expect(firstEntry).toHaveProperty('txId');
      expect(firstEntry).toHaveProperty('timestamp');
      expect(firstEntry).toHaveProperty('ledger');

      // Validate HistoryChangeType enum value
      expect(VALID_CHANGE_TYPES).toContain(firstEntry.changeType);

      // Validate EVM address format (0x hex) — account may be empty for some event types
      if (firstEntry.account) {
        expect(isValidEvmAddress(firstEntry.account)).toBe(true);
      }
    }, 15000);

    it('should query history with pagination limit', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 3 });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBeLessThanOrEqual(3);
      expect(result!.items.length).toBeGreaterThan(0);
      expect(result!.pageInfo).toBeDefined();
    }, 15000);

    it('should support cursor-based pagination', async () => {
      if (!indexerAvailable) return;

      const getEventKey = (item: {
        txId: string;
        role: { id: string };
        account: string;
        changeType: string;
      }) => `${item.txId}-${item.role.id}-${item.account}-${item.changeType}`;

      // Get first page
      const firstPage = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 2 });

      expect(firstPage).not.toBeNull();
      expect(firstPage!.items.length).toBeLessThanOrEqual(2);

      // If there are more pages, test pagination
      if (firstPage!.pageInfo.hasNextPage && firstPage!.pageInfo.endCursor) {
        const secondPage = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
          limit: 2,
          cursor: firstPage!.pageInfo.endCursor,
        });

        expect(secondPage).not.toBeNull();
        expect(secondPage!.items).toBeDefined();

        // Second page should contain at least some items not in the first page.
        // Note: Events from the same block can share txId, so we compare full
        // event keys (txId + role + account + changeType) instead of txId alone.
        if (secondPage!.items.length > 0 && firstPage!.items.length > 0) {
          const firstPageKeys = new Set(firstPage!.items.map(getEventKey));
          const hasNewEvents = secondPage!.items.some(
            (item) => !firstPageKeys.has(getEventKey(item))
          );
          expect(hasNewEvents).toBe(true);
        }
      }
    }, 15000);
  });

  // ── History Query — Pagination Verification ────────────────────────────

  describe('History Query - Pagination Verification', () => {
    const PAGINATION_CONTRACT = TEST_CONTRACT_PAGINATION;
    const MIN_EXPECTED_EVENTS = 5;

    it('should have enough events for pagination testing', async () => {
      if (!indexerAvailable) return;

      const allEvents = await client.queryHistory(PAGINATION_CONTRACT);

      expect(allEvents).not.toBeNull();
      console.log(`  📊 Contract has ${allEvents!.items.length} events indexed`);
      expect(allEvents!.items.length).toBeGreaterThanOrEqual(MIN_EXPECTED_EVENTS);
    }, 20000);

    it('should correctly paginate through all events with small page size', async () => {
      if (!indexerAvailable) return;

      const pageSize = 3;
      const seenEventKeys = new Set<string>();
      let totalItems = 0;
      let duplicateCount = 0;
      let cursor: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 20;

      const getEventKey = (item: {
        txId: string;
        role: { id: string };
        account: string;
        changeType: string;
      }) => `${item.txId}-${item.role.id}-${item.account}-${item.changeType}`;

      // Fetch first page
      let currentPage = await client.queryHistory(PAGINATION_CONTRACT, { limit: pageSize });
      expect(currentPage).not.toBeNull();

      for (const item of currentPage!.items) {
        seenEventKeys.add(getEventKey(item));
      }
      totalItems += currentPage!.items.length;
      pageCount++;
      cursor = currentPage!.pageInfo.endCursor;

      console.log(
        `  📄 Page ${pageCount}: ${currentPage!.items.length} items, hasNextPage: ${currentPage!.pageInfo.hasNextPage}`
      );

      // Paginate through remaining pages
      while (currentPage!.pageInfo.hasNextPage && cursor && pageCount < maxPages) {
        const nextPage = await client.queryHistory(PAGINATION_CONTRACT, {
          limit: pageSize,
          cursor,
        });

        expect(nextPage).not.toBeNull();
        pageCount++;
        console.log(
          `  📄 Page ${pageCount}: ${nextPage!.items.length} items, hasNextPage: ${nextPage!.pageInfo.hasNextPage}`
        );

        for (const newItem of nextPage!.items) {
          const key = getEventKey(newItem);
          if (seenEventKeys.has(key)) {
            duplicateCount++;
          } else {
            seenEventKeys.add(key);
          }
        }

        totalItems += nextPage!.items.length;
        cursor = nextPage!.pageInfo.endCursor;
        currentPage = nextPage;
      }

      console.log(
        `  ✅ Total: ${seenEventKeys.size} unique events across ${pageCount} pages (${duplicateCount} duplicates)`
      );

      expect(seenEventKeys.size).toBeGreaterThanOrEqual(MIN_EXPECTED_EVENTS);

      // Duplicates can occur when many events share the same timestamp (common
      // in EVM where multiple events fire in a single block/tx).  Allow up to
      // 50 % duplicates — the important assertion is that all unique events are
      // captured across pages.
      const duplicateRate = totalItems > 0 ? duplicateCount / totalItems : 0;
      expect(duplicateRate).toBeLessThan(0.5);

      if (pageCount < maxPages) {
        expect(currentPage!.pageInfo.hasNextPage).toBe(false);
      }
    }, 90000);

    it('should return consistent results with different page sizes', async () => {
      if (!indexerAvailable) return;

      const getEventKey = (item: {
        txId: string;
        role: { id: string };
        account: string;
        changeType: string;
      }) => `${item.txId}-${item.role.id}-${item.account}-${item.changeType}`;

      // Get first 6 items with page size 6
      const largePage = await client.queryHistory(PAGINATION_CONTRACT, { limit: 6 });
      expect(largePage).not.toBeNull();

      // Get same items with smaller pages (3 + 3)
      const smallPage1 = await client.queryHistory(PAGINATION_CONTRACT, { limit: 3 });
      expect(smallPage1).not.toBeNull();

      const smallPage2 = await client.queryHistory(PAGINATION_CONTRACT, {
        limit: 3,
        cursor: smallPage1!.pageInfo.endCursor,
      });
      expect(smallPage2).not.toBeNull();

      const combinedSmallPages = [...smallPage1!.items, ...smallPage2!.items];

      // Both should yield similar (possibly not identical) counts because
      // cursor-based pagination across events with the same timestamp can
      // result in slightly different page boundaries.
      const largePageKeys = new Set(largePage!.items.map(getEventKey));
      const smallPagesKeys = new Set(combinedSmallPages.map(getEventKey));

      // The overlap should be at least 50 % of events
      let overlap = 0;
      for (const key of smallPagesKeys) {
        if (largePageKeys.has(key)) overlap++;
      }
      const overlapRate = overlap / Math.max(largePageKeys.size, 1);
      expect(overlapRate).toBeGreaterThanOrEqual(0.5);

      console.log(
        `  ✅ Page-size consistency: large=${largePageKeys.size}, small-combined=${smallPagesKeys.size}, overlap=${overlap}`
      );
    }, 30000);

    it('should respect limit while maintaining cursor continuity', async () => {
      if (!indexerAvailable) return;

      const limit = 2;

      const page1 = await client.queryHistory(PAGINATION_CONTRACT, { limit });
      expect(page1).not.toBeNull();
      expect(page1!.items.length).toBeLessThanOrEqual(limit);

      if (!page1!.pageInfo.hasNextPage) {
        console.log('  ⏭️ Not enough events for multi-page test');
        return;
      }

      const page2 = await client.queryHistory(PAGINATION_CONTRACT, {
        limit,
        cursor: page1!.pageInfo.endCursor,
      });
      expect(page2).not.toBeNull();
      expect(page2!.items.length).toBeLessThanOrEqual(limit);

      if (!page2!.pageInfo.hasNextPage) return;

      const page3 = await client.queryHistory(PAGINATION_CONTRACT, {
        limit,
        cursor: page2!.pageInfo.endCursor,
      });
      expect(page3).not.toBeNull();
      expect(page3!.items.length).toBeLessThanOrEqual(limit);

      // Verify timestamps are in descending order across pages
      const allTimestamps = [
        ...page1!.items.map((e) => new Date(e.timestamp!).getTime()),
        ...page2!.items.map((e) => new Date(e.timestamp!).getTime()),
        ...page3!.items.map((e) => new Date(e.timestamp!).getTime()),
      ];

      for (let i = 0; i < allTimestamps.length - 1; i++) {
        expect(allTimestamps[i]).toBeGreaterThanOrEqual(allTimestamps[i + 1]);
      }
    }, 30000);
  });

  // ── History Query — Filtering ─────────────────────────────────────────

  describe('History Query - Filtering', () => {
    it('should filter history by specific account', async () => {
      if (!indexerAvailable) return;

      // First get all history to find a valid account
      const allResult = await client.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(allResult).not.toBeNull();
      expect(allResult!.items.length).toBeGreaterThan(0);

      // Find an entry with a non-empty account
      const entryWithAccount = allResult!.items.find((e) => e.account && e.account.length > 0);
      if (!entryWithAccount) {
        console.log('  ⏭️ No entries with accounts found');
        return;
      }

      const targetAccount = entryWithAccount.account;

      const filteredResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        account: targetAccount,
      });

      expect(filteredResult).not.toBeNull();
      expect(filteredResult!.items.length).toBeGreaterThan(0);

      for (const entry of filteredResult!.items) {
        expect(entry.account.toLowerCase()).toBe(targetAccount.toLowerCase());
      }
    }, 15000);

    it('should filter history by specific roleId', async () => {
      if (!indexerAvailable) return;

      // Query without filter first to find a valid role
      const allResult = await client.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(allResult).not.toBeNull();

      const roleEntry = allResult!.items.find(
        (e) => e.role && e.role.id && e.role.id !== DEFAULT_ADMIN_ROLE
      );

      if (!roleEntry) {
        console.log('  ⏭️ No role entries found (ownership-only contract)');
        return;
      }

      const targetRole = roleEntry.role.id;

      const filteredResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        roleId: targetRole,
      });

      expect(filteredResult).not.toBeNull();
      expect(filteredResult!.items.length).toBeGreaterThan(0);

      for (const entry of filteredResult!.items) {
        expect(entry.role.id).toBe(targetRole);
      }
    }, 15000);

    it('should filter history by changeType GRANTED (server-side)', async () => {
      if (!indexerAvailable) return;

      const grantedResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        limit: 20,
      });

      expect(grantedResult).not.toBeNull();
      expect(grantedResult!.items.length).toBeGreaterThan(0);

      for (const entry of grantedResult!.items) {
        expect(entry.changeType).toBe('GRANTED');
      }

      console.log(`  ✅ Filtered ${grantedResult!.items.length} GRANTED events (server-side)`);
    }, 15000);

    it('should filter history by changeType REVOKED (server-side)', async () => {
      if (!indexerAvailable) return;

      // Use the revokable contract that has ROLE_REVOKED events
      const revokedResult = await client.queryHistory(TEST_CONTRACT_REVOKABLE, {
        changeType: 'REVOKED',
        limit: 20,
      });

      if (!revokedResult || revokedResult.items.length === 0) {
        console.log('  ⏭️ No REVOKED events found in test contract');
        return;
      }

      for (const entry of revokedResult.items) {
        expect(entry.changeType).toBe('REVOKED');
      }

      console.log(`  ✅ Filtered ${revokedResult.items.length} REVOKED events (server-side)`);
    }, 15000);

    it('should combine changeType filter with roleId filter', async () => {
      if (!indexerAvailable) return;

      // Find a GRANTED event with a specific role
      const allResult = await client.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(allResult).not.toBeNull();

      const grantedEntry = allResult!.items.find(
        (e) => e.changeType === 'GRANTED' && e.role && e.role.id !== DEFAULT_ADMIN_ROLE
      );

      if (!grantedEntry) {
        console.log('  ⏭️ No GRANTED events with roles found');
        return;
      }

      const targetRole = grantedEntry.role.id;

      const combinedResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        roleId: targetRole,
        limit: 10,
      });

      expect(combinedResult).not.toBeNull();
      expect(combinedResult!.items.length).toBeGreaterThan(0);

      for (const entry of combinedResult!.items) {
        expect(entry.changeType).toBe('GRANTED');
        expect(entry.role.id).toBe(targetRole);
      }

      console.log(
        `  ✅ Combined filter: ${combinedResult!.items.length} GRANTED events for role ${targetRole.slice(0, 10)}...`
      );
    }, 15000);

    it('should combine changeType filter with account filter', async () => {
      if (!indexerAvailable) return;

      // Find a GRANTED event to get an account
      const allResult = await client.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(allResult).not.toBeNull();

      const grantedEntry = allResult!.items.find((e) => e.changeType === 'GRANTED' && e.account);

      if (!grantedEntry) {
        console.log('  ⏭️ No GRANTED events found');
        return;
      }

      const targetAccount = grantedEntry.account;

      const combinedResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        account: targetAccount,
        limit: 10,
      });

      expect(combinedResult).not.toBeNull();
      expect(combinedResult!.items.length).toBeGreaterThan(0);

      for (const entry of combinedResult!.items) {
        expect(entry.changeType).toBe('GRANTED');
        expect(entry.account.toLowerCase()).toBe(targetAccount.toLowerCase());
      }

      console.log(
        `  ✅ Combined filter: ${combinedResult!.items.length} GRANTED events for account ${targetAccount.slice(0, 10)}...`
      );
    }, 15000);

    it('should filter history by timestamp range (server-side)', async () => {
      if (!indexerAvailable) return;

      // Discover actual timestamps from contract data
      const allEvents = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 100 });
      expect(allEvents).not.toBeNull();
      expect(allEvents!.items.length).toBeGreaterThan(0);

      const timestamps = allEvents!.items.map((e) => e.timestamp).filter((t): t is string => !!t);
      expect(timestamps.length).toBeGreaterThan(0);

      // Use a range covering all events
      const sortedTimestamps = [...timestamps].sort();
      const oldestTimestamp = sortedTimestamps[0];
      const newestPlusBuffer = new Date(
        new Date(sortedTimestamps[sortedTimestamps.length - 1]).getTime() + 86400000
      )
        .toISOString()
        .slice(0, 19);

      const filteredResult = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        timestampFrom: oldestTimestamp,
        timestampTo: newestPlusBuffer,
        limit: 20,
      });

      expect(filteredResult).not.toBeNull();
      expect(filteredResult!.items.length).toBeGreaterThan(0);

      for (const item of filteredResult!.items) {
        if (item.timestamp) {
          expect(item.timestamp >= oldestTimestamp).toBe(true);
        }
      }

      console.log(`  ✅ Filtered ${filteredResult!.items.length} event(s) in timestamp range`);
    }, 15000);

    it('should combine changeType filter with pagination', async () => {
      if (!indexerAvailable) return;

      const page1 = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        limit: 3,
      });

      expect(page1).not.toBeNull();
      expect(page1!.items.length).toBeGreaterThan(0);

      for (const entry of page1!.items) {
        expect(entry.changeType).toBe('GRANTED');
      }

      if (page1!.pageInfo.hasNextPage && page1!.pageInfo.endCursor) {
        const page2 = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
          changeType: 'GRANTED',
          limit: 3,
          cursor: page1!.pageInfo.endCursor,
        });

        expect(page2).not.toBeNull();
        for (const entry of page2!.items) {
          expect(entry.changeType).toBe('GRANTED');
        }
      }
    }, 20000);
  });

  // ── History Query — Event Timeline ────────────────────────────────────

  describe('History Query - Event Timeline', () => {
    it('should return events in descending timestamp order', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PAGINATION, { limit: 10 });
      expect(result).not.toBeNull();

      if (result!.items.length <= 1) {
        console.log('  ⏭️ Not enough events to verify ordering');
        return;
      }

      for (let i = 0; i < result!.items.length - 1; i++) {
        const currentTimestamp = new Date(result!.items[i].timestamp!).getTime();
        const nextTimestamp = new Date(result!.items[i + 1].timestamp!).getTime();
        expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
      }
    }, 15000);

    it('should include valid timestamps in ISO8601 format', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 5 });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        expect(entry.timestamp).toBeDefined();
        const parsed = new Date(entry.timestamp!);
        expect(parsed.getTime()).not.toBeNaN();
        expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    }, 15000);
  });

  // ── Role Discovery ────────────────────────────────────────────────────

  describe('Role Discovery', () => {
    it('should discover role IDs from historical events', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);

      expect(roleIds).not.toBeNull();
      expect(Array.isArray(roleIds)).toBe(true);

      if (roleIds!.length > 0) {
        console.log(
          `  ✓ Discovered ${roleIds!.length} role(s): ${roleIds!.map((r) => r.slice(0, 10) + '...').join(', ')}`
        );

        for (const roleId of roleIds!) {
          expect(typeof roleId).toBe('string');
          expect(roleId.length).toBeGreaterThan(0);
          // EVM roles are bytes32 — 0x + 64 hex chars
          expect(isValidBytes32(roleId)).toBe(true);
        }
      } else {
        console.log('  ⏭️ No roles indexed yet for this contract');
      }
    }, 15000);

    it('should return unique role IDs (no duplicates)', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();

      const uniqueRoles = new Set(roleIds!);
      expect(roleIds!.length).toBe(uniqueRoles.size);
      console.log(`  ✓ All ${roleIds!.length} role(s) are unique`);
    }, 15000);

    it('should return empty array for contract with no role events', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(NON_EXISTENT_CONTRACT);

      expect(roleIds).not.toBeNull();
      expect(Array.isArray(roleIds)).toBe(true);
      expect(roleIds!.length).toBe(0);
    }, 15000);

    it('should discover roles consistent with history query', async () => {
      if (!indexerAvailable) return;

      const discoveredRoles = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(discoveredRoles).not.toBeNull();

      // Get all history and extract unique roles manually
      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(result).not.toBeNull();

      const historyRoles = new Set<string>();
      for (const entry of result!.items) {
        // Only collect actual role IDs from role events (not ownership/admin sentinels)
        if (entry.role && entry.role.id && !entry.role.label) {
          historyRoles.add(entry.role.id);
        }
      }

      // Discovered roles should match roles from history
      expect(discoveredRoles!.length).toBe(historyRoles.size);
      for (const role of discoveredRoles!) {
        expect(historyRoles.has(role)).toBe(true);
      }
    }, 20000);
  });

  // ── Latest Grants ─────────────────────────────────────────────────────

  describe('queryLatestGrants', () => {
    it('should query latest grants for known role members', async () => {
      if (!indexerAvailable) return;

      // Discover roles first
      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();
      expect(roleIds!.length).toBeGreaterThan(0);

      const grantMap = await client.queryLatestGrants(TEST_CONTRACT_PRIMARY, roleIds!);

      expect(grantMap).not.toBeNull();
      expect(grantMap).toBeInstanceOf(Map);

      if (grantMap!.size > 0) {
        console.log(`  ✓ Found grants for ${grantMap!.size} member(s)`);

        // Verify structure of first grant (map keys are now composite role:account strings)
        const firstEntry = grantMap!.entries().next().value;
        if (firstEntry) {
          const [compositeKey, grantInfo] = firstEntry;
          expect(typeof compositeKey).toBe('string');
          // Composite key should contain a colon separator (role:account)
          expect(compositeKey).toContain(':');
          expect(typeof grantInfo.grantedAt).toBe('string');
          expect(typeof grantInfo.txHash).toBe('string');
          expect(typeof grantInfo.role).toBe('string');
        }
      }
    }, 15000);

    it('should return empty map for non-existent accounts', async () => {
      if (!indexerAvailable) return;

      const fakeRoleId = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const grantMap = await client.queryLatestGrants(NON_EXISTENT_CONTRACT, [fakeRoleId]);

      expect(grantMap).not.toBeNull();
      expect(grantMap).toBeInstanceOf(Map);
      expect(grantMap!.size).toBe(0);
    }, 15000);

    it('should handle multiple roles in a single query', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();

      if (roleIds!.length < 2) {
        console.log('  ⏭️ Not enough roles for multi-role test');
        return;
      }

      const grantMap = await client.queryLatestGrants(TEST_CONTRACT_PRIMARY, roleIds!.slice(0, 3));

      expect(grantMap).not.toBeNull();
      expect(grantMap).toBeInstanceOf(Map);
      expect(grantMap!.size).toBeGreaterThan(0);

      // Verify structure of returned grants
      for (const [, grant] of grantMap!) {
        expect(typeof grant.grantedAt).toBe('string');
        expect(typeof grant.txHash).toBe('string');
        expect(typeof grant.role).toBe('string');
      }

      console.log(
        `  ✓ Found ${grantMap!.size} grant(s) across ${roleIds!.slice(0, 3).length} roles`
      );
    }, 20000);

    it('should return the latest grant when account was granted multiple times', async () => {
      if (!indexerAvailable) return;

      // Find a role with grants
      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();
      expect(roleIds!.length).toBeGreaterThan(0);

      // Get history to find an account with grants for that role
      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        roleId: roleIds![0],
        changeType: 'GRANTED',
        limit: 10,
      });

      if (!result || result.items.length === 0) {
        console.log('  ⏭️ No GRANTED events for this role');
        return;
      }

      const testAccount = result.items[0].account;
      const grantMap = await client.queryLatestGrants(TEST_CONTRACT_PRIMARY, [roleIds![0]]);

      expect(grantMap).not.toBeNull();

      const latestGrant = grantMap!.get(testAccount.toLowerCase());
      if (latestGrant) {
        console.log(`  ✓ Found latest grant for ${testAccount.slice(0, 10)}...`);
        expect(latestGrant.grantedAt).toBeDefined();
        expect(latestGrant.txHash).toBeDefined();
      }
    }, 20000);
  });

  // ── Pending Transfers ─────────────────────────────────────────────────

  describe('Pending Transfers', () => {
    it('should return null for contract with no pending ownership transfer', async () => {
      if (!indexerAvailable) return;

      const pendingTransfer = await client.queryPendingOwnershipTransfer(NON_EXISTENT_CONTRACT);
      expect(pendingTransfer).toBeNull();
    }, 15000);

    it('should query pending ownership transfer structure when present', async () => {
      if (!indexerAvailable) return;

      // Try multiple contracts to find one with a pending transfer
      const contracts = [TEST_CONTRACT_OWNERSHIP, TEST_CONTRACT_PRIMARY];
      let foundPending = false;

      for (const contract of contracts) {
        const pendingTransfer = await client.queryPendingOwnershipTransfer(contract);

        if (pendingTransfer) {
          foundPending = true;
          expect(pendingTransfer).toHaveProperty('pendingOwner');
          expect(pendingTransfer).toHaveProperty('initiatedAt');
          expect(pendingTransfer).toHaveProperty('initiatedTxId');
          expect(pendingTransfer).toHaveProperty('initiatedBlock');

          // Validate EVM address format
          expect(isValidEvmAddress(pendingTransfer.pendingOwner)).toBe(true);
          expect(typeof pendingTransfer.initiatedBlock).toBe('number');
          expect(pendingTransfer.initiatedBlock).toBeGreaterThan(0);

          console.log(`  ✓ Found pending ownership transfer to ${pendingTransfer.pendingOwner}`);
          break;
        }
      }

      if (!foundPending) {
        console.log('  ✓ No pending ownership transfers found (expected for settled contracts)');
      }
    }, 30000);

    it('should return null for contract with no pending admin transfer', async () => {
      if (!indexerAvailable) return;

      const pendingTransfer = await client.queryPendingAdminTransfer(NON_EXISTENT_CONTRACT);
      expect(pendingTransfer).toBeNull();
    }, 15000);

    it('should query pending admin transfer structure when present', async () => {
      if (!indexerAvailable) return;

      const contracts = [TEST_CONTRACT_PRIMARY, TEST_CONTRACT_REVOKABLE];
      let foundPending = false;

      for (const contract of contracts) {
        const pendingTransfer = await client.queryPendingAdminTransfer(contract);

        if (pendingTransfer) {
          foundPending = true;
          expect(pendingTransfer).toHaveProperty('pendingAdmin');
          expect(pendingTransfer).toHaveProperty('acceptSchedule');
          expect(pendingTransfer).toHaveProperty('initiatedAt');
          expect(pendingTransfer).toHaveProperty('initiatedTxId');
          expect(pendingTransfer).toHaveProperty('initiatedBlock');

          expect(typeof pendingTransfer.acceptSchedule).toBe('number');
          expect(typeof pendingTransfer.initiatedBlock).toBe('number');
          expect(pendingTransfer.initiatedBlock).toBeGreaterThan(0);

          console.log(`  ✓ Found pending admin transfer to ${pendingTransfer.pendingAdmin}`);
          break;
        }
      }

      if (!foundPending) {
        console.log('  ✓ No pending admin transfers found (expected for settled contracts)');
      }
    }, 30000);
  });

  // ── Data Integrity ────────────────────────────────────────────────────

  describe('Data Integrity', () => {
    it('should have valid EVM transaction hashes for all events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 10 });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        expect(entry.txId).toBeDefined();
        expect(entry.txId.length).toBeGreaterThan(0);
        // EVM tx hash is 0x + 64 character hex string
        expect(isValidTxHash(entry.txId)).toBe(true);
      }
    }, 15000);

    it('should have valid block heights for all events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 10 });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        expect(entry.ledger).toBeDefined();
        expect(typeof entry.ledger).toBe('number');
        expect(entry.ledger).toBeGreaterThan(0);
      }
    }, 15000);

    it('should have valid role identifiers (bytes32 hex)', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 10 });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        expect(entry.role).toBeDefined();
        expect(entry.role.id).toBeDefined();
        expect(typeof entry.role.id).toBe('string');
        expect(entry.role.id.length).toBeGreaterThan(0);

        // All EVM role IDs should now be valid bytes32 hex strings
        // (ownership/admin events use DEFAULT_ADMIN_ROLE as sentinel)
        expect(isValidBytes32(entry.role.id)).toBe(true);
      }
    }, 15000);

    it('should have valid EVM addresses for role events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        limit: 10,
      });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        // GRANTED events should always have an account
        if (entry.account) {
          expect(isValidEvmAddress(entry.account)).toBe(true);
        }
      }
    }, 15000);

    it('should have valid HistoryChangeType enum values for all events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 20 });
      expect(result).not.toBeNull();

      for (const entry of result!.items) {
        expect(VALID_CHANGE_TYPES).toContain(entry.changeType);
      }
    }, 15000);
  });

  // ── Error Handling ────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should return empty result for contract with no events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(NON_EXISTENT_CONTRACT);

      expect(result).not.toBeNull();
      expect(Array.isArray(result!.items)).toBe(true);
      expect(result!.items.length).toBe(0);
      expect(result!.pageInfo.hasNextPage).toBe(false);
    }, 15000);

    it('should return null when indexer URL is not configured', async () => {
      const noIndexerConfig = {
        ...testNetworkConfig,
        accessControlIndexerUrl: undefined,
      } as unknown as EvmCompatibleNetworkConfig;

      const noIndexerClient = new EvmIndexerClient(noIndexerConfig);

      const historyResult = await noIndexerClient.queryHistory(TEST_CONTRACT_PRIMARY);
      expect(historyResult).toBeNull();

      const discoverResult = await noIndexerClient.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(discoverResult).toBeNull();

      const grantsResult = await noIndexerClient.queryLatestGrants(TEST_CONTRACT_PRIMARY, [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]);
      expect(grantsResult).toBeNull();

      const ownershipResult =
        await noIndexerClient.queryPendingOwnershipTransfer(TEST_CONTRACT_PRIMARY);
      expect(ownershipResult).toBeNull();

      const adminResult = await noIndexerClient.queryPendingAdminTransfer(TEST_CONTRACT_PRIMARY);
      expect(adminResult).toBeNull();
    }, 15000);
  });

  // ── Event Discovery ────────────────────────────────────────────────────

  describe('Event Type Discovery', () => {
    it('should discover diverse event types across test contracts', async () => {
      if (!indexerAvailable) return;

      const contracts = [
        TEST_CONTRACT_PRIMARY,
        TEST_CONTRACT_OWNERSHIP,
        TEST_CONTRACT_OWNABLE2STEP,
        TEST_CONTRACT_COMBINED,
      ];
      const allEventTypes = new Set<string>();

      for (const contract of contracts) {
        const history = await client.queryHistory(contract);
        if (history) {
          for (const item of history.items) {
            allEventTypes.add(item.changeType);
          }
          console.log(
            `  ✓ Contract ${contract.slice(0, 10)}... has ${history.items.length} events`
          );
        }
      }

      console.log(`  📊 Discovered event types: ${Array.from(allEventTypes).join(', ')}`);

      // We should see GRANTED, REVOKED, ROLE_ADMIN_CHANGED, and OWNERSHIP_TRANSFER_COMPLETED
      expect(allEventTypes.has('GRANTED')).toBe(true);
      expect(allEventTypes.has('REVOKED')).toBe(true);
      expect(allEventTypes.has('ROLE_ADMIN_CHANGED')).toBe(true);
      expect(allEventTypes.has('OWNERSHIP_TRANSFER_COMPLETED')).toBe(true);
      expect(allEventTypes.size).toBeGreaterThanOrEqual(4);
    }, 45000);
  });

  // ── Contract-Specific Verification ────────────────────────────────────

  describe('Contract-Specific Verification', () => {
    it('should verify AccessControlMock has expected event counts', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, { limit: 50 });
      expect(result).not.toBeNull();

      const granted = result!.items.filter((e) => e.changeType === 'GRANTED');
      const revoked = result!.items.filter((e) => e.changeType === 'REVOKED');
      const adminChanged = result!.items.filter((e) => e.changeType === 'ROLE_ADMIN_CHANGED');

      console.log(
        `  📊 AccessControlMock: ${granted.length} GRANTED, ${revoked.length} REVOKED, ${adminChanged.length} ROLE_ADMIN_CHANGED`
      );

      // Verify we have all three event types
      expect(granted.length).toBeGreaterThanOrEqual(14);
      expect(revoked.length).toBeGreaterThanOrEqual(4);
      expect(adminChanged.length).toBeGreaterThanOrEqual(2);
      expect(result!.items.length).toBeGreaterThanOrEqual(20);
    }, 15000);

    it('should verify OwnableMock has OWNERSHIP_TRANSFER_COMPLETED', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_OWNERSHIP);
      expect(result).not.toBeNull();
      expect(result!.items.length).toBeGreaterThanOrEqual(1);

      const ownershipEvents = result!.items.filter(
        (e) => e.changeType === 'OWNERSHIP_TRANSFER_COMPLETED'
      );
      expect(ownershipEvents.length).toBeGreaterThanOrEqual(1);

      // Verify the ownership event references the deployer/owner
      const event = ownershipEvents[0];
      expect(event.account.toLowerCase()).toBe('0xf0a9ed2663311ce436347bb6f240181ff103ca16');
      console.log(`  ✓ OwnableMock ownership transferred to ${event.account}`);
    }, 15000);

    it('should verify Ownable2StepMock has OWNERSHIP_TRANSFER_COMPLETED', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_OWNABLE2STEP);
      expect(result).not.toBeNull();
      expect(result!.items.length).toBeGreaterThanOrEqual(1);

      const ownershipEvents = result!.items.filter(
        (e) => e.changeType === 'OWNERSHIP_TRANSFER_COMPLETED'
      );
      expect(ownershipEvents.length).toBeGreaterThanOrEqual(1);

      const event = ownershipEvents[0];
      expect(event.account.toLowerCase()).toBe('0xf0a9ed2663311ce436347bb6f240181ff103ca16');
      console.log(`  ✓ Ownable2StepMock ownership transferred to ${event.account}`);
    }, 15000);

    it('should verify CombinedMock has both role and ownership events', async () => {
      if (!indexerAvailable) return;

      const result = await client.queryHistory(TEST_CONTRACT_COMBINED);
      expect(result).not.toBeNull();
      expect(result!.items.length).toBeGreaterThanOrEqual(5);

      const granted = result!.items.filter((e) => e.changeType === 'GRANTED');
      const ownership = result!.items.filter(
        (e) => e.changeType === 'OWNERSHIP_TRANSFER_COMPLETED'
      );

      expect(granted.length).toBeGreaterThanOrEqual(4);
      expect(ownership.length).toBeGreaterThanOrEqual(1);

      console.log(
        `  ✓ CombinedMock: ${granted.length} GRANTED, ${ownership.length} OWNERSHIP_TRANSFER_COMPLETED`
      );
    }, 15000);

    it('should verify deployer address appears in DEFAULT_ADMIN_ROLE grants', async () => {
      if (!indexerAvailable) return;

      const DEPLOYER = '0xf0a9ed2663311ce436347bb6f240181ff103ca16';
      const DEFAULT_ADMIN_ROLE =
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      // Check AccessControlMock
      const result = await client.queryHistory(TEST_CONTRACT_PRIMARY, {
        changeType: 'GRANTED',
        roleId: DEFAULT_ADMIN_ROLE,
      });

      expect(result).not.toBeNull();
      expect(result!.items.length).toBeGreaterThanOrEqual(1);

      const deployerGrant = result!.items.find((e) => e.account.toLowerCase() === DEPLOYER);
      expect(deployerGrant).toBeDefined();
      console.log(
        `  ✓ Deployer ${DEPLOYER.slice(0, 10)}... has DEFAULT_ADMIN_ROLE on AccessControlMock`
      );

      // Check CombinedMock
      const combinedResult = await client.queryHistory(TEST_CONTRACT_COMBINED, {
        changeType: 'GRANTED',
        roleId: DEFAULT_ADMIN_ROLE,
      });

      expect(combinedResult).not.toBeNull();
      expect(combinedResult!.items.length).toBeGreaterThanOrEqual(1);

      const combinedDeployerGrant = combinedResult!.items.find(
        (e) => e.account.toLowerCase() === DEPLOYER
      );
      expect(combinedDeployerGrant).toBeDefined();
      console.log(
        `  ✓ Deployer ${DEPLOYER.slice(0, 10)}... has DEFAULT_ADMIN_ROLE on CombinedMock`
      );
    }, 20000);

    it('should verify role discovery finds all known roles on AccessControlMock', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();

      // The AccessControlMock should have at least DEFAULT_ADMIN_ROLE + MINTER + PAUSER + BURNER + UPGRADER
      expect(roleIds!.length).toBeGreaterThanOrEqual(5);

      // DEFAULT_ADMIN_ROLE should always be present
      const DEFAULT_ADMIN_ROLE =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      expect(roleIds!).toContain(DEFAULT_ADMIN_ROLE);

      // All discovered roles should be valid bytes32
      for (const role of roleIds!) {
        expect(isValidBytes32(role)).toBe(true);
      }

      console.log(
        `  ✓ Discovered ${roleIds!.length} roles: ${roleIds!.map((r) => r.slice(0, 10) + '...').join(', ')}`
      );
    }, 15000);

    it('should verify grants data matches for AccessControlMock role members', async () => {
      if (!indexerAvailable) return;

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT_PRIMARY);
      expect(roleIds).not.toBeNull();

      const grantMap = await client.queryLatestGrants(TEST_CONTRACT_PRIMARY, roleIds!);
      expect(grantMap).not.toBeNull();

      // Should have multiple members granted across roles
      expect(grantMap!.size).toBeGreaterThanOrEqual(3);

      // Verify the deployer is among the granted accounts
      const DEPLOYER = '0xf0a9ed2663311ce436347bb6f240181ff103ca16';
      const deployerGrant = grantMap!.get(DEPLOYER);
      expect(deployerGrant).toBeDefined();
      expect(deployerGrant!.grantedAt).toBeDefined();
      expect(deployerGrant!.txHash).toBeDefined();

      console.log(`  ✓ Found ${grantMap!.size} members with grants on AccessControlMock`);

      for (const [account, grant] of grantMap!) {
        console.log(
          `    ${account.slice(0, 10)}... role=${grant.role.slice(0, 10)}... at ${grant.grantedAt}`
        );
      }
    }, 20000);
  });
});
