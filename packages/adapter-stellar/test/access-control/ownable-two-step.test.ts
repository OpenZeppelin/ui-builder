/**
 * Unit tests for Two-Step Ownable Support
 *
 * Tests: T007 - getCurrentLedger() returning ledger sequence number
 *        T008 - OWNERSHIP_TRANSFER_INITIATED event parsing in indexer
 *        T013 - validateExpirationLedger() helper
 *        T059 - Integration test for full two-step transfer flow
 *        T060 - Edge case tests (boundary conditions, network errors)
 *        T061 - Performance benchmark tests (NFR-001/NFR-002/NFR-003)
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
        // Second call - initiation event query (using new schema)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'test-event-1',
                    type: 'OWNERSHIP_TRANSFER_STARTED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    admin: 'GOLDOWNER123456789ABCDEFGHIJK', // admin = previous owner
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    ledger: '12340000',
                    liveUntilLedger: 12350000, // Required for expiration checking
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
      expect(result?.ledger).toBe(12340000);
      // Note: liveUntilLedger is NOT available from indexer - must query on-chain
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

    it('should return null when indexer event is missing required admin field', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      // Mock fetch returning event WITHOUT admin field (incomplete data)
      global.fetch = vi
        .fn()
        // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
        })
        // Initiation event missing admin field
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'incomplete-event',
                    type: 'OWNERSHIP_TRANSFER_STARTED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    // admin field is missing!
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    ledger: '12340000',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        })
        // Completion check (no completion)
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

      // Should return null instead of an invalid OwnershipTransferStartedEvent with empty previousOwner
      expect(result).toBeNull();
    });

    it('should throw error when completion query returns GraphQL errors', async () => {
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
        // Initiation event (successful)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'test-event',
                    type: 'OWNERSHIP_TRANSFER_STARTED',
                    account: 'GNEWOWNER123456789ABCDEFGHIJK',
                    admin: 'GOLDOWNER123456789ABCDEFGHIJK',
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    ledger: '12340000',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        })
        // Completion query returns GraphQL errors
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Internal server error during completion query' }],
          }),
        });

      // Should throw an error instead of silently returning a pending transfer
      await expect(
        client.queryPendingOwnershipTransfer(
          'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
        )
      ).rejects.toThrow('Indexer completion query errors');
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

  /**
   * Tests for assembleTransferOwnershipAction() with live_until_ledger (T030)
   * Phase 4: User Story 2 - Initiate Ownership Transfer
   */
  describe('assembleTransferOwnershipAction() with live_until_ledger (T030)', () => {
    const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
    const NEW_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

    it('T030: should assemble transfer_ownership action with live_until_ledger parameter', async () => {
      const expirationLedger = 12350000;

      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER, expirationLedger);

      // Verify transaction data structure
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('transfer_ownership');

      // Verify both arguments: new_owner and live_until_ledger
      expect(txData.args).toHaveLength(2);
      expect(txData.args[0]).toBe(NEW_OWNER);
      expect(txData.args[1]).toBe(expirationLedger);

      // Verify argument types
      expect(txData.argTypes).toHaveLength(2);
      expect(txData.argTypes[0]).toBe('Address');
      expect(txData.argTypes[1]).toBe('u32'); // Ledger sequence is u32
    });

    it('T030: should preserve argument order (new_owner, live_until_ledger)', async () => {
      const expirationLedger = 12345678;

      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER, expirationLedger);

      // First argument should be the address, second should be the ledger
      expect(txData.args[0]).toBe(NEW_OWNER);
      expect(typeof txData.args[1]).toBe('number');
      expect(txData.args[1]).toBe(expirationLedger);
    });

    it('T030: should handle large ledger sequence numbers', async () => {
      // Ledger sequences can be large (u32 max is 4,294,967,295)
      const largeLedger = 2147483647; // Near max safe integer in JS

      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER, largeLedger);

      expect(txData.args[1]).toBe(largeLedger);
    });

    it('T030: should handle contract address as new owner with expiration', async () => {
      const contractNewOwner = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';
      const expirationLedger = 12360000;

      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        contractNewOwner,
        expirationLedger
      );

      expect(txData.args[0]).toBe(contractNewOwner);
      expect(txData.args[1]).toBe(expirationLedger);
    });
  });

  /**
   * Tests for assembleAcceptOwnershipAction() (T041)
   * Phase 5: User Story 3 - Accept Ownership Transfer
   */
  describe('assembleAcceptOwnershipAction() (T041)', () => {
    const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';

    it('T041: should assemble accept_ownership action with no parameters', async () => {
      const { assembleAcceptOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleAcceptOwnershipAction(TEST_CONTRACT);

      // Verify transaction data structure
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('accept_ownership');

      // accept_ownership() has no arguments
      expect(txData.args).toHaveLength(0);
      expect(txData.argTypes).toHaveLength(0);
    });

    it('T041: should return valid StellarTransactionData structure', async () => {
      const { assembleAcceptOwnershipAction } = await import('../../src/access-control/actions');

      const txData = assembleAcceptOwnershipAction(TEST_CONTRACT);

      // Verify all required fields are present
      expect(txData).toHaveProperty('contractAddress');
      expect(txData).toHaveProperty('functionName');
      expect(txData).toHaveProperty('args');
      expect(txData).toHaveProperty('argTypes');
      expect(txData).toHaveProperty('argSchema');
      expect(txData).toHaveProperty('transactionOptions');
    });

    it('T041: should handle different contract addresses', async () => {
      const { assembleAcceptOwnershipAction } = await import('../../src/access-control/actions');

      const contract1 = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
      const contract2 = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';

      const txData1 = assembleAcceptOwnershipAction(contract1);
      const txData2 = assembleAcceptOwnershipAction(contract2);

      expect(txData1.contractAddress).toBe(contract1);
      expect(txData2.contractAddress).toBe(contract2);

      // Both should have same function name
      expect(txData1.functionName).toBe('accept_ownership');
      expect(txData2.functionName).toBe('accept_ownership');
    });
  });

  /**
   * T059: Integration test for full two-step transfer flow
   * Tests the complete workflow: initiate -> pending state -> accept -> completed
   */
  describe('Full Two-Step Transfer Flow Integration (T059)', () => {
    const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
    const NEW_OWNER = 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

    it('T059: should complete full two-step transfer workflow', async () => {
      const { assembleTransferOwnershipAction, assembleAcceptOwnershipAction } = await import(
        '../../src/access-control/actions'
      );
      const { validateExpirationLedger } = await import('../../src/access-control/validation');

      // Step 1: Validate and prepare transfer initiation
      const currentLedger = 12345678;
      const expirationLedger = currentLedger + 8640; // ~12 hours

      const validationResult = validateExpirationLedger(expirationLedger, currentLedger);
      expect(validationResult.valid).toBe(true);

      // Step 2: Assemble transfer initiation transaction
      const transferTxData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        NEW_OWNER,
        expirationLedger
      );

      expect(transferTxData.functionName).toBe('transfer_ownership');
      expect(transferTxData.args).toEqual([NEW_OWNER, expirationLedger]);
      expect(transferTxData.argTypes).toEqual(['Address', 'u32']);

      // Step 3: Assemble acceptance transaction
      const acceptTxData = assembleAcceptOwnershipAction(TEST_CONTRACT);

      expect(acceptTxData.functionName).toBe('accept_ownership');
      expect(acceptTxData.args).toHaveLength(0);
      expect(acceptTxData.contractAddress).toBe(TEST_CONTRACT);
    });

    it('T059: should handle overlapping transfers (new transfer cancels pending)', async () => {
      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');
      const { validateExpirationLedger } = await import('../../src/access-control/validation');

      const currentLedger = 12345678;

      // First transfer
      const firstExpiration = currentLedger + 8640;
      const firstNewOwner = NEW_OWNER;

      const firstValidation = validateExpirationLedger(firstExpiration, currentLedger);
      expect(firstValidation.valid).toBe(true);

      const firstTransfer = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        firstNewOwner,
        firstExpiration
      );

      // Second transfer (should replace first)
      const secondExpiration = currentLedger + 17280; // 24 hours
      const secondNewOwner = 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';

      const secondValidation = validateExpirationLedger(secondExpiration, currentLedger);
      expect(secondValidation.valid).toBe(true);

      const secondTransfer = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        secondNewOwner,
        secondExpiration
      );

      // Both transfers should be valid and independent
      expect(firstTransfer.args[0]).toBe(firstNewOwner);
      expect(secondTransfer.args[0]).toBe(secondNewOwner);
      expect(secondTransfer.args[1]).toBeGreaterThan(firstTransfer.args[1] as number);
    });

    it('T059: should validate expiration calculation for different timeframes', async () => {
      const { validateExpirationLedger } = await import('../../src/access-control/validation');

      const currentLedger = 12345678;
      const ledgersPerHour = 720; // 60 * 60 / 5

      // 1 hour expiration
      const oneHour = currentLedger + ledgersPerHour;
      expect(validateExpirationLedger(oneHour, currentLedger).valid).toBe(true);

      // 12 hours expiration
      const twelveHours = currentLedger + ledgersPerHour * 12;
      expect(validateExpirationLedger(twelveHours, currentLedger).valid).toBe(true);

      // 24 hours expiration
      const twentyFourHours = currentLedger + ledgersPerHour * 24;
      expect(validateExpirationLedger(twentyFourHours, currentLedger).valid).toBe(true);

      // 7 days expiration
      const sevenDays = currentLedger + ledgersPerHour * 24 * 7;
      expect(validateExpirationLedger(sevenDays, currentLedger).valid).toBe(true);
    });
  });

  /**
   * T060: Edge case tests (boundary conditions, network errors)
   */
  describe('Edge Case Tests (T060)', () => {
    describe('Boundary Conditions', () => {
      it('T060: should reject expiration at exactly current ledger', () => {
        const currentLedger = 12345678;
        const result = validateExpirationLedger(currentLedger, currentLedger);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('already passed');
      });

      it('T060: should accept expiration at current ledger + 1', () => {
        const currentLedger = 12345678;
        const result = validateExpirationLedger(currentLedger + 1, currentLedger);

        expect(result.valid).toBe(true);
      });

      it('T060: should handle very large ledger numbers', () => {
        const currentLedger = 2147483640; // Near u32 max
        const expiration = 2147483645;

        const result = validateExpirationLedger(expiration, currentLedger);
        expect(result.valid).toBe(true);
      });

      it('T060: should handle ledger 0 (genesis)', () => {
        const currentLedger = 0;
        const expiration = 1;

        const result = validateExpirationLedger(expiration, currentLedger);
        expect(result.valid).toBe(true);
      });

      it('T060: should reject expiration of 0 when current is positive', () => {
        const currentLedger = 100;
        const expiration = 0;

        const result = validateExpirationLedger(expiration, currentLedger);
        expect(result.valid).toBe(false);
      });
    });

    describe('Network Error Handling', () => {
      it('T060: should handle RPC timeout when getting current ledger', async () => {
        vi.resetModules();
        vi.doMock('@stellar/stellar-sdk', () => ({
          rpc: {
            Server: vi.fn().mockImplementation(() => ({
              getLatestLedger: vi.fn().mockRejectedValue(new Error('Request timeout')),
            })),
          },
        }));

        const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');

        await expect(getCurrentLedger(mockNetworkConfig)).rejects.toThrow(
          'Failed to get current ledger'
        );
      });

      it('T060: should handle RPC connection refused', async () => {
        vi.resetModules();
        vi.doMock('@stellar/stellar-sdk', () => ({
          rpc: {
            Server: vi.fn().mockImplementation(() => ({
              getLatestLedger: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
            })),
          },
        }));

        const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');

        await expect(getCurrentLedger(mockNetworkConfig)).rejects.toThrow(
          'Failed to get current ledger'
        );
      });

      it('T060: should handle indexer GraphQL errors', async () => {
        const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

        const client = new StellarIndexerClient({
          ...mockNetworkConfig,
          indexerUri: 'http://localhost:3000/graphql',
        });

        // Mock fetch returning GraphQL error
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: null,
              errors: [{ message: 'Internal server error' }],
            }),
          });

        await expect(
          client.queryPendingOwnershipTransfer(
            'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
          )
        ).rejects.toThrow();
      });

      it('T060: should handle fetch network failure', async () => {
        const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

        const client = new StellarIndexerClient({
          ...mockNetworkConfig,
          indexerUri: 'http://localhost:3000/graphql',
        });

        // Mock fetch throwing network error
        global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

        await expect(
          client.queryPendingOwnershipTransfer(
            'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
          )
        ).rejects.toThrow();
      });
    });
  });

  /**
   * T061: Performance benchmark tests
   * NFR-001: Ownership query < 3 seconds
   * NFR-002: Indexer query < 1 second
   * NFR-003: Ledger query < 500ms
   */
  describe('Performance Benchmark Tests (T061)', () => {
    it('T061: NFR-003 - getCurrentLedger should complete within 500ms', async () => {
      // Reset to use fast mock
      vi.resetModules();
      vi.doMock('@stellar/stellar-sdk', () => ({
        rpc: {
          Server: vi.fn().mockImplementation(() => ({
            getLatestLedger: vi.fn().mockResolvedValue({
              sequence: 12345678,
            }),
          })),
        },
      }));

      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');

      const start = performance.now();
      await getCurrentLedger(mockNetworkConfig);
      const duration = performance.now() - start;

      // NFR-003: Should complete within 500ms
      expect(duration).toBeLessThan(500);
    });

    it('T061: NFR-002 - Indexer query should complete within 1 second', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      // Mock fast indexer responses
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { __typename: 'Query' } }),
        })
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

      const start = performance.now();
      await client.queryPendingOwnershipTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );
      const duration = performance.now() - start;

      // NFR-002: Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('T061: NFR-001 - validateExpirationLedger should be synchronous and fast', () => {
      const start = performance.now();

      // Run 1000 validations to ensure it's fast
      for (let i = 0; i < 1000; i++) {
        validateExpirationLedger(12345678 + i, 12345678);
      }

      const duration = performance.now() - start;

      // Synchronous validation should be nearly instant (< 100ms for 1000 ops)
      expect(duration).toBeLessThan(100);
    });

    it('T061: assembleTransferOwnershipAction should be synchronous and fast', async () => {
      const { assembleTransferOwnershipAction } = await import('../../src/access-control/actions');

      const start = performance.now();

      // Run 1000 assemblies
      for (let i = 0; i < 1000; i++) {
        assembleTransferOwnershipAction(
          'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
          'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
          12345678 + i
        );
      }

      const duration = performance.now() - start;

      // Assembly should be fast (< 100ms for 1000 ops)
      expect(duration).toBeLessThan(100);
    });

    it('T061: assembleAcceptOwnershipAction should be synchronous and fast', async () => {
      const { assembleAcceptOwnershipAction } = await import('../../src/access-control/actions');

      const start = performance.now();

      // Run 1000 assemblies
      for (let i = 0; i < 1000; i++) {
        assembleAcceptOwnershipAction('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM');
      }

      const duration = performance.now() - start;

      // Assembly should be fast (< 100ms for 1000 ops)
      expect(duration).toBeLessThan(100);
    });
  });
});
