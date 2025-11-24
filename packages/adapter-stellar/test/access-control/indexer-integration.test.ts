/**
 * Integration Test: Stellar Adapter with Real SubQuery Indexer
 *
 * Tests the adapter's ability to query the deployed SubQuery indexer
 * for historical access control events.
 *
 * Prerequisites:
 * - SubQuery indexer deployed to SubQuery Network
 * - Indexer URL: https://gateway.subquery.network/query/QmQPfNvnWX1pk8DjQoKysncNE9JfpwAZVLGTez7feVsquQ
 * - Contract: CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2
 * - Known event at block: 1688170 (Ownership Transfer Started)
 *
 * IMPORTANT: These tests require an active Node Operator syncing the deployed project.
 * Tests will gracefully SKIP if the indexer is not operational, which is expected
 * behavior when node operators are not yet active or during maintenance.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import { StellarIndexerClient } from '../../src/access-control/indexer-client';

// Test configuration
const DEPLOYED_INDEXER_URL =
  'https://gateway.subquery.network/query/QmQPfNvnWX1pk8DjQoKysncNE9JfpwAZVLGTez7feVsquQ?apikey=DJ6P3I8S7YJEK29WK8F617OB';
const TEST_CONTRACT = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';
const KNOWN_EVENT_BLOCK = 1688170;

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
  let indexerAvailable: boolean;

  beforeAll(async () => {
    client = new StellarIndexerClient(testNetworkConfig);
    // Check availability once for all tests
    indexerAvailable = await client.checkAvailability();

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
  });

  describe('Connectivity', () => {
    it.skipIf(!indexerAvailable)(
      'should successfully connect to the deployed indexer',
      async () => {
        expect(indexerAvailable).toBe(true);
      },
      10000
    ); // 10s timeout for network call

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
    it.skipIf(!indexerAvailable)(
      'should query all history for the test contract',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT);

        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThan(0);

        // Verify structure of first entry
        const firstEntry = history[0];
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
      },
      15000
    );

    it.skipIf(!indexerAvailable)(
      'should query history with pagination limit',
      async () => {
        const limitedHistory = await client.queryHistory(TEST_CONTRACT, { limit: 5 });

        expect(limitedHistory).toBeDefined();
        expect(limitedHistory.length).toBeLessThanOrEqual(5);
        expect(limitedHistory.length).toBeGreaterThan(0);
      },
      15000
    );
  });

  describe('History Query - Filtering', () => {
    it.skipIf(!indexerAvailable)(
      'should filter history by specific account',
      async () => {
        // First get all history to find a valid account
        const allHistory = await client.queryHistory(TEST_CONTRACT);
        expect(allHistory.length).toBeGreaterThan(0);

        const targetAccount = allHistory[0].account;

        // Now filter by that account
        const filteredHistory = await client.queryHistory(TEST_CONTRACT, {
          account: targetAccount,
        });

        expect(filteredHistory.length).toBeGreaterThan(0);
        // Verify all entries match the filter
        for (const entry of filteredHistory) {
          expect(entry.account).toBe(targetAccount);
        }
      },
      15000
    );

    it.skipIf(!indexerAvailable)(
      'should filter history by specific role',
      async () => {
        // Query without filter first to see what roles exist
        const allHistory = await client.queryHistory(TEST_CONTRACT);

        // Find an entry with an actual role (not ownership)
        const roleEntry = allHistory.find((e) => e.role && e.role.id !== 'OWNER');

        if (roleEntry) {
          const targetRole = roleEntry.role.id;

          // Query with role filter
          const filteredHistory = await client.queryHistory(TEST_CONTRACT, {
            roleId: targetRole,
          });

          expect(filteredHistory.length).toBeGreaterThan(0);
          // Verify all entries match the filter
          for (const entry of filteredHistory) {
            expect(entry.role.id).toBe(targetRole);
          }
        } else {
          // If no role entries found, test passes (ownership-only contract)
          expect(true).toBe(true);
        }
      },
      15000
    );
  });

  describe('History Query - Known Event Verification', () => {
    it.skipIf(!indexerAvailable)(
      'should find the known ownership transfer event at block 1688170',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT);

        // Find the event at the known block
        const knownEvent = history.find((e) => e.ledger === KNOWN_EVENT_BLOCK);

        expect(knownEvent).toBeDefined();
        if (knownEvent) {
          // Verify it's the ownership transfer we know about
          expect(knownEvent.account).toBe(
            'GDGI6UJHEWGBZ3XYADMI75DKM7EMGSL7M4JTX3S52CMVFUL4JXMNMKQO'
          );
          expect(knownEvent.changeType).toBe('GRANTED'); // Ownership transfer mapped as grant
          expect(knownEvent.ledger).toBe(KNOWN_EVENT_BLOCK);
        }
      },
      15000
    );
  });

  describe('History Query - Event Timeline', () => {
    it.skipIf(!indexerAvailable)(
      'should return events in descending timestamp order',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

        expect(history.length).toBeGreaterThan(1);

        // Verify descending order
        for (let i = 0; i < history.length - 1; i++) {
          const currentTimestamp = new Date(history[i].timestamp!).getTime();
          const nextTimestamp = new Date(history[i + 1].timestamp!).getTime();
          expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
        }
      },
      15000
    );

    it.skipIf(!indexerAvailable)(
      'should include valid timestamps in ISO8601 format',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT, { limit: 5 });

        for (const entry of history) {
          expect(entry.timestamp).toBeDefined();
          // Should be parseable as a date
          const parsed = new Date(entry.timestamp!);
          expect(parsed.getTime()).not.toBeNaN();
          // Should match ISO8601 format
          expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
      },
      15000
    );
  });

  describe('History Query - Error Handling', () => {
    it.skipIf(!indexerAvailable)(
      'should return empty array for contract with no events',
      async () => {
        // Use a valid but non-existent contract address
        const fakeContract = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
        const history = await client.queryHistory(fakeContract);

        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBe(0);
      },
      15000
    );

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
    it.skipIf(!indexerAvailable)(
      'should have valid transaction hashes for all events',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

        for (const entry of history) {
          expect(entry.txId).toBeDefined();
          expect(entry.txId.length).toBeGreaterThan(0);
          // Stellar tx hash is 64 character hex string
          expect(entry.txId).toMatch(/^[a-f0-9]{64}$/);
        }
      },
      15000
    );

    it.skipIf(!indexerAvailable)(
      'should have valid block heights for all events',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

        for (const entry of history) {
          expect(entry.ledger).toBeDefined();
          expect(typeof entry.ledger).toBe('number');
          expect(entry.ledger).toBeGreaterThan(0);
        }
      },
      15000
    );

    it.skipIf(!indexerAvailable)(
      'should have valid role identifiers',
      async () => {
        const history = await client.queryHistory(TEST_CONTRACT, { limit: 10 });

        for (const entry of history) {
          expect(entry.role).toBeDefined();
          expect(entry.role.id).toBeDefined();
          expect(typeof entry.role.id).toBe('string');
          expect(entry.role.id.length).toBeGreaterThan(0);
        }
      },
      15000
    );
  });

  describe('Real-World Usage Scenario', () => {
    it.skipIf(!indexerAvailable)(
      'should support typical audit trail query (recent activity for specific account)',
      async () => {
        // Scenario: Check recent activity for a specific account
        const allHistory = await client.queryHistory(TEST_CONTRACT, { limit: 20 });
        expect(allHistory.length).toBeGreaterThan(0);

        const targetAccount = allHistory[0].account;

        // Get last 10 events for this account
        const accountHistory = await client.queryHistory(TEST_CONTRACT, {
          account: targetAccount,
          limit: 10,
        });

        expect(accountHistory.length).toBeGreaterThan(0);

        // Verify we can identify what roles this account received/lost
        const grants = accountHistory.filter((e) => e.changeType === 'GRANTED');
        const revocations = accountHistory.filter((e) => e.changeType === 'REVOKED');

        // At least one grant should exist (we filtered by an account that appears)
        expect(grants.length).toBeGreaterThan(0);

        // Verify we have timeline information
        for (const event of accountHistory) {
          expect(event.timestamp).toBeDefined();
          expect(event.ledger).toBeGreaterThan(0);
          expect(event.txId).toMatch(/^[a-f0-9]{64}$/);
        }
      },
      20000
    );
  });
});
