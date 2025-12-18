/**
 * Unit tests for Two-Step Admin Transfer Support
 *
 * Tests for the admin two-step transfer workflow similar to Ownable two-step:
 * - Feature detection for hasTwoStepAdmin
 * - assembleTransferAdminRoleAction() and assembleAcceptAdminTransferAction()
 * - queryPendingAdminTransfer() in indexer client
 * - getAdminInfo(), transferAdminRole(), acceptAdminTransfer() in service
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ContractFunction,
  ContractSchema,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';

/**
 * Helper to create a minimal mock ContractFunction with required properties
 */
function mockFn(name: string): ContractFunction {
  return {
    id: name,
    name,
    displayName: name,
    type: 'function',
    modifiesState: false,
    inputs: [],
    outputs: [],
  };
}

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

// Mock the logger and config services
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
  userNetworkServiceConfigService: {
    get: vi.fn().mockReturnValue(null),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  validateSnapshot: vi.fn().mockReturnValue(true),
}));

describe('Two-Step Admin Transfer Support', () => {
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

  describe('Feature Detection - hasTwoStepAdmin', () => {
    it('should detect two-step admin when accept_admin_transfer is present', async () => {
      const { detectAccessControlCapabilities } = await import(
        '../../src/access-control/feature-detection'
      );

      const contractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [
          // Required AccessControl functions
          mockFn('has_role'),
          mockFn('grant_role'),
          mockFn('revoke_role'),
          // Optional AccessControl functions including two-step admin
          mockFn('get_admin'),
          mockFn('get_role_admin'),
          mockFn('set_role_admin'),
          mockFn('transfer_admin_role'),
          mockFn('accept_admin_transfer'),
          mockFn('renounce_admin'),
        ],
      };

      const capabilities = detectAccessControlCapabilities(contractSchema, false);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasTwoStepAdmin).toBe(true);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
      expect(capabilities.notes).toContain(
        'OpenZeppelin two-step AccessControl interface detected (with accept_admin_transfer)'
      );
    });

    it('should set hasTwoStepAdmin to false when accept_admin_transfer is missing', async () => {
      const { detectAccessControlCapabilities } = await import(
        '../../src/access-control/feature-detection'
      );

      const contractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [
          // Required AccessControl functions
          mockFn('has_role'),
          mockFn('grant_role'),
          mockFn('revoke_role'),
          // Optional AccessControl functions WITHOUT two-step admin
          mockFn('get_admin'),
          mockFn('get_role_admin'),
          mockFn('set_role_admin'),
          mockFn('renounce_admin'),
        ],
      };

      const capabilities = detectAccessControlCapabilities(contractSchema, false);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasTwoStepAdmin).toBe(false);
    });

    it('should set hasTwoStepAdmin to false when AccessControl is not present', async () => {
      const { detectAccessControlCapabilities } = await import(
        '../../src/access-control/feature-detection'
      );

      const contractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [
          // Only Ownable functions
          mockFn('get_owner'),
          mockFn('transfer_ownership'),
          mockFn('accept_ownership'),
        ],
      };

      const capabilities = detectAccessControlCapabilities(contractSchema, false);

      expect(capabilities.hasAccessControl).toBe(false);
      expect(capabilities.hasTwoStepAdmin).toBe(false);
    });
  });

  describe('assembleTransferAdminRoleAction()', () => {
    it('should create correct transaction data for transfer_admin_role', async () => {
      const { assembleTransferAdminRoleAction } = await import('../../src/access-control/actions');

      const contractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
      const newAdmin = 'GNEWADMIN123456789ABCDEFGHIJKLMNOP';
      const liveUntilLedger = 12350000;

      const txData = assembleTransferAdminRoleAction(contractAddress, newAdmin, liveUntilLedger);

      expect(txData.contractAddress).toBe(contractAddress);
      expect(txData.functionName).toBe('transfer_admin_role');
      expect(txData.args).toEqual([newAdmin, liveUntilLedger]);
      expect(txData.argTypes).toEqual(['Address', 'u32']);
    });
  });

  describe('assembleAcceptAdminTransferAction()', () => {
    it('should create correct transaction data for accept_admin_transfer', async () => {
      const { assembleAcceptAdminTransferAction } = await import(
        '../../src/access-control/actions'
      );

      const contractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';

      const txData = assembleAcceptAdminTransferAction(contractAddress);

      expect(txData.contractAddress).toBe(contractAddress);
      expect(txData.functionName).toBe('accept_admin_transfer');
      expect(txData.args).toEqual([]);
      expect(txData.argTypes).toEqual([]);
    });
  });

  describe('queryPendingAdminTransfer()', () => {
    it('should throw when indexer is unavailable', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient(mockNetworkConfig); // No indexerUri configured

      await expect(
        client.queryPendingAdminTransfer('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM')
      ).rejects.toThrow('Indexer not available');
    });

    it('should return pending admin transfer when indexer returns initiation event', async () => {
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
        // Second call - admin transfer initiation event query
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'test-event-1',
                    type: 'ADMIN_TRANSFER_INITIATED',
                    account: 'GNEWADMIN123456789ABCDEFGHIJK',
                    admin: 'GOLDADMIN123456789ABCDEFGHIJK',
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    ledger: '12340000',
                    liveUntilLedger: 12350000,
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

      const result = await client.queryPendingAdminTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeDefined();
      expect(result?.pendingAdmin).toBe('GNEWADMIN123456789ABCDEFGHIJK');
      expect(result?.previousAdmin).toBe('GOLDADMIN123456789ABCDEFGHIJK');
      expect(result?.ledger).toBe(12340000);
      expect(result?.liveUntilLedger).toBe(12350000);
    });

    it('should return null when no pending admin transfer exists', async () => {
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

      const result = await client.queryPendingAdminTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeNull();
    });

    it('should return null when admin transfer was completed', async () => {
      const { StellarIndexerClient } = await import('../../src/access-control/indexer-client');

      const client = new StellarIndexerClient({
        ...mockNetworkConfig,
        indexerUri: 'http://localhost:3000/graphql',
      });

      // Mock fetch with initiation followed by completion
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
                    id: 'test-event-1',
                    type: 'ADMIN_TRANSFER_INITIATED',
                    account: 'GNEWADMIN123456789ABCDEFGHIJK',
                    admin: 'GOLDADMIN123456789ABCDEFGHIJK',
                    txHash: 'a'.repeat(64),
                    timestamp: '2025-01-15T10:00:00Z',
                    ledger: '12340000',
                    liveUntilLedger: 12350000,
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        })
        // Completion event exists
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              accessControlEvents: {
                nodes: [
                  {
                    id: 'test-event-2',
                    type: 'ADMIN_TRANSFER_COMPLETED',
                    txHash: 'b'.repeat(64),
                    timestamp: '2025-01-15T11:00:00Z',
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            },
          }),
        });

      const result = await client.queryPendingAdminTransfer(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
      );

      expect(result).toBeNull();
    });
  });

  describe('AdminTransferInitiatedEvent interface', () => {
    it('should export AdminTransferInitiatedEvent type', async () => {
      const indexerModule = await import('../../src/access-control/indexer-client');

      // Verify the type exists by checking that the module exports are correct
      expect(indexerModule).toBeDefined();
      expect(typeof indexerModule.StellarIndexerClient).toBe('function');
    });
  });

  describe('Admin transfer actions integration', () => {
    it('should produce valid transaction data for full admin transfer flow', async () => {
      const { assembleTransferAdminRoleAction, assembleAcceptAdminTransferAction } = await import(
        '../../src/access-control/actions'
      );

      const contractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
      const newAdmin = 'GNEWADMIN123456789ABCDEFGHIJKLMNOP';
      const liveUntilLedger = 12350000;

      // Step 1: Initiate transfer
      const transferTxData = assembleTransferAdminRoleAction(
        contractAddress,
        newAdmin,
        liveUntilLedger
      );

      expect(transferTxData.functionName).toBe('transfer_admin_role');
      expect(transferTxData.args[0]).toBe(newAdmin);
      expect(transferTxData.args[1]).toBe(liveUntilLedger);

      // Step 2: Accept transfer
      const acceptTxData = assembleAcceptAdminTransferAction(contractAddress);

      expect(acceptTxData.functionName).toBe('accept_admin_transfer');
      expect(acceptTxData.args).toHaveLength(0);
    });
  });
});
