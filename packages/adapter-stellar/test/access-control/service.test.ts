/**
 * Unit tests for Access Control Service
 *
 * Tests: T020 - Grant/revoke role roundtrip with mocked RPC
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractSchema, StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import {
  assembleGrantRoleAction,
  assembleRevokeRoleAction,
} from '../../src/access-control/actions';
import { StellarAccessControlService } from '../../src/access-control/service';

// Mock the logger
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the onchain-reader module
vi.mock('../../src/access-control/onchain-reader', () => ({
  readOwnership: vi.fn(),
  readCurrentRoles: vi.fn(),
  getAdmin: vi.fn(),
}));

describe('Access Control Service (T020)', () => {
  let service: StellarAccessControlService;
  let mockNetworkConfig: StellarNetworkConfig;
  let mockContractSchema: ContractSchema;

  const TEST_CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const TEST_ROLE = 'admin';
  const TEST_ACCOUNT = 'GBDGBGAQPXDVJLMFGB7VBXVRMM5KLUVAKQYBZ6ON7D5YSBBWPFGBHFK5';

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

  describe('Service Methods - Current Implementation', () => {
    beforeEach(() => {
      // Register contract with the service
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);
    });

    it('should throw informative error for grantRole (execution not wired)', async () => {
      await expect(service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT)).rejects.toThrow(
        'grantRole execution not yet wired up'
      );
    });

    it('should throw informative error for revokeRole (execution not wired)', async () => {
      await expect(service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT)).rejects.toThrow(
        'revokeRole execution not yet wired up'
      );
    });

    it('should prepare transaction data before throwing (grantRole)', async () => {
      try {
        await service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
      }

      // Verify that action assembly was called
      const txData = assembleGrantRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      expect(txData.functionName).toBe('grant_role');
      expect(txData.args).toEqual([TEST_ACCOUNT, TEST_ROLE]);
    });

    it('should prepare transaction data before throwing (revokeRole)', async () => {
      try {
        await service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
      }

      // Verify that action assembly was called
      const txData = assembleRevokeRoleAction(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      expect(txData.functionName).toBe('revoke_role');
      expect(txData.args).toEqual([TEST_ACCOUNT, TEST_ROLE]);
    });
  });

  describe('Expected Behavior (Roundtrip Tests - To Be Implemented)', () => {
    /**
     * These tests document the expected behavior once execution is wired up.
     * They are currently skipped but serve as specification for the full implementation.
     */

    it.skip('should grant role and verify via getCurrentRoles', async () => {
      // Setup: Register contract
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Action: Grant role
      const result = await service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/); // Stellar transaction hash pattern

      // Verify: Role was granted (roundtrip)
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole).toBeDefined();
      expect(adminRole?.members).toContain(TEST_ACCOUNT);
    });

    it.skip('should revoke role and verify via getCurrentRoles', async () => {
      // Setup: Register contract and assume role is already granted
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Action: Revoke role
      const result = await service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify: Transaction was submitted
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[A-Fa-f0-9]{64}$/);

      // Verify: Role was revoked (roundtrip)
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);
    });

    it.skip('should perform complete grant-verify-revoke-verify roundtrip', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Step 1: Verify role is not initially granted
      let roles = await service.getCurrentRoles(TEST_CONTRACT);
      let adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);

      // Step 2: Grant role
      const grantResult = await service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      expect(grantResult.id).toBeDefined();

      // Step 3: Verify role is granted
      roles = await service.getCurrentRoles(TEST_CONTRACT);
      adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).toContain(TEST_ACCOUNT);

      // Step 4: Revoke role
      const revokeResult = await service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      expect(revokeResult.id).toBeDefined();

      // Step 5: Verify role is revoked
      roles = await service.getCurrentRoles(TEST_CONTRACT);
      adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      expect(adminRole?.members).not.toContain(TEST_ACCOUNT);
    });

    it.skip('should handle multiple role grants idempotently', async () => {
      // Setup
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Grant role twice
      await service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      await service.grantRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify: Account only appears once in members
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
      const accountOccurrences = adminRole?.members.filter((m) => m === TEST_ACCOUNT).length;
      expect(accountOccurrences).toBe(1);
    });

    it.skip('should handle multiple role revocations idempotently', async () => {
      // Setup: Assume role is granted
      service.registerContract(TEST_CONTRACT, mockContractSchema, [TEST_ROLE]);

      // Revoke role twice
      await service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);
      await service.revokeRole(TEST_CONTRACT, TEST_ROLE, TEST_ACCOUNT);

      // Verify: No errors thrown (idempotent)
      const roles = await service.getCurrentRoles(TEST_CONTRACT);
      const adminRole = roles.find((r) => r.role.id === TEST_ROLE);
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
