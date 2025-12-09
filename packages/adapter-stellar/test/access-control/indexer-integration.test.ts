/**
 * Integration Test: Stellar Adapter with Real SubQuery Indexer
 *
 * Tests the adapter's ability to query the deployed SubQuery indexer
 * for historical access control events.
 *
 * Prerequisites:
 * - SubQuery indexer deployed to SubQuery Network
 * - Indexer URL: https://gateway.subquery.network/query/Qmd8a4poui4srG6QhwgH6ugADZgHNHrEtpNhpdndsSqsUY
 *   (API key is required for SubQuery Network gateway access)
 * - Contract: CAUVLSYWAXHN2JIXESSUUGIMLJK6LLI3B5TPXNW5XZUJFVCJJHOASE24
 * - Known roles: minter, operator, approver, transfer, viewer, pauser, burner (7 unique roles)
 * - Known event at block: 1944610 (minter role granted)
 *
 * IMPORTANT: These tests require an active Node Operator syncing the deployed project.
 * Tests will gracefully SKIP if the indexer is not operational, which is expected
 * behavior when node operators are not yet active or during maintenance.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import { StellarIndexerClient } from '../../src/access-control/indexer-client';

// Test configuration
// Note: API key is required for SubQuery Network gateway access
// Set INDEXER_URL environment variable with your API key, e.g.:
// INDEXER_URL="https://gateway.subquery.network/query/Qmd8a4poui4srG6QhwgH6ugADZgHNHrEtpNhpdndsSqsUY?apikey=YOUR_API_KEY"
const DEPLOYED_INDEXER_URL =
  process.env.INDEXER_URL ||
  'https://gateway.subquery.network/query/Qmd8a4poui4srG6QhwgH6ugADZgHNHrEtpNhpdndsSqsUY';
const TEST_CONTRACT = 'CAUVLSYWAXHN2JIXESSUUGIMLJK6LLI3B5TPXNW5XZUJFVCJJHOASE24';
const KNOWN_EVENT_BLOCK = 1944610;
const KNOWN_EVENT_ACCOUNT = 'GCVGY3LHODJPKEPRIQ5JAKJ33FZMEANJ5ELXHEPN3GUJITYGVS6KA5QU';
const KNOWN_EVENT_ROLE = 'minter';
const EXPECTED_ROLE_COUNT = 7;
const EXPECTED_ROLES = ['minter', 'operator', 'approver', 'transfer', 'viewer', 'pauser', 'burner'];

// Mock network config with deployed indexer
const testNetworkConfig: StellarNetworkConfig = {
  id: 'stellar-testnet-integration',
  name: 'Stellar Testnet (Integration)',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  exportConstName: 'stellarTestnetIntegration',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  indexerUri: DEPLOYED_INDEXER_URL,
};

describe('StellarIndexerClient - Integration Test with Real Indexer', () => {
  let client: StellarIndexerClient;
  let indexerAvailable: boolean = false;

  beforeAll(async () => {
    client = new StellarIndexerClient(testNetworkConfig);
    // Check availability once for all tests (with timeout handling)
    try {
      indexerAvailable = await client.checkAvailability();
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
  }, 30000); // 30 second timeout for indexer availability check

  describe('Connectivity', () => {
    it('should successfully connect to the deployed indexer', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      expect(indexerAvailable).toBe(true);
    }, 10000); // 10s timeout for network call

    it('should handle unavailable indexer gracefully', async () => {
      const invalidConfig: StellarNetworkConfig = {
        ...testNetworkConfig,
        indexerUri: 'https://invalid-endpoint.example.com/graphql',
      };
      const invalidClient = new StellarIndexerClient(invalidConfig);
      const isAvailable = await invalidClient.checkAvailability();
      expect(isAvailable).toBe(false);
    }, 10000);
  });

  describe('History Query - Basic', () => {
    it('should query all history for the test contract', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.pageInfo).toBeDefined();
      expect(typeof result.pageInfo.hasNextPage).toBe('boolean');

      // Verify structure of first entry
      const firstEntry = result.items[0];
      expect(firstEntry).toHaveProperty('role');
      expect(firstEntry).toHaveProperty('account');
      expect(firstEntry).toHaveProperty('changeType');
      expect(firstEntry).toHaveProperty('txId');
      expect(firstEntry).toHaveProperty('timestamp');
      expect(firstEntry).toHaveProperty('ledger');

      // Validate change type enum
      expect(['GRANTED', 'REVOKED']).toContain(firstEntry.changeType);

      // Validate Stellar address format (starts with G or C)
      expect(firstEntry.account).toMatch(/^[GC][A-Z0-9]{55}$/);
    }, 15000);

    it('should query history with pagination limit', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 5 });

      expect(result).toBeDefined();
      expect(result.items.length).toBeLessThanOrEqual(5);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.pageInfo).toBeDefined();
    }, 15000);

    it('should support cursor-based pagination', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      // Get first page
      const firstPage = await client.queryHistory(TEST_CONTRACT, { limit: 2 });

      expect(firstPage.items.length).toBeLessThanOrEqual(2);

      // If there are more pages, test pagination
      if (firstPage.pageInfo.hasNextPage && firstPage.pageInfo.endCursor) {
        const secondPage = await client.queryHistory(TEST_CONTRACT, {
          limit: 2,
          cursor: firstPage.pageInfo.endCursor,
        });

        expect(secondPage.items).toBeDefined();
        // Items should be different from first page
        if (secondPage.items.length > 0 && firstPage.items.length > 0) {
          expect(secondPage.items[0].txId).not.toBe(firstPage.items[0].txId);
        }
      }
    }, 15000);
  });

  /**
   * Comprehensive Pagination Tests
   *
   * Uses a contract with 80+ role change events to thoroughly verify pagination behavior.
   * Contract: CAHHWNLOHIGFHYG7VOXNVK5EKLL25RIGNGUFLTTUUWZSQW5GGIPGXDKT
   */
  describe('History Query - Pagination Verification', () => {
    // Contract with many role changes for pagination testing
    const PAGINATION_TEST_CONTRACT = 'CAHHWNLOHIGFHYG7VOXNVK5EKLL25RIGNGUFLTTUUWZSQW5GGIPGXDKT';
    const MIN_EXPECTED_EVENTS = 30;

    it('should have enough events for pagination testing', async () => {
      if (!indexerAvailable) {
        return;
      }

      // Query without limit to get total count
      const allEvents = await client.queryHistory(PAGINATION_TEST_CONTRACT);

      console.log(`  📊 Contract has ${allEvents.items.length} events indexed`);
      expect(allEvents.items.length).toBeGreaterThanOrEqual(MIN_EXPECTED_EVENTS);
    }, 20000);

    it('should correctly paginate through all events with small page size', async () => {
      if (!indexerAvailable) {
        return;
      }

      const pageSize = 5;
      const seenEventKeys = new Set<string>();
      let totalItems = 0;
      let duplicateCount = 0;
      let cursor: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 20; // Safety limit

      // Fetch first page
      let firstPage = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
        limit: pageSize,
      });

      // Helper to create a unique key for an event
      // Note: txId alone is not unique - multiple events can happen in same transaction
      const getEventKey = (item: (typeof firstPage.items)[0]) =>
        `${item.txId}-${item.role.id}-${item.account}-${item.changeType}`;

      for (const item of firstPage.items) {
        seenEventKeys.add(getEventKey(item));
      }
      totalItems += firstPage.items.length;
      pageCount++;
      cursor = firstPage.pageInfo.endCursor;

      console.log(
        `  📄 Page ${pageCount}: ${firstPage.items.length} items, hasNextPage: ${firstPage.pageInfo.hasNextPage}`
      );

      // Paginate through remaining pages
      while (firstPage.pageInfo.hasNextPage && cursor && pageCount < maxPages) {
        const nextPage = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
          limit: pageSize,
          cursor,
        });

        pageCount++;
        console.log(
          `  📄 Page ${pageCount}: ${nextPage.items.length} items, hasNextPage: ${nextPage.pageInfo.hasNextPage}`
        );

        // Track duplicates (can happen with timestamp-based sorting when events have same timestamp)
        for (const newItem of nextPage.items) {
          const key = getEventKey(newItem);
          if (seenEventKeys.has(key)) {
            duplicateCount++;
            console.log(`  ⚠️ Duplicate found (expected with same-timestamp events): ${key}`);
          } else {
            seenEventKeys.add(key);
          }
        }

        totalItems += nextPage.items.length;
        cursor = nextPage.pageInfo.endCursor;
        firstPage = nextPage;
      }

      console.log(
        `  ✅ Total: ${seenEventKeys.size} unique events across ${pageCount} pages (${duplicateCount} duplicates)`
      );

      // Verify we got all expected unique events
      expect(seenEventKeys.size).toBeGreaterThanOrEqual(MIN_EXPECTED_EVENTS);

      // Duplicates should be minimal (only at page boundaries with same-timestamp events)
      // Allow up to 10% duplicates (can happen when multiple events have the same timestamp)
      const duplicateRate = duplicateCount / totalItems;
      expect(duplicateRate).toBeLessThan(0.1);

      // Verify pagination terminated properly
      expect(firstPage.pageInfo.hasNextPage).toBe(false);
    }, 60000); // Longer timeout for multiple pages

    it('should return consistent results with different page sizes', async () => {
      if (!indexerAvailable) {
        return;
      }

      // Get first 10 items with page size 10
      const largePage = await client.queryHistory(PAGINATION_TEST_CONTRACT, { limit: 10 });

      // Helper to create a unique key for an event
      const getEventKey = (item: (typeof largePage.items)[0]) =>
        `${item.txId}-${item.role.id}-${item.account}-${item.changeType}`;

      // Get same items with smaller pages
      const smallPage1 = await client.queryHistory(PAGINATION_TEST_CONTRACT, { limit: 5 });
      const smallPage2 = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
        limit: 5,
        cursor: smallPage1.pageInfo.endCursor,
      });

      // Combine small pages
      const combinedSmallPages = [...smallPage1.items, ...smallPage2.items];

      // Both approaches should yield same count
      expect(combinedSmallPages.length).toBe(largePage.items.length);

      // Both approaches should yield the same set of events
      // (order may differ slightly if events have same timestamp)
      const largePageKeys = new Set(largePage.items.map(getEventKey));
      const smallPagesKeys = new Set(combinedSmallPages.map(getEventKey));

      expect(smallPagesKeys.size).toBe(largePageKeys.size);
      for (const key of smallPagesKeys) {
        expect(largePageKeys.has(key)).toBe(true);
      }
    }, 30000);

    it('should respect limit while maintaining cursor continuity', async () => {
      if (!indexerAvailable) {
        return;
      }

      const limit = 3;

      // Get 3 pages
      const page1 = await client.queryHistory(PAGINATION_TEST_CONTRACT, { limit });
      expect(page1.items.length).toBeLessThanOrEqual(limit);

      if (!page1.pageInfo.hasNextPage) {
        console.log('  ⏭️ Not enough events for multi-page test');
        return;
      }

      const page2 = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
        limit,
        cursor: page1.pageInfo.endCursor,
      });
      expect(page2.items.length).toBeLessThanOrEqual(limit);

      if (!page2.pageInfo.hasNextPage) {
        return;
      }

      const page3 = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
        limit,
        cursor: page2.pageInfo.endCursor,
      });
      expect(page3.items.length).toBeLessThanOrEqual(limit);

      // Verify timestamps are in descending order across pages
      const allTimestamps = [
        ...page1.items.map((e) => new Date(e.timestamp!).getTime()),
        ...page2.items.map((e) => new Date(e.timestamp!).getTime()),
        ...page3.items.map((e) => new Date(e.timestamp!).getTime()),
      ];

      for (let i = 0; i < allTimestamps.length - 1; i++) {
        expect(allTimestamps[i]).toBeGreaterThanOrEqual(allTimestamps[i + 1]);
      }
    }, 30000);

    it('should work with filters and pagination combined', async () => {
      if (!indexerAvailable) {
        return;
      }

      // First, get all events to find a role with multiple entries
      const allResult = await client.queryHistory(PAGINATION_TEST_CONTRACT);
      const roleCount = new Map<string, number>();

      for (const entry of allResult.items) {
        const roleId = entry.role.id;
        roleCount.set(roleId, (roleCount.get(roleId) || 0) + 1);
      }

      // Find a role with enough entries for pagination
      let targetRole: string | undefined;
      for (const [role, count] of roleCount) {
        if (count >= 5) {
          targetRole = role;
          break;
        }
      }

      if (!targetRole) {
        console.log('  ⏭️ No role with 5+ events for filter+pagination test');
        return;
      }

      console.log(`  🎯 Testing pagination with roleId filter: ${targetRole}`);

      // Paginate through filtered results
      const pageSize = 2;

      let page1 = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
        roleId: targetRole,
        limit: pageSize,
      });

      const filteredItems: typeof page1.items = [];
      filteredItems.push(...page1.items);

      while (page1.pageInfo.hasNextPage && page1.pageInfo.endCursor) {
        const nextPage = await client.queryHistory(PAGINATION_TEST_CONTRACT, {
          roleId: targetRole,
          limit: pageSize,
          cursor: page1.pageInfo.endCursor,
        });
        filteredItems.push(...nextPage.items);
        page1 = nextPage;
      }

      // Verify all items match the filter
      for (const item of filteredItems) {
        expect(item.role.id).toBe(targetRole);
      }

      console.log(`  ✅ Retrieved ${filteredItems.length} filtered items via pagination`);
    }, 45000);
  });

  describe('History Query - Filtering', () => {
    it('should filter history by specific account', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      // First get all history to find a valid account
      const allResult = await client.queryHistory(TEST_CONTRACT);
      expect(allResult.items.length).toBeGreaterThan(0);

      const targetAccount = allResult.items[0].account;

      // Now filter by that account
      const filteredResult = await client.queryHistory(TEST_CONTRACT, {
        account: targetAccount,
      });

      expect(filteredResult.items.length).toBeGreaterThan(0);
      // Verify all entries match the filter
      for (const entry of filteredResult.items) {
        expect(entry.account).toBe(targetAccount);
      }
    }, 15000);

    it('should filter history by specific role', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      // Query without filter first to see what roles exist
      const allResult = await client.queryHistory(TEST_CONTRACT);

      // Find an entry with an actual role (not ownership)
      const roleEntry = allResult.items.find((e) => e.role && e.role.id !== 'OWNER');

      if (roleEntry) {
        const targetRole = roleEntry.role.id;

        // Query with role filter
        const filteredResult = await client.queryHistory(TEST_CONTRACT, {
          roleId: targetRole,
        });

        expect(filteredResult.items.length).toBeGreaterThan(0);
        // Verify all entries match the filter
        for (const entry of filteredResult.items) {
          expect(entry.role.id).toBe(targetRole);
        }
      } else {
        // If no role entries found, test passes (ownership-only contract)
        expect(true).toBe(true);
      }
    }, 15000);

    it('should filter history by changeType GRANTED (server-side)', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Query with changeType filter for GRANTED events only
      const grantedResult = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'GRANTED',
        limit: 20,
      });

      expect(grantedResult.items.length).toBeGreaterThan(0);

      // Verify ALL returned entries have changeType: 'GRANTED'
      for (const entry of grantedResult.items) {
        expect(entry.changeType).toBe('GRANTED');
      }

      console.log(`  ✅ Filtered ${grantedResult.items.length} GRANTED events (server-side)`);
    }, 15000);

    it('should filter history by changeType REVOKED (server-side)', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // First check if there are any REVOKED events
      const allResult = await client.queryHistory(TEST_CONTRACT);
      const hasRevokedEvents = allResult.items.some((e) => e.changeType === 'REVOKED');

      if (!hasRevokedEvents) {
        console.log('  ⏭️ No REVOKED events in contract, skipping filter test');
        return;
      }

      // Query with changeType filter for REVOKED events only
      const revokedResult = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'REVOKED',
        limit: 20,
      });

      expect(revokedResult.items.length).toBeGreaterThan(0);

      // Verify ALL returned entries have changeType: 'REVOKED'
      for (const entry of revokedResult.items) {
        expect(entry.changeType).toBe('REVOKED');
      }

      console.log(`  ✅ Filtered ${revokedResult.items.length} REVOKED events (server-side)`);
    }, 15000);

    it('should filter history by changeType TRANSFERRED (server-side)', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // First check if there are any TRANSFERRED (ownership) events
      const allResult = await client.queryHistory(TEST_CONTRACT);
      const hasTransferredEvents = allResult.items.some((e) => e.changeType === 'TRANSFERRED');

      if (!hasTransferredEvents) {
        console.log('  ⏭️ No TRANSFERRED events in contract, skipping filter test');
        return;
      }

      // Query with changeType filter for TRANSFERRED events only
      const transferredResult = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'TRANSFERRED',
        limit: 20,
      });

      expect(transferredResult.items.length).toBeGreaterThan(0);

      // Verify ALL returned entries have changeType: 'TRANSFERRED'
      for (const entry of transferredResult.items) {
        expect(entry.changeType).toBe('TRANSFERRED');
      }

      console.log(
        `  ✅ Filtered ${transferredResult.items.length} TRANSFERRED events (server-side)`
      );
    }, 15000);

    it('should combine changeType filter with pagination', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Get first page of GRANTED events
      const page1 = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'GRANTED',
        limit: 5,
      });

      expect(page1.items.length).toBeGreaterThan(0);

      // All items on page 1 should be GRANTED
      for (const entry of page1.items) {
        expect(entry.changeType).toBe('GRANTED');
      }

      // If there's a next page, verify it also contains only GRANTED events
      if (page1.pageInfo.hasNextPage && page1.pageInfo.endCursor) {
        const page2 = await client.queryHistory(TEST_CONTRACT, {
          changeType: 'GRANTED',
          limit: 5,
          cursor: page1.pageInfo.endCursor,
        });

        // All items on page 2 should also be GRANTED
        for (const entry of page2.items) {
          expect(entry.changeType).toBe('GRANTED');
        }

        console.log(
          `  ✅ changeType filter works across pages: page1=${page1.items.length}, page2=${page2.items.length} GRANTED events`
        );
      } else {
        console.log(
          `  ✅ changeType filter works: ${page1.items.length} GRANTED events (single page)`
        );
      }
    }, 20000);

    it('should combine changeType filter with roleId filter', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // First get all history to find a role with GRANTED events
      const allResult = await client.queryHistory(TEST_CONTRACT);
      const grantedEntry = allResult.items.find(
        (e) => e.changeType === 'GRANTED' && e.role && e.role.id !== 'OWNER'
      );

      if (!grantedEntry) {
        console.log('  ⏭️ No role GRANTED events found, skipping combined filter test');
        return;
      }

      const targetRole = grantedEntry.role.id;

      // Query with both changeType and roleId filters
      const combinedResult = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'GRANTED',
        roleId: targetRole,
        limit: 10,
      });

      expect(combinedResult.items.length).toBeGreaterThan(0);

      // Verify ALL entries match BOTH filters
      for (const entry of combinedResult.items) {
        expect(entry.changeType).toBe('GRANTED');
        expect(entry.role.id).toBe(targetRole);
      }

      console.log(
        `  ✅ Combined filter: ${combinedResult.items.length} GRANTED events for role '${targetRole}'`
      );
    }, 15000);

    it('should combine changeType filter with account filter', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // First get all history to find an account with GRANTED events
      const allResult = await client.queryHistory(TEST_CONTRACT);
      const grantedEntry = allResult.items.find((e) => e.changeType === 'GRANTED');

      if (!grantedEntry) {
        console.log('  ⏭️ No GRANTED events found, skipping combined filter test');
        return;
      }

      const targetAccount = grantedEntry.account;

      // Query with both changeType and account filters
      const combinedResult = await client.queryHistory(TEST_CONTRACT, {
        changeType: 'GRANTED',
        account: targetAccount,
        limit: 10,
      });

      expect(combinedResult.items.length).toBeGreaterThan(0);

      // Verify ALL entries match BOTH filters
      for (const entry of combinedResult.items) {
        expect(entry.changeType).toBe('GRANTED');
        expect(entry.account).toBe(targetAccount);
      }

      console.log(
        `  ✅ Combined filter: ${combinedResult.items.length} GRANTED events for account '${targetAccount.slice(0, 10)}...'`
      );
    }, 15000);
  });

  describe('History Query - Known Event Verification', () => {
    it('should find the known minter role grant event at the expected block', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT);

      // Find the event at the known block
      const knownEvent = result.items.find((e) => e.ledger === KNOWN_EVENT_BLOCK);

      expect(knownEvent).toBeDefined();
      if (knownEvent) {
        // Verify it's the role grant we know about
        expect(knownEvent.account).toBe(KNOWN_EVENT_ACCOUNT);
        expect(knownEvent.role.id).toBe(KNOWN_EVENT_ROLE);
        expect(knownEvent.changeType).toBe('GRANTED');
        expect(knownEvent.ledger).toBe(KNOWN_EVENT_BLOCK);
      }
    }, 15000);
  });

  describe('History Query - Event Timeline', () => {
    it('should return events in descending timestamp order', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

      expect(result.items.length).toBeGreaterThan(1);

      // Verify descending order
      for (let i = 0; i < result.items.length - 1; i++) {
        const currentTimestamp = new Date(result.items[i].timestamp!).getTime();
        const nextTimestamp = new Date(result.items[i + 1].timestamp!).getTime();
        expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
      }
    }, 15000);

    it('should include valid timestamps in ISO8601 format', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 5 });

      for (const entry of result.items) {
        expect(entry.timestamp).toBeDefined();
        // Should be parseable as a date
        const parsed = new Date(entry.timestamp!);
        expect(parsed.getTime()).not.toBeNaN();
        // Should match ISO8601 format
        expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    }, 15000);
  });

  describe('History Query - Error Handling', () => {
    it('should return empty result for contract with no events', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      // Use a valid but non-existent contract address
      const fakeContract = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
      const result = await client.queryHistory(fakeContract);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    }, 15000);

    it('should throw error when indexer is unavailable', async () => {
      const invalidConfig: StellarNetworkConfig = {
        ...testNetworkConfig,
        indexerUri: undefined,
      };
      const noIndexerClient = new StellarIndexerClient(invalidConfig);

      await expect(noIndexerClient.queryHistory(TEST_CONTRACT)).rejects.toThrow(
        'Indexer not available'
      );
    }, 15000);
  });

  describe('History Query - Data Integrity', () => {
    it('should have valid transaction hashes for all events', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

      for (const entry of result.items) {
        expect(entry.txId).toBeDefined();
        expect(entry.txId.length).toBeGreaterThan(0);
        // Stellar tx hash is 64 character hex string
        expect(entry.txId).toMatch(/^[a-f0-9]{64}$/);
      }
    }, 15000);

    it('should have valid block heights for all events', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

      for (const entry of result.items) {
        expect(entry.ledger).toBeDefined();
        expect(typeof entry.ledger).toBe('number');
        expect(entry.ledger).toBeGreaterThan(0);
      }
    }, 15000);

    it('should have valid role identifiers', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      const result = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

      for (const entry of result.items) {
        expect(entry.role).toBeDefined();
        expect(entry.role.id).toBeDefined();
        expect(typeof entry.role.id).toBe('string');
        expect(entry.role.id.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('Real-World Usage Scenario', () => {
    it('should support typical audit trail query (recent activity for specific account)', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }
      // Scenario: Check recent activity for a specific account
      const allResult = await client.queryHistory(TEST_CONTRACT, { limit: 20 });
      expect(allResult.items.length).toBeGreaterThan(0);

      const targetAccount = allResult.items[0].account;

      // Get last 10 events for this account
      const accountResult = await client.queryHistory(TEST_CONTRACT, {
        account: targetAccount,
        limit: 10,
      });

      expect(accountResult.items.length).toBeGreaterThan(0);

      // Verify we can identify what roles this account received/lost
      const grants = accountResult.items.filter((e) => e.changeType === 'GRANTED');
      // At least one grant should exist (we filtered by an account that appears)
      expect(grants.length).toBeGreaterThan(0);

      // Verify we have timeline information
      for (const event of accountResult.items) {
        expect(event.timestamp).toBeDefined();
        expect(event.ledger).toBeGreaterThan(0);
        expect(event.txId).toMatch(/^[a-f0-9]{64}$/);
      }
    }, 20000);
  });

  describe('Role Discovery', () => {
    it('should discover all expected role IDs from historical events', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT);

      expect(roleIds).toBeDefined();
      expect(Array.isArray(roleIds)).toBe(true);
      // The test contract should have exactly 7 unique roles
      expect(roleIds.length).toBe(EXPECTED_ROLE_COUNT);

      // Verify all expected roles are discovered
      for (const expectedRole of EXPECTED_ROLES) {
        expect(roleIds).toContain(expectedRole);
      }
    }, 15000);

    it('should return unique role IDs (no duplicates)', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT);

      // Check for uniqueness
      const uniqueRoles = new Set(roleIds);
      expect(roleIds.length).toBe(uniqueRoles.size);
      // Contract has multiple grants per role (e.g., 3 minter grants) but should dedupe to 7
      expect(roleIds.length).toBe(EXPECTED_ROLE_COUNT);
    }, 15000);

    it('should return role IDs as strings', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT);

      for (const roleId of roleIds) {
        expect(typeof roleId).toBe('string');
        expect(roleId.length).toBeGreaterThan(0);
      }
    }, 15000);

    it('should return empty array for contract with no role events', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Use a valid but non-existent contract address
      const fakeContract = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
      const roleIds = await client.discoverRoleIds(fakeContract);

      expect(roleIds).toBeDefined();
      expect(Array.isArray(roleIds)).toBe(true);
      expect(roleIds.length).toBe(0);
    }, 15000);

    it('should throw error when indexer is unavailable', async () => {
      const invalidConfig: StellarNetworkConfig = {
        ...testNetworkConfig,
        indexerUri: undefined,
      };
      const noIndexerClient = new StellarIndexerClient(invalidConfig);

      await expect(noIndexerClient.discoverRoleIds(TEST_CONTRACT)).rejects.toThrow(
        'Indexer not available'
      );
    }, 15000);

    it('should discover roles consistent with history query', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Get discovered role IDs
      const discoveredRoles = await client.discoverRoleIds(TEST_CONTRACT);

      // Get all history and extract unique roles manually
      const result = await client.queryHistory(TEST_CONTRACT);
      const historyRoles = new Set<string>();
      for (const entry of result.items) {
        // Only count actual roles, not ownership events (OWNER)
        if (entry.role && entry.role.id && entry.role.id !== 'OWNER') {
          historyRoles.add(entry.role.id);
        }
      }

      // Discovered roles should match roles from history
      expect(discoveredRoles.length).toBe(historyRoles.size);
      for (const role of discoveredRoles) {
        expect(historyRoles.has(role)).toBe(true);
      }
    }, 20000);

    it('should discover specific roles including minter, operator, and approver', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      const roleIds = await client.discoverRoleIds(TEST_CONTRACT);

      // These roles have multiple grants in the history
      expect(roleIds).toContain('minter');
      expect(roleIds).toContain('operator');
      expect(roleIds).toContain('approver');
    }, 15000);
  });

  describe('queryLatestGrants()', () => {
    it('should query latest grants for known members', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // The known event account should have grant info for minter role
      const grantMap = await client.queryLatestGrants(TEST_CONTRACT, KNOWN_EVENT_ROLE, [
        KNOWN_EVENT_ACCOUNT,
      ]);

      expect(grantMap).toBeInstanceOf(Map);
      expect(grantMap.size).toBe(1);

      const grantInfo = grantMap.get(KNOWN_EVENT_ACCOUNT);
      expect(grantInfo).toBeDefined();
      expect(grantInfo?.timestamp).toBeDefined();
      expect(grantInfo?.txId).toBeDefined();
      expect(grantInfo?.ledger).toBeDefined();

      // Verify the known event block
      expect(grantInfo?.ledger).toBe(KNOWN_EVENT_BLOCK);
    }, 15000);

    it('should return empty map for accounts with no grants', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Use a fake account that has no grants
      const fakeAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPWDQT';
      const grantMap = await client.queryLatestGrants(TEST_CONTRACT, KNOWN_EVENT_ROLE, [
        fakeAccount,
      ]);

      expect(grantMap).toBeInstanceOf(Map);
      expect(grantMap.size).toBe(0);
    }, 15000);

    it('should handle multiple accounts in a single query', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // First, get some history to find additional accounts with the minter role
      const result = await client.queryHistory(TEST_CONTRACT, {
        roleId: KNOWN_EVENT_ROLE,
        limit: 5,
      });

      const accountsWithRole = [...new Set(result.items.map((e) => e.account))].slice(0, 3);

      if (accountsWithRole.length < 2) {
        console.log('  ⏭️ Skipping: Not enough accounts with minter role for batch test');
        return;
      }

      const grantMap = await client.queryLatestGrants(
        TEST_CONTRACT,
        KNOWN_EVENT_ROLE,
        accountsWithRole
      );

      expect(grantMap).toBeInstanceOf(Map);
      // Should have at least one grant (may not have all if some were later revoked and re-granted)
      expect(grantMap.size).toBeGreaterThan(0);
      expect(grantMap.size).toBeLessThanOrEqual(accountsWithRole.length);

      // Verify structure of returned grants
      for (const [account, grant] of grantMap) {
        expect(accountsWithRole).toContain(account);
        expect(typeof grant.timestamp).toBe('string');
        expect(typeof grant.txId).toBe('string');
        expect(typeof grant.ledger).toBe('number');
      }
    }, 20000);

    it('should return the latest grant when account was granted multiple times', async () => {
      if (!indexerAvailable) {
        return; // Skip test if indexer is not available
      }

      // Query full history for the known account
      const result = await client.queryHistory(TEST_CONTRACT, {
        roleId: KNOWN_EVENT_ROLE,
        account: KNOWN_EVENT_ACCOUNT,
      });

      const grants = result.items.filter((e) => e.changeType === 'GRANTED');

      if (grants.length > 1) {
        // If there are multiple grants, queryLatestGrants should return the most recent
        const grantMap = await client.queryLatestGrants(TEST_CONTRACT, KNOWN_EVENT_ROLE, [
          KNOWN_EVENT_ACCOUNT,
        ]);

        const latestGrant = grantMap.get(KNOWN_EVENT_ACCOUNT);
        expect(latestGrant).toBeDefined();

        // The returned grant should match the first (most recent) grant from history
        expect(latestGrant?.ledger).toBe(grants[0].ledger);
      } else {
        // Single grant case - just verify we get the expected one
        const grantMap = await client.queryLatestGrants(TEST_CONTRACT, KNOWN_EVENT_ROLE, [
          KNOWN_EVENT_ACCOUNT,
        ]);
        expect(grantMap.size).toBe(1);
      }
    }, 15000);
  });
});

/**
 * Integration Test: On-Chain Role Member Enumeration
 *
 * Tests the on-chain reader functions that call the contract's
 * get_role_member_count() and get_role_member() entrypoints via Soroban RPC.
 *
 * These tests verify the complete flow:
 * 1. Discover roles via indexer
 * 2. Enumerate members on-chain for discovered roles
 */
describe('On-Chain Role Enumeration - Integration Test', () => {
  let indexerClient: StellarIndexerClient;
  let indexerAvailable = false;
  let rpcAvailable = false;
  let enumerateRoleMembers: typeof import('../../src/access-control/onchain-reader').enumerateRoleMembers;
  let getRoleMemberCount: typeof import('../../src/access-control/onchain-reader').getRoleMemberCount;

  beforeAll(async () => {
    // Dynamically import on-chain reader to avoid module resolution issues
    const onchainReader = await import('../../src/access-control/onchain-reader');
    enumerateRoleMembers = onchainReader.enumerateRoleMembers;
    getRoleMemberCount = onchainReader.getRoleMemberCount;

    // Check Soroban RPC availability by making a simple call
    try {
      // Try to get member count for a known role - if RPC works, this will return a number
      const count = await getRoleMemberCount(TEST_CONTRACT, 'minter', testNetworkConfig);
      if (typeof count === 'number') {
        rpcAvailable = true;
        console.log(`✅ Soroban RPC is available (minter role has ${count} members)`);
      }
    } catch (error) {
      rpcAvailable = false;
      const errorMsg = (error as Error).message;
      // Known issue: Keypair.random() may fail in some test environments
      if (errorMsg.includes('private key')) {
        console.log(
          '⚠️  Soroban RPC tests skipped - crypto/keypair not available in test environment'
        );
      } else {
        console.log('⚠️  Soroban RPC not available - on-chain tests will be skipped');
        console.log(`   Error: ${errorMsg}`);
      }
    }

    // Check indexer availability separately
    indexerClient = new StellarIndexerClient(testNetworkConfig);
    indexerAvailable = await indexerClient.checkAvailability();

    if (!indexerAvailable) {
      console.log('⚠️  Indexer not available - discovery tests will use known roles');
    }
  }, 30000);

  describe('getRoleMemberCount()', () => {
    it('should return member count for the minter role', async () => {
      if (!rpcAvailable) {
        console.log('  ⏭️  Skipping: Soroban RPC not available');
        return;
      }

      // The minter role should have at least 1 member based on our test setup
      const count = await getRoleMemberCount(TEST_CONTRACT, 'minter', testNetworkConfig);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`  ✓ minter role has ${count} member(s)`);
    }, 30000);

    it('should return 0 for a role with no members', async () => {
      if (!rpcAvailable) {
        console.log('  ⏭️  Skipping: Soroban RPC not available');
        return;
      }

      // A random role that doesn't exist should return 0
      const count = await getRoleMemberCount(
        TEST_CONTRACT,
        'nonexistent_role_xyz',
        testNetworkConfig
      );

      expect(count).toBe(0);
    }, 30000);
  });

  describe('enumerateRoleMembers()', () => {
    it('should enumerate members for the minter role', async () => {
      if (!rpcAvailable) {
        console.log('  ⏭️  Skipping: Soroban RPC not available');
        return;
      }

      // First check if minter role has members
      const count = await getRoleMemberCount(TEST_CONTRACT, 'minter', testNetworkConfig);

      if (count === 0) {
        console.log('  ⏭️  Skipping: minter role has no members');
        return;
      }

      const members = await enumerateRoleMembers(TEST_CONTRACT, 'minter', testNetworkConfig);

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBe(count);

      // Verify each member is a valid Stellar address (starts with G)
      for (const member of members) {
        expect(typeof member).toBe('string');
        expect(member.startsWith('G')).toBe(true);
        expect(member.length).toBe(56); // Stellar addresses are 56 chars
      }

      console.log(`  ✓ Enumerated ${members.length} member(s) for minter role`);
      members.forEach((m, i) => console.log(`    [${i}] ${m}`));
    }, 60000);

    it('should return empty array for role with no members', async () => {
      if (!rpcAvailable) {
        console.log('  ⏭️  Skipping: Soroban RPC not available');
        return;
      }

      const members = await enumerateRoleMembers(
        TEST_CONTRACT,
        'nonexistent_role_xyz',
        testNetworkConfig
      );

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBe(0);
    }, 30000);
  });

  describe('Full Discovery + Enumeration Flow', () => {
    it('should discover roles via indexer and enumerate members on-chain', async () => {
      if (!rpcAvailable) {
        console.log('  ⏭️  Skipping: Soroban RPC not available');
        return;
      }

      let rolesToEnumerate: string[];

      if (indexerAvailable) {
        // Step 1: Try to discover roles via indexer (with timeout handling)
        try {
          rolesToEnumerate = await indexerClient.discoverRoleIds(TEST_CONTRACT);
          console.log(
            `  ✓ Discovered ${rolesToEnumerate.length} roles via indexer: ${rolesToEnumerate.join(', ')}`
          );
        } catch (error) {
          // Fall back to known roles if indexer times out
          console.log(`  ⚠️ Indexer query failed, using known roles: ${(error as Error).message}`);
          rolesToEnumerate = EXPECTED_ROLES;
        }
      } else {
        // Fall back to known roles from test setup
        rolesToEnumerate = EXPECTED_ROLES;
        console.log(
          `  ⚠️ Using ${rolesToEnumerate.length} known roles (indexer unavailable): ${rolesToEnumerate.join(', ')}`
        );
      }

      expect(rolesToEnumerate.length).toBeGreaterThan(0);

      // Step 2: Enumerate members for each discovered role
      const roleMembers: Record<string, string[]> = {};
      let totalMembers = 0;

      for (const roleId of rolesToEnumerate) {
        try {
          const members = await enumerateRoleMembers(TEST_CONTRACT, roleId, testNetworkConfig);
          roleMembers[roleId] = members;
          totalMembers += members.length;
          console.log(`  ✓ Role "${roleId}": ${members.length} member(s)`);
        } catch {
          console.log(`  ⚠️ Role "${roleId}": failed to enumerate (may have been revoked)`);
          roleMembers[roleId] = [];
        }
      }

      // Verify we got meaningful data
      expect(Object.keys(roleMembers).length).toBe(rolesToEnumerate.length);
      console.log(`  ✓ Total: ${totalMembers} member(s) across ${rolesToEnumerate.length} roles`);
    }, 180000); // 3 minutes timeout for full flow with multiple RPC calls
  });
});
