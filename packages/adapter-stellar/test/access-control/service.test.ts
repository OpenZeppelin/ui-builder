/**
 * Unit tests for Access Control Service
 *
 * Tests: T020 - Grant/revoke role roundtrip with mocked RPC
 *        T024 - Transfer ownership roundtrip with mocked RPC
 *        T027 - Export snapshot parity with current reads
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ContractSchema,
  EoaExecutionConfig,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';

import {
  assembleGrantRoleAction,
  assembleRevokeRoleAction,
  assembleTransferOwnershipAction,
} from '../../src/access-control/actions';
import { readCurrentRoles, readOwnership } from '../../src/access-control/onchain-reader';
import { StellarAccessControlService } from '../../src/access-control/service';

// Mock the logger but keep validateSnapshot real
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
  };
});

// Mock the onchain-reader module
vi.mock('../../src/access-control/onchain-reader', () => ({
  readOwnership: vi.fn(),
  readCurrentRoles: vi.fn(),
  getAdmin: vi.fn(),
  getCurrentLedger: vi.fn(),
  readPendingOwner: vi.fn(),
}));

// Mock the transaction sender
vi.mock('../../src/transaction/sender', () => ({
  signAndBroadcastStellarTransaction: vi.fn().mockResolvedValue({
    txHash: 'a'.repeat(64), // Mock transaction hash
  }),
}));

describe('Access Control Service (T020)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockContractSchema: ContractSchema;
  let mockExecutionConfig: EoaExecutionConfig;

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_ROLE = 'admin';
  const TEST_ACCOUNT = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';

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

    mockContractSchema = {
      ecosystem: 'stellar',
      address: TEST_CONTRACT,
      functions: [
        {
          id: 'get_owner',
          name: 'get_owner',
          displayName: 'get_owner',
          type: 'function',
          inputs: [],
          outputs: [{ name: 'owner', type: 'Address' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'has_role',
          name: 'has_role',
          displayName: 'has_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [{ name: 'result', type: 'u32' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'grant_role',
          name: 'grant_role',
          displayName: 'grant_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'revoke_role',
          name: 'revoke_role',
          displayName: 'revoke_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'get_role_member_count',
          name: 'get_role_member_count',
          displayName: 'get_role_member_count',
          type: 'function',
          inputs: [{ name: 'role', type: 'Symbol' }],
          outputs: [{ name: 'count', type: 'u32' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'get_role_member',
          name: 'get_role_member',
          displayName: 'get_role_member',
          type: 'function',
          inputs: [
            { name: 'role', type: 'Symbol' },
            { name: 'index', type: 'u32' },
          ],
          outputs: [{ name: 'member', type: 'Address' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'transfer_ownership',
          name: 'transfer_ownership',
          displayName: 'transfer_ownership',
          type: 'function',
          inputs: [{ name: 'new_owner', type: 'Address' }],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'accept_ownership',
          name: 'accept_ownership',
          displayName: 'accept_ownership',
          type: 'function',
          inputs: [],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'renounce_ownership',
          name: 'renounce_ownership',
          displayName: 'renounce_ownership',
          type: 'function',
          inputs: [],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'get_role_admin',
          name: 'get_role_admin',
          displayName: 'get_role_admin',
          type: 'function',
          inputs: [{ name: 'role', type: 'Symbol' }],
          outputs: [{ name: 'admin_role', type: 'Symbol' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'set_role_admin',
          name: 'set_role_admin',
          displayName: 'set_role_admin',
          type: 'function',
          inputs: [
            { name: 'role', type: 'Symbol' },
            { name: 'admin_role', type: 'Symbol' },
          ],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'get_admin',
          name: 'get_admin',
          displayName: 'get_admin',
          type: 'function',
          inputs: [],
          outputs: [{ name: 'admin', type: 'Address' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'transfer_admin_role',
          name: 'transfer_admin_role',
          displayName: 'transfer_admin_role',
          type: 'function',
          inputs: [{ name: 'new_admin', type: 'Address' }],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'accept_admin_transfer',
          name: 'accept_admin_transfer',
          displayName: 'accept_admin_transfer',
          type: 'function',
          inputs: [],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'renounce_admin',
          name: 'renounce_admin',
          displayName: 'renounce_admin',
          type: 'function',
          inputs: [],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'renounce_role',
          name: 'renounce_role',
          displayName: 'renounce_role',
          type: 'function',
          inputs: [{ name: 'role', type: 'Symbol' }],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
      ],
    };

    mockExecutionConfig = {
      method: 'eoa',
      allowAny: false,
      specificAddress: TEST_ACCOUNT,
    };

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('Action Assembly', () => {
    it('should assemble grant_role action with correct parameters', () => {
      const txData = assembleGrantRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      expect(txData).toEqual({
        contractAddress: TEST_CONTRACT,
        functionName: 'grant_role',
        args: [TEST_ACCOUNT, TEST_ROLE],
        argTypes: ['Address', 'Symbol'],
        argSchema: undefined,
        transactionOptions: {},
      });
    });

    it('should assemble revoke_role action with correct parameters', () => {
      const txData = assembleRevokeRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      expect(txData).toEqual({
        contractAddress: TEST_CONTRACT,
        functionName: 'revoke_role',
        args: [TEST_ACCOUNT, TEST_ROLE],
        argTypes: ['Address', 'Symbol'],
        argSchema: undefined,
        transactionOptions: {},
      });
    });
  });

  describe('Expected Behavior (Roundtrip Tests)', () => {
    /**
     * These tests verify that grantRole/revokeRole correctly call transaction execution.
     * The mock transaction sender returns a successful tx hash.
     * The mock readCurrentRoles simulates what would happen on-chain after the transaction.
     */

    beforeEach(() => {
      // Mock readCurrentRoles to return role data that includes our test account
      // This simulates what the on-chain state would be after a successful grant
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE, label: TEST_ROLE },
          members: [TEST_ACCOUNT],
        },
      ]);
    });

    it('should grant role and verify via getCurrentRoles', async () => {
      // Setup: Register contract
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Action: Grant role
      const result = await service.grantRole(
        TEST_CONTRACT,
        TEST_ROLE,
        TEST_ACCOUNT,
        mockExecutionConfig
      );

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/); // Stellar transaction hash pattern

      // Verify: Role was granted (roundtrip)
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole).toBeDefined();
      expect(adminRole?.members).toContain(TEST_ACCOUNT);
    });

    it('should revoke role and verify via getCurrentRoles', async () => {
      // Setup: Register contract and assume role is already granted
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Mock: After revoke, the account should not be in members
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE, label: TEST_ROLE },
          members: [], // Empty after revoke
        },
      ]);

      // Action: Revoke role
      const result = await service.revokeRole(
        TEST_CONTRACT,
        TEST_ROLE,
        TEST_ACCOUNT,
        mockExecutionConfig
      );

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/);

      // Verify: Role was revoked (roundtrip)
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);
    });

    it('should perform complete grant-verify-revoke-verify roundtrip', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Mock progression: empty -> has member -> empty again
      vi.mocked(readCurrentRoles)
        .mockResolvedValueOnce([
          // Step 1: Initially no members
          {
            role: { id: TEST_ROLE, label: TEST_ROLE },
            members: [],
          },
        ])
        .mockResolvedValueOnce([
          // Step 3: After grant, member is present
          {
            role: { id: TEST_ROLE, label: TEST_ROLE },
            members: [TEST_ACCOUNT],
          },
        ])
        .mockResolvedValueOnce([
          // Step 5: After revoke, member is gone
          {
            role: { id: TEST_ROLE, label: TEST_ROLE },
            members: [],
          },
        ]);

      // Step 1: Verify role is not initially granted
      let roles = await service.getCurrentRoles(TEST_CONTRACT);
      let adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);

      // Step 2: Grant role
      const grantResult = await service.grantRole(
        TEST_CONTRACT,
        TEST_ROLE,
        TEST_ACCOUNT,
        mockExecutionConfig
      );
      expect(grantResult.id).toBeDefined();

      // Step 3: Verify role is granted
      roles = await service.getCurrentRoles(TEST_CONTRACT);
      adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).toContain(TEST_ACCOUNT);

      // Step 4: Revoke role
      const revokeResult = await service.revokeRole(
        TEST_CONTRACT,
        TEST_ROLE,
        TEST_ACCOUNT,
        mockExecutionConfig
      );
      expect(revokeResult.id).toBeDefined();

      // Step 5: Verify role is revoked
      roles = await service.getCurrentRoles(TEST_CONTRACT);
      adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);
    });
  });

  describe('Transaction Data Validation', () => {
    it('should validate grant_role transaction structure', () => {
      const txData = assembleGrantRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify all required fields are present
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('grant_role');
      expect(txData.args).toHaveLength(2);
      expect(txData.argTypes).toHaveLength(2);
      expect(txData.argTypes[0]).toBe('Address');
      expect(txData.argTypes[1]).toBe('Symbol');
    });

    it('should validate revoke_role transaction structure', () => {
      const txData = assembleRevokeRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify all required fields are present
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('revoke_role');
      expect(txData.args).toHaveLength(2);
      expect(txData.argTypes).toHaveLength(2);
      expect(txData.argTypes[0]).toBe('Address');
      expect(txData.argTypes[1]).toBe('Symbol');
    });

    it('should preserve argument order (account, role)', () => {
      const grantTxData = assembleGrantRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      const revokeTxData = assembleRevokeRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Both functions should have consistent arg order: account first, then role
      expect(grantTxData.args[0]).toBe(TEST_ACCOUNT);
      expect(grantTxData.args[1]).toBe(TEST_ROLE);
      expect(revokeTxData.args[0]).toBe(TEST_ACCOUNT);
      expect(revokeTxData.args[1]).toBe(TEST_ROLE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in role names', () => {
      const specialRole = 'admin_role';
      const txData = assembleGrantRoleAction(TEST_CONTRACT, specialRole, TEST_ACCOUNT);

      expect(txData.args[1]).toBe(specialRole);
    });

    it('should handle long Stellar addresses', () => {
      const longAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
      const txData = assembleGrantRoleAction(TEST_CONTRACT, TEST_ROLE, longAddress);

      expect(txData.args[0]).toBe(longAddress);
    });

    it('should handle contract addresses correctly', () => {
      const contractAddr = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
      const txData = assembleGrantRoleAction(contractAddr, TEST_ROLE, TEST_ACCOUNT);

      expect(txData.contractAddress).toBe(contractAddr);
    });
  });
});

describe('Access Control Service - Transfer Ownership (T024)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockExecutionConfig: EoaExecutionConfig;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    queryPendingOwnershipTransfer: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const CURRENT_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const NEW_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const DEFAULT_EXPIRATION_LEDGER = 12350000;

  beforeEach(async () => {
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

    mockExecutionConfig = {
      method: 'eoa',
      allowAny: false,
      specificAddress: CURRENT_OWNER,
    };

    // Setup mock indexer client (unavailable by default for basic ownership tests)
    mockIndexerClient = {
      checkAvailability: vi.fn().mockResolvedValue(false),
      queryPendingOwnershipTransfer: vi.fn().mockResolvedValue(null),
      queryHistory: vi.fn(),
      discoverRoleIds: vi.fn(),
    };

    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('Action Assembly', () => {
    it('should assemble transfer_ownership action with correct parameters (two-step)', () => {
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER
      );

      expect(txData).toEqual({
        contractAddress: TEST_CONTRACT,
        functionName: 'transfer_ownership',
        args: [NEW_OWNER, DEFAULT_EXPIRATION_LEDGER],
        argTypes: ['Address', 'u32'],
        argSchema: undefined,
        transactionOptions: {},
      });
    });
  });

  describe('Expected Behavior (Roundtrip Tests)', () => {
    /**
     * These tests verify that transferOwnership correctly calls transaction execution.
     * The mock transaction sender returns a successful tx hash.
     * The mock readOwnership simulates what would happen on-chain after the transaction.
     */

    const CURRENT_LEDGER = 12340000;

    beforeEach(async () => {
      // Mock getCurrentLedger for all roundtrip tests
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(CURRENT_LEDGER);
    });

    it('should transfer ownership and verify via getOwnership', async () => {
      // Setup: Mock current owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: CURRENT_OWNER,
      });

      // Verify: Current owner
      let ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(CURRENT_OWNER);

      // Mock: After transfer, ownership is updated
      vi.mocked(readOwnership).mockResolvedValue({
        owner: NEW_OWNER,
      });

      // Action: Transfer ownership with expiration
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER,
        mockExecutionConfig
      );

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/); // Stellar transaction hash pattern

      // Verify: Ownership was transferred (roundtrip)
      ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(NEW_OWNER);
    });

    it('should perform complete transfer-verify roundtrip', async () => {
      // Mock progression: current owner -> new owner
      vi.mocked(readOwnership)
        .mockResolvedValueOnce({
          // Step 1: Initially current owner
          owner: CURRENT_OWNER,
        })
        .mockResolvedValueOnce({
          // Step 3: After transfer, new owner
          owner: NEW_OWNER,
        });

      // Step 1: Verify current owner
      let ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(CURRENT_OWNER);

      // Step 2: Transfer ownership with expiration
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER,
        mockExecutionConfig
      );
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/);

      // Step 3: Verify new owner
      ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(NEW_OWNER);
    });

    it('should handle ownership transfer to contract address', async () => {
      // Use a different valid contract address for the new owner
      const newContractOwner = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';

      // Mock progression: current owner -> new contract owner
      vi.mocked(readOwnership)
        .mockResolvedValueOnce({
          owner: CURRENT_OWNER,
        })
        .mockResolvedValueOnce({
          owner: newContractOwner,
        });

      // Step 1: Verify current owner
      let ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(CURRENT_OWNER);

      // Step 2: Transfer to contract address with expiration
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        newContractOwner,
        DEFAULT_EXPIRATION_LEDGER,
        mockExecutionConfig
      );

      expect(result.id).toBeDefined();

      // Step 3: Verify new contract owner
      ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(newContractOwner);
    });

    it('should handle ownership transfer when no owner exists', async () => {
      // Mock progression: null owner -> new owner set
      vi.mocked(readOwnership)
        .mockResolvedValueOnce({
          owner: null,
        })
        .mockResolvedValueOnce({
          owner: NEW_OWNER,
        });

      // Step 1: Verify no owner
      let ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBeNull();

      // Step 2: Transfer ownership with expiration
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER,
        mockExecutionConfig
      );

      expect(result.id).toBeDefined();

      // Step 3: Verify new owner is set
      ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(NEW_OWNER);
    });
  });

  describe('Transaction Data Validation', () => {
    it('should validate transfer_ownership transaction structure (two-step)', () => {
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER
      );

      // Verify all required fields are present
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('transfer_ownership');
      expect(txData.args).toHaveLength(2);
      expect(txData.argTypes).toHaveLength(2);
      expect(txData.argTypes[0]).toBe('Address');
      expect(txData.argTypes[1]).toBe('u32');
      expect(txData.args[0]).toBe(NEW_OWNER);
      expect(txData.args[1]).toBe(DEFAULT_EXPIRATION_LEDGER);
    });

    it('should handle new_owner and expiration parameters correctly', () => {
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER
      );

      // Verify arguments: new_owner first, live_until_ledger second
      expect(txData.args[0]).toBe(NEW_OWNER);
      expect(txData.args[1]).toBe(DEFAULT_EXPIRATION_LEDGER);
    });
  });

  describe('Edge Cases', () => {
    it('should handle long Stellar account addresses', () => {
      const longAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        longAddress,
        DEFAULT_EXPIRATION_LEDGER
      );

      expect(txData.args[0]).toBe(longAddress);
      expect(txData.args[1]).toBe(DEFAULT_EXPIRATION_LEDGER);
    });

    it('should handle contract addresses as new owner', () => {
      const contractAddr = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        contractAddr,
        DEFAULT_EXPIRATION_LEDGER
      );

      expect(txData.args[0]).toBe(contractAddr);
      expect(txData.args[1]).toBe(DEFAULT_EXPIRATION_LEDGER);
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
    });

    it('should preserve contract address in transaction data', () => {
      const txData = assembleTransferOwnershipAction(
        TEST_CONTRACT,
        NEW_OWNER,
        DEFAULT_EXPIRATION_LEDGER
      );

      expect(txData.contractAddress).toBe(TEST_CONTRACT);
    });
  });
});

describe('Access Control Service - Export Snapshot (T027)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockContractSchema: ContractSchema;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    queryPendingOwnershipTransfer: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const TEST_ACCOUNT_1 = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const TEST_ROLE_ADMIN = 'admin';
  const TEST_ROLE_MINTER = 'minter';

  beforeEach(async () => {
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

    mockContractSchema = {
      ecosystem: 'stellar',
      address: TEST_CONTRACT,
      functions: [
        {
          id: 'get_owner',
          name: 'get_owner',
          displayName: 'get_owner',
          type: 'function',
          inputs: [],
          outputs: [{ name: 'owner', type: 'Address' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'has_role',
          name: 'has_role',
          displayName: 'has_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [{ name: 'result', type: 'u32' }],
          modifiesState: false,
          stateMutability: 'view',
        },
      ],
    };

    // Setup mock indexer client (unavailable by default for basic snapshot tests)
    mockIndexerClient = {
      checkAvailability: vi.fn().mockResolvedValue(false),
      queryPendingOwnershipTransfer: vi.fn().mockResolvedValue(null),
      queryHistory: vi.fn(),
      discoverRoleIds: vi.fn(),
    };

    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('Snapshot Parity Tests', () => {
    /**
     * These tests verify that exportSnapshot faithfully represents current state
     * by comparing the snapshot to fresh reads from getOwnership and getCurrentRoles
     */

    it('should export snapshot that matches current ownership', async () => {
      // Mock: Contract has an owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: No roles
      vi.mocked(readCurrentRoles).mockResolvedValue([]);

      // Get fresh ownership
      const ownership = await service.getOwnership(TEST_CONTRACT);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify parity
      expect(snapshot.ownership).toEqual(ownership);
      expect(snapshot.ownership?.owner).toBe(TEST_OWNER);
    });

    it('should export snapshot that matches current roles', async () => {
      // Setup: Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [
        TEST_ROLE_ADMIN,
        TEST_ROLE_MINTER,
      ]);

      // Mock: Contract has roles
      // Use TEST_OWNER instead of TEST_ACCOUNT_2 to avoid duplicate address validation issues
      const mockRoles = [
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [TEST_ACCOUNT_1, TEST_OWNER],
        },
        {
          role: { id: TEST_ROLE_MINTER, label: TEST_ROLE_MINTER },
          members: [TEST_ACCOUNT_1],
        },
      ];

      vi.mocked(readCurrentRoles).mockResolvedValue(mockRoles);

      // Mock: No ownership
      vi.mocked(readOwnership).mockRejectedValue(new Error('Not Ownable'));

      // Get fresh roles
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify parity
      expect(snapshot.roles).toEqual(roles);
      expect(snapshot.roles).toHaveLength(2);
      expect(snapshot.roles[0].members).toEqual([TEST_ACCOUNT_1, TEST_OWNER]);
      expect(snapshot.roles[1].members).toEqual([TEST_ACCOUNT_1]);
    });

    it('should export snapshot that matches both ownership and roles', async () => {
      // Setup: Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock: Contract has ownership and roles
      const mockOwnership = { owner: TEST_OWNER };
      const mockRoles = [
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [TEST_ACCOUNT_1],
        },
      ];

      vi.mocked(readOwnership).mockResolvedValue(mockOwnership);
      vi.mocked(readCurrentRoles).mockResolvedValue(mockRoles);

      // Get fresh reads
      const ownership = await service.getOwnership(TEST_CONTRACT);
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify parity
      expect(snapshot.ownership).toEqual(ownership);
      expect(snapshot.roles).toEqual(roles);
      expect(snapshot.ownership?.owner).toBe(TEST_OWNER);
      expect(snapshot.roles[0].members).toContain(TEST_ACCOUNT_1);
    });

    it('should export empty snapshot when contract has no ownership or roles', async () => {
      // Mock: Contract has neither ownership nor roles
      vi.mocked(readOwnership).mockRejectedValue(new Error('Not Ownable'));
      vi.mocked(readCurrentRoles).mockResolvedValue([]);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify empty snapshot
      expect(snapshot.roles).toEqual([]);
      expect(snapshot.ownership).toBeUndefined();
    });

    it('should export snapshot with null owner when ownership exists but no owner set', async () => {
      // Mock: Contract is Ownable but owner is null
      vi.mocked(readOwnership).mockResolvedValue({ owner: null });
      vi.mocked(readCurrentRoles).mockResolvedValue([]);

      // Get fresh ownership
      const ownership = await service.getOwnership(TEST_CONTRACT);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify parity
      expect(snapshot.ownership).toEqual(ownership);
      expect(snapshot.ownership?.owner).toBeNull();
    });

    it('should handle multiple calls returning consistent snapshots', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      const mockOwnership = { owner: TEST_OWNER };
      const mockRoles = [
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [TEST_ACCOUNT_1],
        },
      ];

      vi.mocked(readOwnership).mockResolvedValue(mockOwnership);
      vi.mocked(readCurrentRoles).mockResolvedValue(mockRoles);

      // Export snapshot twice
      const snapshot1 = await service.exportSnapshot(TEST_CONTRACT);
      const snapshot2 = await service.exportSnapshot(TEST_CONTRACT);

      // Verify consistency
      expect(snapshot1).toEqual(snapshot2);
      expect(snapshot1.ownership).toEqual(snapshot2.ownership);
      expect(snapshot1.roles).toEqual(snapshot2.roles);
    });
  });

  describe('Snapshot Validation', () => {
    it('should produce valid snapshot structure', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      vi.mocked(readOwnership).mockResolvedValue({ owner: TEST_OWNER });
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [TEST_ACCOUNT_1],
        },
      ]);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify structure
      expect(snapshot).toHaveProperty('roles');
      expect(snapshot).toHaveProperty('ownership');
      expect(Array.isArray(snapshot.roles)).toBe(true);
      expect(typeof snapshot.ownership).toBe('object');
    });

    it('should handle roles with empty member lists', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      vi.mocked(readOwnership).mockResolvedValue({ owner: TEST_OWNER });
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [], // Empty members list
        },
      ]);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify snapshot handles empty members
      expect(snapshot.roles).toHaveLength(1);
      expect(snapshot.roles[0].members).toEqual([]);
    });

    it('should handle roles with multiple members', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Use only two members to avoid duplicate address validation issues
      // (TEST_ACCOUNT_1 and TEST_OWNER are different valid addresses)
      const multipleMembers = [TEST_ACCOUNT_1, TEST_OWNER];

      vi.mocked(readOwnership).mockResolvedValue({ owner: TEST_OWNER });
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: multipleMembers,
        },
      ]);

      // Export snapshot
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify all members are included
      expect(snapshot.roles[0].members).toEqual(multipleMembers);
      expect(snapshot.roles[0].members).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ownership read failure gracefully', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock: Ownership fails, but roles succeed
      vi.mocked(readOwnership).mockRejectedValue(new Error('Contract not Ownable'));
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: TEST_ROLE_ADMIN },
          members: [TEST_ACCOUNT_1],
        },
      ]);

      // Export snapshot should not throw
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify snapshot has roles but no ownership
      expect(snapshot.roles).toHaveLength(1);
      expect(snapshot.ownership).toBeUndefined();
    });

    it('should handle roles read failure gracefully', async () => {
      // Mock: Ownership succeeds, but roles fail
      vi.mocked(readOwnership).mockResolvedValue({ owner: TEST_OWNER });
      vi.mocked(readCurrentRoles).mockRejectedValue(new Error('Contract not registered'));

      // Export snapshot should not throw
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify snapshot has ownership but no roles
      expect(snapshot.ownership?.owner).toBe(TEST_OWNER);
      expect(snapshot.roles).toEqual([]);
    });

    it('should handle both reads failing gracefully', async () => {
      // Mock: Both reads fail
      vi.mocked(readOwnership).mockRejectedValue(new Error('Not Ownable'));
      vi.mocked(readCurrentRoles).mockRejectedValue(new Error('Not registered'));

      // Export snapshot should not throw
      const snapshot = await service.exportSnapshot(TEST_CONTRACT);

      // Verify empty snapshot
      expect(snapshot.roles).toEqual([]);
      expect(snapshot.ownership).toBeUndefined();
    });
  });
});

// Mock the indexer client for discovery tests
vi.mock('../../src/access-control/indexer-client', () => ({
  createIndexerClient: vi.fn(),
  StellarIndexerClient: vi.fn(),
}));

describe('Access Control Service - Role Discovery', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockContractSchema: ContractSchema;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    queryLatestGrants: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_ROLE_ADMIN = 'admin';
  const TEST_ROLE_MINTER = 'minter';
  const TEST_ACCOUNT = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';

  beforeEach(async () => {
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

    mockContractSchema = {
      ecosystem: 'stellar',
      address: TEST_CONTRACT,
      functions: [
        {
          id: 'has_role',
          name: 'has_role',
          displayName: 'has_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [{ name: 'result', type: 'u32' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'grant_role',
          name: 'grant_role',
          displayName: 'grant_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'revoke_role',
          name: 'revoke_role',
          displayName: 'revoke_role',
          type: 'function',
          inputs: [
            { name: 'account', type: 'Address' },
            { name: 'role', type: 'Symbol' },
          ],
          outputs: [],
          modifiesState: true,
          stateMutability: 'nonpayable',
        },
        {
          id: 'get_role_member_count',
          name: 'get_role_member_count',
          displayName: 'get_role_member_count',
          type: 'function',
          inputs: [{ name: 'role', type: 'Symbol' }],
          outputs: [{ name: 'count', type: 'u32' }],
          modifiesState: false,
          stateMutability: 'view',
        },
        {
          id: 'get_role_member',
          name: 'get_role_member',
          displayName: 'get_role_member',
          type: 'function',
          inputs: [
            { name: 'role', type: 'Symbol' },
            { name: 'index', type: 'u32' },
          ],
          outputs: [{ name: 'member', type: 'Address' }],
          modifiesState: false,
          stateMutability: 'view',
        },
      ],
    };

    // Setup mock indexer client
    mockIndexerClient = {
      checkAvailability: vi.fn(),
      discoverRoleIds: vi.fn(),
      queryHistory: vi.fn(),
      queryLatestGrants: vi.fn(),
    };

    // Override the createIndexerClient to return our mock
    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('discoverKnownRoleIds()', () => {
    it('should return explicitly provided knownRoleIds without querying indexer', async () => {
      // Register contract with explicit role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema, [
        TEST_ROLE_ADMIN,
        TEST_ROLE_MINTER,
      ]);

      // Discover roles
      const roleIds = await service.discoverKnownRoleIds(TEST_CONTRACT);

      // Verify explicit roles returned
      expect(roleIds).toEqual([TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);
      // Indexer should not be queried
      expect(mockIndexerClient.checkAvailability).not.toHaveBeenCalled();
      expect(mockIndexerClient.discoverRoleIds).not.toHaveBeenCalled();
    });

    it('should discover roles via indexer when not explicitly provided', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer availability and discovery
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.discoverRoleIds.mockResolvedValue([TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);

      // Discover roles
      const roleIds = await service.discoverKnownRoleIds(TEST_CONTRACT);

      // Verify discovered roles returned
      expect(roleIds).toEqual([TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);
      expect(mockIndexerClient.checkAvailability).toHaveBeenCalled();
      expect(mockIndexerClient.discoverRoleIds).toHaveBeenCalledWith(TEST_CONTRACT);
    });

    it('should cache discovered roles and not re-query indexer', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.discoverRoleIds.mockResolvedValue([TEST_ROLE_ADMIN]);

      // First discovery
      const roleIds1 = await service.discoverKnownRoleIds(TEST_CONTRACT);
      expect(roleIds1).toEqual([TEST_ROLE_ADMIN]);
      expect(mockIndexerClient.discoverRoleIds).toHaveBeenCalledTimes(1);

      // Second discovery should use cache
      const roleIds2 = await service.discoverKnownRoleIds(TEST_CONTRACT);
      expect(roleIds2).toEqual([TEST_ROLE_ADMIN]);
      // Indexer should NOT be called again
      expect(mockIndexerClient.discoverRoleIds).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when indexer is unavailable', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer unavailable
      mockIndexerClient.checkAvailability.mockResolvedValue(false);

      // Discover roles
      const roleIds = await service.discoverKnownRoleIds(TEST_CONTRACT);

      // Verify empty array returned
      expect(roleIds).toEqual([]);
      expect(mockIndexerClient.checkAvailability).toHaveBeenCalled();
      expect(mockIndexerClient.discoverRoleIds).not.toHaveBeenCalled();
    });

    it('should not retry discovery after failure', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer error
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.discoverRoleIds.mockRejectedValue(new Error('Network error'));

      // First discovery fails
      const roleIds1 = await service.discoverKnownRoleIds(TEST_CONTRACT);
      expect(roleIds1).toEqual([]);

      // Reset mock to return success
      mockIndexerClient.discoverRoleIds.mockResolvedValue([TEST_ROLE_ADMIN]);

      // Second discovery should not retry (uses cached "attempted" flag)
      const roleIds2 = await service.discoverKnownRoleIds(TEST_CONTRACT);
      expect(roleIds2).toEqual([]);
      // Should only have been called once (before failure was recorded)
      expect(mockIndexerClient.discoverRoleIds).toHaveBeenCalledTimes(1);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      await expect(service.discoverKnownRoleIds(TEST_CONTRACT)).rejects.toThrow(
        'Contract not registered'
      );
    });
  });

  describe('getCurrentRoles() with Discovery', () => {
    it('should use discovered roles when knownRoleIds not provided', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer discovery
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.discoverRoleIds.mockResolvedValue([TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Get current roles
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Verify discovery was used and roles returned
      expect(mockIndexerClient.discoverRoleIds).toHaveBeenCalledWith(TEST_CONTRACT);
      expect(readCurrentRoles).toHaveBeenCalledWith(
        TEST_CONTRACT,
        [TEST_ROLE_ADMIN],
        mockNetworkConfig
      );
      expect(roles).toHaveLength(1);
      expect(roles[0].role.id).toBe(TEST_ROLE_ADMIN);
    });

    it('should use explicit knownRoleIds without discovery', async () => {
      // Register contract with explicit role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Get current roles
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Verify indexer was NOT queried
      expect(mockIndexerClient.checkAvailability).not.toHaveBeenCalled();
      expect(mockIndexerClient.discoverRoleIds).not.toHaveBeenCalled();

      // Verify roles returned correctly
      expect(readCurrentRoles).toHaveBeenCalledWith(
        TEST_CONTRACT,
        [TEST_ROLE_ADMIN],
        mockNetworkConfig
      );
      expect(roles).toHaveLength(1);
    });

    it('should return empty array when no roles found and discovery fails', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer unavailable
      mockIndexerClient.checkAvailability.mockResolvedValue(false);

      // Get current roles
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Verify empty array returned
      expect(roles).toEqual([]);
      expect(readCurrentRoles).not.toHaveBeenCalled();
    });
  });

  describe('addKnownRoleIds()', () => {
    it('should add role IDs to a registered contract with no prior roles', () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Add role IDs
      const result = service.addKnownRoleIds(TEST_CONTRACT, [TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);

      // Verify roles were added
      expect(result).toEqual([TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);
    });

    it('should merge with existing known role IDs', () => {
      // Register contract with initial role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Add more role IDs
      const result = service.addKnownRoleIds(TEST_CONTRACT, [TEST_ROLE_MINTER]);

      // Verify roles were merged
      expect(result).toEqual([TEST_ROLE_ADMIN, TEST_ROLE_MINTER]);
    });

    it('should deduplicate role IDs', () => {
      // Register contract with initial role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Add duplicate role IDs
      const result = service.addKnownRoleIds(TEST_CONTRACT, [
        TEST_ROLE_ADMIN,
        TEST_ROLE_MINTER,
        TEST_ROLE_ADMIN,
      ]);

      // Verify duplicates were removed
      expect(result).toHaveLength(2);
      expect(result).toContain(TEST_ROLE_ADMIN);
      expect(result).toContain(TEST_ROLE_MINTER);
    });

    it('should validate role IDs and reject invalid ones', () => {
      // Register contract
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Try to add invalid role IDs
      expect(() => service.addKnownRoleIds(TEST_CONTRACT, [''])).toThrow('non-empty string');
      expect(() => service.addKnownRoleIds(TEST_CONTRACT, ['123invalid'])).toThrow(
        'invalid characters'
      );
      expect(() => service.addKnownRoleIds(TEST_CONTRACT, ['admin-role'])).toThrow(
        'invalid characters'
      );
    });

    it('should throw ConfigurationInvalid for unregistered contract', () => {
      expect(() => service.addKnownRoleIds(TEST_CONTRACT, [TEST_ROLE_ADMIN])).toThrow(
        'Contract not registered'
      );
    });

    it('should return existing roles when adding empty array', () => {
      // Register contract with initial role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Add empty array
      const result = service.addKnownRoleIds(TEST_CONTRACT, []);

      // Verify existing roles returned
      expect(result).toEqual([TEST_ROLE_ADMIN]);
    });

    it('should merge with discovered roles if no known roles exist', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Mock indexer discovery
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.discoverRoleIds.mockResolvedValue([TEST_ROLE_ADMIN]);

      // First discover roles
      await service.discoverKnownRoleIds(TEST_CONTRACT);

      // Then add more roles
      const result = service.addKnownRoleIds(TEST_CONTRACT, [TEST_ROLE_MINTER]);

      // Verify roles were merged with discovered roles
      expect(result).toContain(TEST_ROLE_ADMIN);
      expect(result).toContain(TEST_ROLE_MINTER);
    });

    it('should make added roles available for getCurrentRoles()', async () => {
      // Register contract without role IDs
      service.registerContract(TEST_CONTRACT, mockContractSchema);

      // Add role IDs
      service.addKnownRoleIds(TEST_CONTRACT, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Get current roles - should NOT attempt discovery since we have known roles
      const roles = await service.getCurrentRoles(TEST_CONTRACT);

      // Verify roles returned and no discovery attempted
      expect(roles).toHaveLength(1);
      expect(mockIndexerClient.discoverRoleIds).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentRolesEnriched()', () => {
    it('should return enriched roles with timestamps when indexer is available', async () => {
      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Mock indexer availability and grant info
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryLatestGrants = vi.fn().mockResolvedValue(
        new Map([
          [
            TEST_ACCOUNT,
            {
              timestamp: '2024-01-15T10:00:00Z',
              txId: 'a'.repeat(64),
              ledger: 5000,
            },
          ],
        ])
      );

      // Get enriched roles
      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(1);
      expect(enrichedRoles[0].role.id).toBe(TEST_ROLE_ADMIN);
      expect(enrichedRoles[0].members).toHaveLength(1);

      const member = enrichedRoles[0].members[0];
      expect(member.address).toBe(TEST_ACCOUNT);
      expect(member.grantedAt).toBe('2024-01-15T10:00:00Z');
      expect(member.grantedTxId).toBe('a'.repeat(64));
      expect(member.grantedLedger).toBe(5000);
    });

    it('should return enriched roles without timestamps when indexer is unavailable (graceful degradation)', async () => {
      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Mock indexer unavailable
      mockIndexerClient.checkAvailability.mockResolvedValue(false);

      // Get enriched roles
      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(1);
      expect(enrichedRoles[0].role.id).toBe(TEST_ROLE_ADMIN);
      expect(enrichedRoles[0].members).toHaveLength(1);

      const member = enrichedRoles[0].members[0];
      expect(member.address).toBe(TEST_ACCOUNT);
      // Timestamps should be undefined when indexer unavailable
      expect(member.grantedAt).toBeUndefined();
      expect(member.grantedTxId).toBeUndefined();
      expect(member.grantedLedger).toBeUndefined();
    });

    it('should return empty array when no roles exist', async () => {
      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock no roles found
      vi.mocked(readCurrentRoles).mockResolvedValue([]);
      mockIndexerClient.checkAvailability.mockResolvedValue(true);

      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toEqual([]);
    });

    it('should handle multiple roles with multiple members', async () => {
      const TEST_ACCOUNT_2 = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

      // Register contract with multiple roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [
        TEST_ROLE_ADMIN,
        TEST_ROLE_MINTER,
      ]);

      // Mock on-chain role reading with multiple roles and members
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT, TEST_ACCOUNT_2],
        },
        {
          role: { id: TEST_ROLE_MINTER, label: 'minter' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Mock indexer availability and grant info for each role
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryLatestGrants = vi
        .fn()
        .mockResolvedValueOnce(
          // First call for admin role
          new Map([
            [
              TEST_ACCOUNT,
              {
                timestamp: '2024-01-10T10:00:00Z',
                txId: 'admin-grant-1',
                ledger: 1000,
              },
            ],
            [
              TEST_ACCOUNT_2,
              {
                timestamp: '2024-01-12T12:00:00Z',
                txId: 'admin-grant-2',
                ledger: 2000,
              },
            ],
          ])
        )
        .mockResolvedValueOnce(
          // Second call for minter role
          new Map([
            [
              TEST_ACCOUNT,
              {
                timestamp: '2024-01-15T15:00:00Z',
                txId: 'minter-grant',
                ledger: 3000,
              },
            ],
          ])
        );

      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(2);

      // Verify admin role
      const adminRole = enrichedRoles.find((r) => r.role.id === TEST_ROLE_ADMIN);
      expect(adminRole).toBeDefined();
      expect(adminRole?.members).toHaveLength(2);
      expect(adminRole?.members[0].grantedAt).toBe('2024-01-10T10:00:00Z');
      expect(adminRole?.members[1].grantedAt).toBe('2024-01-12T12:00:00Z');

      // Verify minter role
      const minterRole = enrichedRoles.find((r) => r.role.id === TEST_ROLE_MINTER);
      expect(minterRole).toBeDefined();
      expect(minterRole?.members).toHaveLength(1);
      expect(minterRole?.members[0].grantedAt).toBe('2024-01-15T15:00:00Z');
    });

    it('should handle partial grant info (some members have grants, some do not)', async () => {
      const TEST_ACCOUNT_2 = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT, TEST_ACCOUNT_2],
        },
      ]);

      // Mock indexer with only partial grant info
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryLatestGrants = vi.fn().mockResolvedValue(
        new Map([
          // Only TEST_ACCOUNT has grant info
          [
            TEST_ACCOUNT,
            {
              timestamp: '2024-01-15T10:00:00Z',
              txId: 'partial-grant',
              ledger: 5000,
            },
          ],
        ])
      );

      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(1);
      expect(enrichedRoles[0].members).toHaveLength(2);

      // First member should have grant info
      expect(enrichedRoles[0].members[0].address).toBe(TEST_ACCOUNT);
      expect(enrichedRoles[0].members[0].grantedAt).toBe('2024-01-15T10:00:00Z');

      // Second member should have no grant info
      expect(enrichedRoles[0].members[1].address).toBe(TEST_ACCOUNT_2);
      expect(enrichedRoles[0].members[1].grantedAt).toBeUndefined();
    });

    it('should gracefully handle indexer query errors', async () => {
      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [TEST_ACCOUNT],
        },
      ]);

      // Mock indexer available but query fails
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryLatestGrants = vi.fn().mockRejectedValue(new Error('Network timeout'));

      // Should not throw, but return roles without timestamps
      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(1);
      expect(enrichedRoles[0].members[0].address).toBe(TEST_ACCOUNT);
      expect(enrichedRoles[0].members[0].grantedAt).toBeUndefined();
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      await expect(service.getCurrentRolesEnriched(TEST_CONTRACT)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should handle roles with empty member arrays', async () => {
      // Register contract with roles
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE_ADMIN]);

      // Mock on-chain role reading with empty members
      vi.mocked(readCurrentRoles).mockResolvedValue([
        {
          role: { id: TEST_ROLE_ADMIN, label: 'admin' },
          members: [],
        },
      ]);

      mockIndexerClient.checkAvailability.mockResolvedValue(true);

      const enrichedRoles = await service.getCurrentRolesEnriched(TEST_CONTRACT);

      expect(enrichedRoles).toHaveLength(1);
      expect(enrichedRoles[0].role.id).toBe(TEST_ROLE_ADMIN);
      expect(enrichedRoles[0].members).toEqual([]);
    });
  });
});

/**
 * Unit tests for Two-Step Ownership State (Phase 3: US1)
 *
 * Tests: T015 - getOwnership() returning basic owner (no pending)
 *        T016 - getOwnership() returning pending state with pending owner and expiration
 *        T017 - getOwnership() returning expired state when currentLedger > expirationLedger
 *        T018 - getOwnership() returning renounced state when owner is null
 *        T019 - Graceful degradation when indexer unavailable
 */
describe('Access Control Service - Two-Step Ownership State (US1)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    queryPendingOwnershipTransfer: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const PENDING_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(async () => {
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
      indexerUri: 'http://localhost:3000/graphql',
    };

    // Setup mock indexer client
    mockIndexerClient = {
      checkAvailability: vi.fn(),
      queryPendingOwnershipTransfer: vi.fn(),
      queryHistory: vi.fn(),
      discoverRoleIds: vi.fn(),
    };

    // Override the createIndexerClient to return our mock
    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('getOwnership() with State (T015-T019)', () => {
    /**
     * T015: getOwnership() returning basic owner (no pending)
     * Verifies that when no pending transfer exists, state is 'owned'
     */
    it('T015: should return basic owner with state "owned" when no pending transfer exists', async () => {
      // Mock: Contract has an owner, no pending transfer
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: Indexer available but no pending transfer
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue(null);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      expect(ownership.owner).toBe(TEST_OWNER);
      expect(ownership.state).toBe('owned');
      expect(ownership.pendingTransfer).toBeUndefined();
    });

    /**
     * T016: getOwnership() returning pending state with pending owner and expiration
     * Verifies that when a pending transfer exists and not expired, state is 'pending'
     */
    it('T016: should return pending state with pending owner and expiration when transfer is pending', async () => {
      const currentLedger = 12340000;
      const expirationLedger = 12350000; // Future ledger - not expired

      // Mock: Contract has an owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: Indexer returns pending transfer (without liveUntilLedger - not stored in indexer)
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        previousOwner: TEST_OWNER,
        txHash: 'a'.repeat(64),
        timestamp: '2025-01-15T10:00:00Z',
        ledger: currentLedger - 100,
      });

      // Mock: On-chain readPendingOwner returns expiration (liveUntilLedger comes from on-chain)
      const { readPendingOwner, getCurrentLedger } = await import(
        '../../src/access-control/onchain-reader'
      );
      vi.mocked(readPendingOwner).mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        liveUntilLedger: expirationLedger,
      });

      // Mock: getCurrentLedger returns a ledger before expiration
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      expect(ownership.owner).toBe(TEST_OWNER);
      expect(ownership.state).toBe('pending');
      expect(ownership.pendingTransfer).toBeDefined();
      expect(ownership.pendingTransfer?.pendingOwner).toBe(PENDING_OWNER);
      expect(ownership.pendingTransfer?.expirationBlock).toBe(expirationLedger);
      expect(ownership.pendingTransfer?.initiatedAt).toBe('2025-01-15T10:00:00Z');
    });

    /**
     * T017: getOwnership() returning expired state when currentLedger > expirationLedger
     * Verifies that when pending transfer has expired, state is 'expired'
     */
    it('T017: should return expired state when pending transfer has expired', async () => {
      const expirationLedger = 12340000;
      const currentLedger = 12350000; // Current ledger is past expiration

      // Mock: Contract has an owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: Indexer returns pending transfer (without liveUntilLedger - not stored in indexer)
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        previousOwner: TEST_OWNER,
        txHash: 'a'.repeat(64),
        timestamp: '2025-01-15T10:00:00Z',
        ledger: expirationLedger - 1000,
      });

      // Mock: On-chain readPendingOwner returns expiration (liveUntilLedger comes from on-chain)
      const { readPendingOwner, getCurrentLedger } = await import(
        '../../src/access-control/onchain-reader'
      );
      vi.mocked(readPendingOwner).mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        liveUntilLedger: expirationLedger,
      });

      // Mock: getCurrentLedger returns a ledger after expiration
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      expect(ownership.owner).toBe(TEST_OWNER);
      expect(ownership.state).toBe('expired');
      expect(ownership.pendingTransfer).toBeDefined();
      expect(ownership.pendingTransfer?.pendingOwner).toBe(PENDING_OWNER);
    });

    /**
     * T018: getOwnership() returning renounced state when owner is null
     * Verifies that when owner is null/renounced, state is 'renounced'
     */
    it('T018: should return renounced state when owner is null', async () => {
      // Mock: Contract has no owner (renounced)
      vi.mocked(readOwnership).mockResolvedValue({
        owner: null,
      });

      // Mock: Indexer available but no pending transfer
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue(null);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      expect(ownership.owner).toBeNull();
      expect(ownership.state).toBe('renounced');
      expect(ownership.pendingTransfer).toBeUndefined();
    });

    /**
     * T019: Graceful degradation when indexer unavailable
     * Verifies that when indexer is unavailable, returns owner only with warning
     */
    it('T019: should return owner with "owned" state and warning when indexer unavailable (graceful degradation)', async () => {
      // Mock: Contract has an owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: Indexer unavailable
      mockIndexerClient.checkAvailability.mockResolvedValue(false);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      // Should still return basic ownership info
      expect(ownership.owner).toBe(TEST_OWNER);
      // State defaults to 'owned' when indexer unavailable (cannot determine pending state)
      expect(ownership.state).toBe('owned');
      // No pending transfer info without indexer
      expect(ownership.pendingTransfer).toBeUndefined();
    });

    /**
     * Additional test: Edge case - expiration at boundary
     */
    it('should handle boundary case where currentLedger equals expirationLedger (expired)', async () => {
      const ledger = 12340000;

      // Mock: Contract has an owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: TEST_OWNER,
      });

      // Mock: Indexer returns pending transfer (without liveUntilLedger - not stored in indexer)
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        previousOwner: TEST_OWNER,
        txHash: 'a'.repeat(64),
        timestamp: '2025-01-15T10:00:00Z',
        ledger: ledger - 100,
      });

      // Mock: On-chain readPendingOwner returns expiration at boundary
      const { readPendingOwner, getCurrentLedger } = await import(
        '../../src/access-control/onchain-reader'
      );
      vi.mocked(readPendingOwner).mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        liveUntilLedger: ledger,
      });

      // Mock: Current ledger equals expiration ledger
      vi.mocked(getCurrentLedger).mockResolvedValue(ledger);

      const ownership = await service.getOwnership(TEST_CONTRACT);

      // At boundary, should be considered expired per FR-020
      expect(ownership.state).toBe('expired');
    });

    /**
     * Additional test: Renounced owner with pending transfer should still be renounced
     */
    it('should return renounced state even if pending transfer exists when owner is null', async () => {
      // Mock: Contract has no owner (renounced)
      vi.mocked(readOwnership).mockResolvedValue({
        owner: null,
      });

      // Mock: Indexer shows old pending transfer (before renounce)
      // Note: This won't be queried since renounced check happens first
      mockIndexerClient.checkAvailability.mockResolvedValue(true);
      mockIndexerClient.queryPendingOwnershipTransfer.mockResolvedValue({
        pendingOwner: PENDING_OWNER,
        previousOwner: TEST_OWNER,
        txHash: 'a'.repeat(64),
        timestamp: '2025-01-15T10:00:00Z',
        ledger: 12340000,
      });

      const ownership = await service.getOwnership(TEST_CONTRACT);

      // Renounced takes precedence
      expect(ownership.owner).toBeNull();
      expect(ownership.state).toBe('renounced');
    });
  });
});

/**
 * Unit tests for Two-Step Ownership Transfer (Phase 4: US2)
 *
 * Tests: T028 - transferOwnership() with valid expiration
 *        T029 - transferOwnership() rejection when expiration <= current ledger
 *        T031 - Error message when non-owner attempts transfer
 */
describe('Access Control Service - Two-Step Ownership Transfer (US2)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockExecutionConfig: EoaExecutionConfig;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    queryPendingOwnershipTransfer: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const CURRENT_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const NEW_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(async () => {
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

    mockExecutionConfig = {
      method: 'eoa',
      allowAny: false,
      specificAddress: CURRENT_OWNER,
    };

    // Setup mock indexer client
    mockIndexerClient = {
      checkAvailability: vi.fn().mockResolvedValue(false),
      queryPendingOwnershipTransfer: vi.fn().mockResolvedValue(null),
      queryHistory: vi.fn(),
      discoverRoleIds: vi.fn(),
    };

    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('transferOwnership() with expiration (T028)', () => {
    /**
     * T028: transferOwnership() with valid expiration
     * Verifies that two-step transfer with valid expiration ledger initiates transfer correctly
     */
    it('T028: should initiate two-step ownership transfer with valid expiration ledger', async () => {
      const currentLedger = 12340000;
      const expirationLedger = currentLedger + 8640; // ~12 hours in ledgers

      // Mock: getCurrentLedger returns current ledger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Mock: Current owner
      vi.mocked(readOwnership).mockResolvedValue({
        owner: CURRENT_OWNER,
      });

      // Action: Transfer ownership with expiration
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        expirationLedger,
        mockExecutionConfig
      );

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/); // Stellar transaction hash pattern
    });

    /**
     * T028: Verify transfer data includes live_until_ledger
     */
    it('T028: should include live_until_ledger parameter in transfer transaction', async () => {
      const currentLedger = 12340000;
      const expirationLedger = currentLedger + 720; // ~1 hour

      // Mock: getCurrentLedger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Import transaction sender to verify arguments
      const { signAndBroadcastStellarTransaction } = await import('../../src/transaction/sender');

      // Action: Transfer ownership with expiration
      await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        expirationLedger,
        mockExecutionConfig
      );

      // Verify: Transaction data includes live_until_ledger
      expect(signAndBroadcastStellarTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: TEST_CONTRACT,
          functionName: 'transfer_ownership',
          args: [NEW_OWNER, expirationLedger],
          argTypes: ['Address', 'u32'],
        }),
        mockExecutionConfig,
        mockNetworkConfig,
        undefined,
        undefined
      );
    });
  });

  describe('transferOwnership() expiration validation (T029)', () => {
    /**
     * T029: transferOwnership() rejection when expiration <= current ledger
     * Verifies that transfers with expired or boundary expiration are rejected
     */
    it('T029: should reject transfer when expiration ledger has already passed', async () => {
      const currentLedger = 12350000;
      const expiredLedger = 12340000; // In the past

      // Mock: getCurrentLedger returns current ledger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Action & Verify: Should reject with specific error message
      await expect(
        service.transferOwnership(TEST_CONTRACT, NEW_OWNER, expiredLedger, mockExecutionConfig)
      ).rejects.toThrow(/expiration ledger/i);
    });

    /**
     * T029 + T035: Boundary condition - expiration equals current ledger
     */
    it('T029/T035: should reject transfer when expiration ledger equals current ledger (boundary condition)', async () => {
      const currentLedger = 12340000;
      const boundaryLedger = currentLedger; // Equal to current - invalid per FR-020

      // Mock: getCurrentLedger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Action & Verify: Should reject at boundary
      await expect(
        service.transferOwnership(TEST_CONTRACT, NEW_OWNER, boundaryLedger, mockExecutionConfig)
      ).rejects.toThrow(/must be strictly greater/i);
    });

    /**
     * T029: Verify specific error message format per FR-018
     */
    it('T029: should include current and expiration ledger values in error message (per FR-018)', async () => {
      const currentLedger = 12350000;
      const expiredLedger = 12340000;

      // Mock: getCurrentLedger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Action & Verify: Error message should include both ledger values
      await expect(
        service.transferOwnership(TEST_CONTRACT, NEW_OWNER, expiredLedger, mockExecutionConfig)
      ).rejects.toThrow(
        new RegExp(`${expiredLedger}.*${currentLedger}|${currentLedger}.*${expiredLedger}`)
      );
    });
  });

  describe('transferOwnership() authorization (T031)', () => {
    /**
     * T031: Error message when non-owner attempts transfer
     * Note: Authorization is enforced on-chain, but the error should be user-friendly
     * This test verifies the client-side validation passes valid requests through
     * The on-chain rejection is tested via integration tests
     */
    it('T031: should allow transfer initiation for valid addresses (authorization checked on-chain)', async () => {
      const currentLedger = 12340000;
      const expirationLedger = currentLedger + 720;

      // Mock: getCurrentLedger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Action: Non-owner (different from contract owner) initiates transfer
      // The actual authorization check happens on-chain
      const nonOwnerConfig: EoaExecutionConfig = {
        method: 'eoa',
        allowAny: false,
        specificAddress: NEW_OWNER, // Using a different address
      };

      // This should not throw client-side - authorization is on-chain
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        CURRENT_OWNER, // Transferring to original owner
        expirationLedger,
        nonOwnerConfig
      );

      // Transaction is submitted (on-chain will reject if not authorized)
      expect(result.id).toBeDefined();
    });
  });

  describe('transferOwnership() logging (T037)', () => {
    /**
     * T037: INFO logging for transfer initiation per NFR-004
     */
    it('T037: should log transfer initiation at INFO level', async () => {
      const currentLedger = 12340000;
      const expirationLedger = currentLedger + 720;
      const { logger } = await import('@openzeppelin/ui-builder-utils');

      // Mock: getCurrentLedger
      const { getCurrentLedger } = await import('../../src/access-control/onchain-reader');
      vi.mocked(getCurrentLedger).mockResolvedValue(currentLedger);

      // Action: Transfer ownership
      await service.transferOwnership(
        TEST_CONTRACT,
        NEW_OWNER,
        expirationLedger,
        mockExecutionConfig
      );

      // Verify: INFO logging occurred
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('transferOwnership'),
        expect.stringContaining(NEW_OWNER)
      );
    });
  });
});

/**
 * Unit tests for Accept Ownership Transfer (Phase 5: US3)
 *
 * Tests: T039 - acceptOwnership() successfully completing transfer
 *        T040 - acceptOwnership() rejection when transfer expired
 *        T042 - Error message when non-pending-owner attempts accept
 */
describe('Access Control Service - Accept Ownership Transfer (US3)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockExecutionConfig: EoaExecutionConfig;
  let mockIndexerClient: {
    checkAvailability: ReturnType<typeof vi.fn>;
    queryPendingOwnershipTransfer: ReturnType<typeof vi.fn>;
    queryHistory: ReturnType<typeof vi.fn>;
    discoverRoleIds: ReturnType<typeof vi.fn>;
  };

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const CURRENT_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const PENDING_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(async () => {
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

    mockExecutionConfig = {
      method: 'eoa',
      allowAny: false,
      specificAddress: PENDING_OWNER, // Pending owner accepts
    };

    // Setup mock indexer client
    mockIndexerClient = {
      checkAvailability: vi.fn().mockResolvedValue(false),
      queryPendingOwnershipTransfer: vi.fn().mockResolvedValue(null),
      queryHistory: vi.fn(),
      discoverRoleIds: vi.fn(),
    };

    const { createIndexerClient } = await import('../../src/access-control/indexer-client');
    vi.mocked(createIndexerClient).mockReturnValue(
      mockIndexerClient as unknown as ReturnType<typeof createIndexerClient>
    );

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('acceptOwnership() success (T039)', () => {
    /**
     * T039: acceptOwnership() successfully completing transfer
     * Verifies that pending owner can accept ownership transfer
     */
    it('T039: should successfully accept pending ownership transfer', async () => {
      // Action: Accept ownership
      const result = await service.acceptOwnership(TEST_CONTRACT, mockExecutionConfig);

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/); // Stellar transaction hash pattern
    });

    /**
     * T039: Verify accept_ownership function is called
     */
    it('T039: should call accept_ownership function on contract', async () => {
      // Import transaction sender to verify arguments
      const { signAndBroadcastStellarTransaction } = await import('../../src/transaction/sender');

      // Action: Accept ownership
      await service.acceptOwnership(TEST_CONTRACT, mockExecutionConfig);

      // Verify: Transaction data is correct
      expect(signAndBroadcastStellarTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: TEST_CONTRACT,
          functionName: 'accept_ownership',
          args: [],
          argTypes: [],
        }),
        mockExecutionConfig,
        mockNetworkConfig,
        undefined,
        undefined
      );
    });
  });

  describe('acceptOwnership() expiration handling (T040)', () => {
    /**
     * T040: acceptOwnership() handles expired transfer
     * Note: Expiration is enforced on-chain. The client can optionally pre-check
     * but per clarification, the main error comes from on-chain rejection.
     * This test verifies the client-side behavior when on-chain rejects.
     */
    it('T040: should allow acceptance attempt (expiration enforced on-chain)', async () => {
      // The acceptance attempt goes through client-side
      // On-chain will reject if expired, but client doesn't pre-check per spec clarification
      const result = await service.acceptOwnership(TEST_CONTRACT, mockExecutionConfig);

      // Transaction is submitted (on-chain will reject if expired)
      expect(result.id).toBeDefined();
    });

    /**
     * T040: acceptOwnership() with expired transfer shows appropriate error
     * Simulates on-chain rejection due to expired transfer
     */
    it('T040: should propagate error when on-chain rejects due to expired transfer', async () => {
      // Mock: Transaction sender rejects (simulating on-chain rejection)
      const { signAndBroadcastStellarTransaction } = await import('../../src/transaction/sender');
      vi.mocked(signAndBroadcastStellarTransaction).mockRejectedValueOnce(
        new Error('Contract error: ownership transfer has expired')
      );

      // Action & Verify: Error is propagated
      await expect(service.acceptOwnership(TEST_CONTRACT, mockExecutionConfig)).rejects.toThrow(
        /expired/i
      );
    });
  });

  describe('acceptOwnership() authorization (T042)', () => {
    /**
     * T042: Error message when non-pending-owner attempts accept
     * Note: Authorization is enforced on-chain, but the error should be user-friendly
     */
    it('T042: should propagate error when on-chain rejects due to unauthorized caller', async () => {
      // Mock: Transaction sender rejects (simulating on-chain authorization rejection)
      const { signAndBroadcastStellarTransaction } = await import('../../src/transaction/sender');
      vi.mocked(signAndBroadcastStellarTransaction).mockRejectedValueOnce(
        new Error('Contract error: caller is not the pending owner')
      );

      // Non-pending owner tries to accept
      const nonPendingOwnerConfig: EoaExecutionConfig = {
        method: 'eoa',
        allowAny: false,
        specificAddress: CURRENT_OWNER, // Original owner, not pending owner
      };

      // Action & Verify: Error is propagated
      await expect(service.acceptOwnership(TEST_CONTRACT, nonPendingOwnerConfig)).rejects.toThrow(
        /pending owner|unauthorized|not.*owner/i
      );
    });

    /**
     * T042: Verify client allows acceptance attempt for any address
     * Authorization is enforced on-chain
     */
    it('T042: should allow acceptance attempt for any valid address (authorization checked on-chain)', async () => {
      const nonPendingOwnerConfig: EoaExecutionConfig = {
        method: 'eoa',
        allowAny: false,
        specificAddress: CURRENT_OWNER, // Different address
      };

      // This should not throw client-side - authorization is on-chain
      const result = await service.acceptOwnership(TEST_CONTRACT, nonPendingOwnerConfig);

      // Transaction is submitted (on-chain will reject if not authorized)
      expect(result.id).toBeDefined();
    });
  });

  describe('acceptOwnership() logging (T047)', () => {
    /**
     * T047: INFO logging for acceptance operations per NFR-004
     */
    it('T047: should log acceptance operation at INFO level', async () => {
      const { logger } = await import('@openzeppelin/ui-builder-utils');

      // Action: Accept ownership
      await service.acceptOwnership(TEST_CONTRACT, mockExecutionConfig);

      // Verify: INFO logging occurred
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('acceptOwnership'),
        expect.stringContaining(TEST_CONTRACT)
      );
    });
  });
});
