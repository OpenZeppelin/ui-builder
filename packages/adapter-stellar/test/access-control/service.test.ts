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

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const CURRENT_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const NEW_OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

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

    mockExecutionConfig = {
      method: 'eoa',
      allowAny: false,
      specificAddress: CURRENT_OWNER,
    };

    service = new StellarAccessControlService(mockNetworkConfig);
  });

  describe('Action Assembly', () => {
    it('should assemble transfer_ownership action with correct parameters', () => {
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER);

      expect(txData).toEqual({
        contractAddress: TEST_CONTRACT,
        functionName: 'transfer_ownership',
        args: [NEW_OWNER],
        argTypes: ['Address'],
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

      // Action: Transfer ownership
      const result = await service.transferOwnership(TEST_CONTRACT, NEW_OWNER, mockExecutionConfig);

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

      // Step 2: Transfer ownership
      const result = await service.transferOwnership(TEST_CONTRACT, NEW_OWNER, mockExecutionConfig);
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

      // Step 2: Transfer to contract address
      const result = await service.transferOwnership(
        TEST_CONTRACT,
        newContractOwner,
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

      // Step 2: Transfer ownership
      const result = await service.transferOwnership(TEST_CONTRACT, NEW_OWNER, mockExecutionConfig);

      expect(result.id).toBeDefined();

      // Step 3: Verify new owner is set
      ownership = await service.getOwnership(TEST_CONTRACT);
      expect(ownership.owner).toBe(NEW_OWNER);
    });
  });

  describe('Transaction Data Validation', () => {
    it('should validate transfer_ownership transaction structure', () => {
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER);

      // Verify all required fields are present
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
      expect(txData.functionName).toBe('transfer_ownership');
      expect(txData.args).toHaveLength(1);
      expect(txData.argTypes).toHaveLength(1);
      expect(txData.argTypes[0]).toBe('Address');
      expect(txData.args[0]).toBe(NEW_OWNER);
    });

    it('should handle new_owner parameter correctly', () => {
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER);

      // Verify new_owner is the first and only argument
      expect(txData.args[0]).toBe(NEW_OWNER);
    });
  });

  describe('Edge Cases', () => {
    it('should handle long Stellar account addresses', () => {
      const longAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, longAddress);

      expect(txData.args[0]).toBe(longAddress);
    });

    it('should handle contract addresses as new owner', () => {
      const contractAddr = 'CANM3Y2GVGH6ACSHUORZ56ZFZ2FSFX6XEWPJYW7BNZVAXKSEQMBTDWD2';
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, contractAddr);

      expect(txData.args[0]).toBe(contractAddr);
      expect(txData.contractAddress).toBe(TEST_CONTRACT);
    });

    it('should preserve contract address in transaction data', () => {
      const txData = assembleTransferOwnershipAction(TEST_CONTRACT, NEW_OWNER);

      expect(txData.contractAddress).toBe(TEST_CONTRACT);
    });
  });
});

describe('Access Control Service - Export Snapshot (T027)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockContractSchema: ContractSchema;

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_OWNER = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
  const TEST_ACCOUNT_1 = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const TEST_ROLE_ADMIN = 'admin';
  const TEST_ROLE_MINTER = 'minter';

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
      ],
    };

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
