/**
 * Service Tests for EVM Access Control (Initial — Registration + Capabilities Suite)
 *
 * Tests the EvmAccessControlService class for contract registration, input validation,
 * role ID management, and capability detection.
 *
 * @see spec.md §US1 — acceptance scenarios 1–5
 * @see contracts/access-control-service.ts §Contract Registration + §Capability Detection
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractFunction, ContractSchema, OperationResult } from '@openzeppelin/ui-types';
import { ConfigurationInvalid } from '@openzeppelin/ui-types';

import { DEFAULT_ADMIN_ROLE } from '../../src/access-control/constants';
import { EvmAccessControlService } from '../../src/access-control/service';
import type { EvmTransactionExecutor } from '../../src/access-control/types';
import type { EvmCompatibleNetworkConfig } from '../../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFunction(name: string, inputTypes: string[] = []): ContractFunction {
  return {
    id: name,
    name,
    displayName: name,
    type: 'function',
    inputs: inputTypes.map((type, i) => ({ name: `param${i}`, type })),
    outputs: [],
    modifiesState: false,
    stateMutability: 'view',
  };
}

function createSchema(functions: ContractFunction[]): ContractSchema {
  return {
    ecosystem: 'evm',
    functions,
  };
}

// Pre-built schemas
const OWNABLE_SCHEMA = createSchema([
  createFunction('owner', []),
  createFunction('transferOwnership', ['address']),
]);

const OWNABLE_TWO_STEP_SCHEMA = createSchema([
  createFunction('owner', []),
  createFunction('transferOwnership', ['address']),
  createFunction('pendingOwner', []),
  createFunction('acceptOwnership', []),
]);

const ACCESS_CONTROL_SCHEMA = createSchema([
  createFunction('hasRole', ['bytes32', 'address']),
  createFunction('grantRole', ['bytes32', 'address']),
  createFunction('revokeRole', ['bytes32', 'address']),
  createFunction('getRoleAdmin', ['bytes32']),
]);

const ACCESS_CONTROL_ENUMERABLE_SCHEMA = createSchema([
  createFunction('hasRole', ['bytes32', 'address']),
  createFunction('grantRole', ['bytes32', 'address']),
  createFunction('revokeRole', ['bytes32', 'address']),
  createFunction('getRoleAdmin', ['bytes32']),
  createFunction('getRoleMemberCount', ['bytes32']),
  createFunction('getRoleMember', ['bytes32', 'uint256']),
]);

const DEFAULT_ADMIN_RULES_SCHEMA = createSchema([
  createFunction('hasRole', ['bytes32', 'address']),
  createFunction('grantRole', ['bytes32', 'address']),
  createFunction('revokeRole', ['bytes32', 'address']),
  createFunction('getRoleAdmin', ['bytes32']),
  createFunction('defaultAdmin', []),
  createFunction('pendingDefaultAdmin', []),
  createFunction('defaultAdminDelay', []),
  createFunction('beginDefaultAdminTransfer', ['address']),
  createFunction('acceptDefaultAdminTransfer', []),
  createFunction('cancelDefaultAdminTransfer', []),
]);

const COMBINED_SCHEMA = createSchema([
  createFunction('owner', []),
  createFunction('transferOwnership', ['address']),
  createFunction('pendingOwner', []),
  createFunction('acceptOwnership', []),
  createFunction('hasRole', ['bytes32', 'address']),
  createFunction('grantRole', ['bytes32', 'address']),
  createFunction('revokeRole', ['bytes32', 'address']),
  createFunction('getRoleAdmin', ['bytes32']),
  createFunction('getRoleMemberCount', ['bytes32']),
  createFunction('getRoleMember', ['bytes32', 'uint256']),
  createFunction('defaultAdmin', []),
  createFunction('pendingDefaultAdmin', []),
  createFunction('defaultAdminDelay', []),
  createFunction('beginDefaultAdminTransfer', ['address']),
  createFunction('acceptDefaultAdminTransfer', []),
  createFunction('cancelDefaultAdminTransfer', []),
  createFunction('changeDefaultAdminDelay', ['uint48']),
  createFunction('rollbackDefaultAdminDelay', []),
]);

const EMPTY_SCHEMA = createSchema([]);

// Test addresses and role IDs
const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';
const INVALID_ADDRESS = 'not-an-address';
const VALID_ROLE_ID = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
const VALID_ROLE_ID_2 = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a';
const INVALID_ROLE_ID = '0xinvalid';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockNetworkConfig: EvmCompatibleNetworkConfig = {
  id: 'ethereum-mainnet',
  name: 'Ethereum Mainnet',
  ecosystem: 'evm',
  chainId: 1,
  rpcUrl: 'https://rpc.example.com',
  explorerUrl: 'https://etherscan.io',
  accessControlIndexerUrl: 'https://indexer.example.com/graphql',
} as unknown as EvmCompatibleNetworkConfig;

const mockNetworkConfigNoIndexer: EvmCompatibleNetworkConfig = {
  id: 'ethereum-mainnet',
  name: 'Ethereum Mainnet',
  ecosystem: 'evm',
  chainId: 1,
  rpcUrl: 'https://rpc.example.com',
  explorerUrl: 'https://etherscan.io',
} as unknown as EvmCompatibleNetworkConfig;

const mockExecuteTransaction: EvmTransactionExecutor = vi.fn(
  async (): Promise<OperationResult> => ({ id: '0xmocktxhash' })
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EvmAccessControlService', () => {
  let service: EvmAccessControlService;

  beforeEach(() => {
    service = new EvmAccessControlService(mockNetworkConfig, mockExecuteTransaction);
  });

  afterEach(() => {
    service.dispose();
  });

  // ── Registration (registerContract) ───────────────────────────────────

  describe('registerContract', () => {
    it('should successfully register a contract with a valid address and schema', () => {
      expect(() => {
        service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      }).not.toThrow();
    });

    it('should register a contract with known role IDs', () => {
      expect(() => {
        service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [
          VALID_ROLE_ID,
          VALID_ROLE_ID_2,
        ]);
      }).not.toThrow();
    });

    it('should register a contract with an empty knownRoleIds array', () => {
      expect(() => {
        service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, []);
      }).not.toThrow();
    });

    it('should reject an invalid contract address', () => {
      expect(() => {
        service.registerContract(INVALID_ADDRESS, OWNABLE_SCHEMA);
      }).toThrow(ConfigurationInvalid);
    });

    it('should reject an empty contract address', () => {
      expect(() => {
        service.registerContract('', OWNABLE_SCHEMA);
      }).toThrow(ConfigurationInvalid);
    });

    it('should reject invalid role IDs at registration', () => {
      expect(() => {
        service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [INVALID_ROLE_ID]);
      }).toThrow(ConfigurationInvalid);
    });

    it('should deduplicate role IDs at registration', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [
        VALID_ROLE_ID,
        VALID_ROLE_ID,
        VALID_ROLE_ID_2,
      ]);
      // Verify deduplication by checking via addKnownRoleIds return value
      const result = service.addKnownRoleIds(VALID_ADDRESS, []);
      expect(result).toHaveLength(2);
      expect(result).toContain(VALID_ROLE_ID);
      expect(result).toContain(VALID_ROLE_ID_2);
    });

    it('should allow re-registration of the same address (overwrites)', () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      expect(() => {
        service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      }).not.toThrow();
    });

    it('should normalize contract address to lowercase', async () => {
      const checksummedAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      service.registerContract(checksummedAddress, OWNABLE_SCHEMA);

      // Should be accessible via lowercase
      const caps = await service.getCapabilities(checksummedAddress);
      expect(caps.hasOwnable).toBe(true);
    });

    it('should NOT auto-include DEFAULT_ADMIN_ROLE in knownRoleIds (FR-026)', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      // Verify DEFAULT_ADMIN_ROLE is not automatically added
      const result = service.addKnownRoleIds(VALID_ADDRESS, []);
      expect(result).not.toContain(DEFAULT_ADMIN_ROLE);
      expect(result).toHaveLength(0);
    });
  });

  // ── addKnownRoleIds ───────────────────────────────────────────────────

  describe('addKnownRoleIds', () => {
    it('should add new role IDs to a registered contract', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      const result = service.addKnownRoleIds(VALID_ADDRESS, [VALID_ROLE_ID]);

      expect(result).toContain(VALID_ROLE_ID);
    });

    it('should merge with existing known role IDs', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [VALID_ROLE_ID]);
      const result = service.addKnownRoleIds(VALID_ADDRESS, [VALID_ROLE_ID_2]);

      expect(result).toHaveLength(2);
      expect(result).toContain(VALID_ROLE_ID);
      expect(result).toContain(VALID_ROLE_ID_2);
    });

    it('should deduplicate when adding duplicate role IDs', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [VALID_ROLE_ID]);
      const result = service.addKnownRoleIds(VALID_ADDRESS, [VALID_ROLE_ID, VALID_ROLE_ID_2]);

      expect(result).toHaveLength(2);
    });

    it('should return existing role IDs when adding empty array', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [VALID_ROLE_ID]);
      const result = service.addKnownRoleIds(VALID_ADDRESS, []);

      expect(result).toContain(VALID_ROLE_ID);
    });

    it('should throw for unregistered contract', () => {
      expect(() => {
        service.addKnownRoleIds(VALID_ADDRESS, [VALID_ROLE_ID]);
      }).toThrow(ConfigurationInvalid);
      expect(() => {
        service.addKnownRoleIds(VALID_ADDRESS, [VALID_ROLE_ID]);
      }).toThrow('Contract not registered');
    });

    it('should throw for invalid contract address', () => {
      expect(() => {
        service.addKnownRoleIds(INVALID_ADDRESS, [VALID_ROLE_ID]);
      }).toThrow(ConfigurationInvalid);
    });

    it('should throw for invalid role IDs', () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      expect(() => {
        service.addKnownRoleIds(VALID_ADDRESS, [INVALID_ROLE_ID]);
      }).toThrow(ConfigurationInvalid);
    });
  });

  // ── getCapabilities ───────────────────────────────────────────────────

  describe('getCapabilities', () => {
    it('should detect Ownable-only capabilities', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(false);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
    });

    it('should detect Ownable2Step capabilities', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(true);
    });

    it('should detect AccessControl capabilities', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
    });

    it('should detect AccessControlEnumerable capabilities', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasEnumerableRoles).toBe(true);
    });

    it('should detect AccessControlDefaultAdminRules capabilities', async () => {
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(true);
    });

    it('should detect all capabilities for combined schema', async () => {
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(true);
      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(true);
      expect(caps.hasEnumerableRoles).toBe(true);
    });

    it('should return no capabilities for empty schema', async () => {
      service.registerContract(VALID_ADDRESS, EMPTY_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.hasOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(false);
    });

    it('should cache capabilities after first detection', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);

      const caps1 = await service.getCapabilities(VALID_ADDRESS);
      const caps2 = await service.getCapabilities(VALID_ADDRESS);

      // Should return the same object reference (cached)
      expect(caps1).toBe(caps2);
    });

    it('should throw for unregistered contract', async () => {
      await expect(service.getCapabilities(VALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
      await expect(service.getCapabilities(VALID_ADDRESS)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should throw for invalid address', async () => {
      await expect(service.getCapabilities(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });

    it('should set supportsHistory to true when indexer URL is configured', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      const caps = await service.getCapabilities(VALID_ADDRESS);

      expect(caps.supportsHistory).toBe(true);
    });

    it('should set supportsHistory to false when no indexer URL is configured', async () => {
      const serviceNoIndexer = new EvmAccessControlService(
        mockNetworkConfigNoIndexer,
        mockExecuteTransaction
      );
      serviceNoIndexer.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      const caps = await serviceNoIndexer.getCapabilities(VALID_ADDRESS);

      expect(caps.supportsHistory).toBe(false);
      serviceNoIndexer.dispose();
    });
  });

  // ── dispose ───────────────────────────────────────────────────────────

  describe('dispose', () => {
    it('should clear all registered contracts', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
      service.dispose();

      // After dispose, the contract should no longer be registered
      await expect(service.getCapabilities(VALID_ADDRESS)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should be safe to call multiple times', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
