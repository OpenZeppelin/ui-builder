/**
 * Service Tests for EVM Access Control
 *
 * Tests the EvmAccessControlService class for:
 * - Phase 3 (US1): Contract registration, input validation, role ID management, capability detection
 * - Phase 4 (US2): Ownership queries, admin info queries, indexer enrichment, graceful degradation
 *
 * @see spec.md §US1 — acceptance scenarios 1–5
 * @see spec.md §US2 — acceptance scenarios 1–6
 * @see contracts/access-control-service.ts §Contract Registration + §Capability Detection + §Ownership + §Admin
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AdminInfo,
  ContractFunction,
  ContractSchema,
  EnrichedRoleAssignment,
  OperationResult,
  OwnershipInfo,
  RoleAssignment,
} from '@openzeppelin/ui-types';
import { ConfigurationInvalid } from '@openzeppelin/ui-types';

import { DEFAULT_ADMIN_ROLE } from '../../src/access-control/constants';
import { EvmAccessControlService } from '../../src/access-control/service';
import type { EvmTransactionExecutor } from '../../src/access-control/types';
import type { EvmCompatibleNetworkConfig } from '../../src/types';

// ---------------------------------------------------------------------------
// Mock on-chain reader and indexer client for Phase 4 (US2) tests
// ---------------------------------------------------------------------------

const mockReadOwnership = vi.fn();
const mockGetAdmin = vi.fn();
const mockReadCurrentRoles = vi.fn();
const mockEnumerateRoleMembers = vi.fn();
const mockHasRole = vi.fn();

vi.mock('../../src/access-control/onchain-reader', () => ({
  readOwnership: (...args: unknown[]) => mockReadOwnership(...args),
  getAdmin: (...args: unknown[]) => mockGetAdmin(...args),
  readCurrentRoles: (...args: unknown[]) => mockReadCurrentRoles(...args),
  enumerateRoleMembers: (...args: unknown[]) => mockEnumerateRoleMembers(...args),
  hasRole: (...args: unknown[]) => mockHasRole(...args),
}));

const mockIndexerIsAvailable = vi.fn();
const mockQueryPendingOwnershipTransfer = vi.fn();
const mockQueryPendingAdminTransfer = vi.fn();
const mockQueryLatestGrants = vi.fn();

vi.mock('../../src/access-control/indexer-client', () => ({
  createIndexerClient: () => ({
    isAvailable: () => mockIndexerIsAvailable(),
    queryPendingOwnershipTransfer: (...args: unknown[]) =>
      mockQueryPendingOwnershipTransfer(...args),
    queryPendingAdminTransfer: (...args: unknown[]) => mockQueryPendingAdminTransfer(...args),
    queryLatestGrants: (...args: unknown[]) => mockQueryLatestGrants(...args),
  }),
}));

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

  // ── getOwnership (Phase 4 — US2) ─────────────────────────────────────

  describe('getOwnership', () => {
    const OWNER = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
    const PENDING_OWNER = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';

    beforeEach(() => {
      // Reset Phase 4 mocks to prevent leaking between tests
      mockReadOwnership.mockReset();
      mockGetAdmin.mockReset();
      mockIndexerIsAvailable.mockReset();
      mockQueryPendingOwnershipTransfer.mockReset();
      mockQueryPendingAdminTransfer.mockReset();

      // Register a contract for ownership tests
      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);
    });

    it('should return "owned" state when contract has an owner with no pending transfer', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: undefined,
      });

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      expect(result.owner).toBe(OWNER);
      expect(result.state).toBe('owned');
      expect(result.pendingTransfer).toBeUndefined();
    });

    it('should return "pending" state when there is a pending owner', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingOwnershipTransfer.mockResolvedValueOnce({
        pendingOwner: PENDING_OWNER,
        initiatedAt: '2026-01-15T10:00:00Z',
        initiatedTxId: '0xabc123',
        initiatedBlock: 12345,
      });

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      expect(result.owner).toBe(OWNER);
      expect(result.state).toBe('pending');
      expect(result.pendingTransfer).toBeDefined();
      expect(result.pendingTransfer!.pendingOwner).toBe(PENDING_OWNER);
      // EVM Ownable2Step has no expiration — expirationBlock should be undefined
      expect(result.pendingTransfer!.expirationBlock).toBeUndefined();
    });

    it('should return "renounced" state when owner is zero address', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: null,
        pendingOwner: undefined,
      });

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      expect(result.owner).toBeNull();
      expect(result.state).toBe('renounced');
      expect(result.pendingTransfer).toBeUndefined();
    });

    it('should never return "expired" state for EVM (FR-023)', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingOwnershipTransfer.mockResolvedValueOnce({
        pendingOwner: PENDING_OWNER,
        initiatedAt: '2026-01-01T00:00:00Z',
        initiatedTxId: '0xold',
        initiatedBlock: 1,
      });

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      // Should be 'pending', never 'expired' for EVM
      expect(result.state).not.toBe('expired');
    });

    it('should enrich pending transfer with indexer data when available', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingOwnershipTransfer.mockResolvedValueOnce({
        pendingOwner: PENDING_OWNER,
        initiatedAt: '2026-01-15T10:00:00Z',
        initiatedTxId: '0xabc123',
        initiatedBlock: 12345,
      });

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      expect(result.pendingTransfer!.initiatedAt).toBe('2026-01-15T10:00:00Z');
      expect(result.pendingTransfer!.initiatedTxId).toBe('0xabc123');
      expect(result.pendingTransfer!.initiatedBlock).toBe(12345);
    });

    it('should gracefully degrade without indexer (FR-017)', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      // Should still return pending state based on on-chain pendingOwner
      expect(result.owner).toBe(OWNER);
      expect(result.state).toBe('pending');
      expect(result.pendingTransfer!.pendingOwner).toBe(PENDING_OWNER);
      // No indexer enrichment
      expect(result.pendingTransfer!.initiatedAt).toBeUndefined();
    });

    it('should gracefully handle indexer query errors', async () => {
      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingOwnershipTransfer.mockRejectedValueOnce(new Error('Indexer error'));

      const result: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      // Should still return valid ownership data without enrichment
      expect(result.owner).toBe(OWNER);
      expect(result.state).toBe('pending');
    });

    it('should throw for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.getOwnership(unregisteredAddress)).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw for invalid address', async () => {
      await expect(service.getOwnership(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── getAdminInfo (Phase 4 — US2) ─────────────────────────────────────

  describe('getAdminInfo', () => {
    const ADMIN = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';
    const PENDING_ADMIN = '0xDdDdDdDdDDddDDddDDddDDDDdDdDDdDDdDDDDDDd';
    const ACCEPT_SCHEDULE = 1700000000;

    beforeEach(() => {
      // Reset Phase 4 mocks to prevent leaking between tests
      mockReadOwnership.mockReset();
      mockGetAdmin.mockReset();
      mockIndexerIsAvailable.mockReset();
      mockQueryPendingOwnershipTransfer.mockReset();
      mockQueryPendingAdminTransfer.mockReset();

      // Register with DefaultAdminRules schema
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should return "active" state when admin is set with no pending transfer', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: ADMIN,
        pendingDefaultAdmin: undefined,
        acceptSchedule: undefined,
        defaultAdminDelay: 86400,
      });

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.admin).toBe(ADMIN);
      expect(result.state).toBe('active');
      expect(result.pendingTransfer).toBeUndefined();
    });

    it('should return "pending" state when admin transfer is scheduled', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: ADMIN,
        pendingDefaultAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        defaultAdminDelay: 86400,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingAdminTransfer.mockResolvedValueOnce({
        pendingAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        initiatedAt: '2026-01-20T14:00:00Z',
        initiatedTxId: '0xdef456',
        initiatedBlock: 67890,
      });

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.admin).toBe(ADMIN);
      expect(result.state).toBe('pending');
      expect(result.pendingTransfer).toBeDefined();
      expect(result.pendingTransfer!.pendingAdmin).toBe(PENDING_ADMIN);
      // acceptSchedule maps to expirationBlock (UNIX timestamp, per R5)
      expect(result.pendingTransfer!.expirationBlock).toBe(ACCEPT_SCHEDULE);
    });

    it('should return "renounced" state when admin is zero address', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: null,
        pendingDefaultAdmin: undefined,
        acceptSchedule: undefined,
        defaultAdminDelay: 0,
      });

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.admin).toBeNull();
      expect(result.state).toBe('renounced');
    });

    it('should never return "expired" state for EVM (FR-023)', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: ADMIN,
        pendingDefaultAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        defaultAdminDelay: 86400,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.state).not.toBe('expired');
    });

    it('should enrich pending admin transfer with indexer data', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: ADMIN,
        pendingDefaultAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        defaultAdminDelay: 86400,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryPendingAdminTransfer.mockResolvedValueOnce({
        pendingAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        initiatedAt: '2026-01-20T14:00:00Z',
        initiatedTxId: '0xdef456',
        initiatedBlock: 67890,
      });

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.pendingTransfer!.initiatedAt).toBe('2026-01-20T14:00:00Z');
      expect(result.pendingTransfer!.initiatedTxId).toBe('0xdef456');
      expect(result.pendingTransfer!.initiatedBlock).toBe(67890);
    });

    it('should gracefully degrade without indexer', async () => {
      mockGetAdmin.mockResolvedValueOnce({
        defaultAdmin: ADMIN,
        pendingDefaultAdmin: PENDING_ADMIN,
        acceptSchedule: ACCEPT_SCHEDULE,
        defaultAdminDelay: 86400,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: AdminInfo = await service.getAdminInfo(VALID_ADDRESS);

      expect(result.admin).toBe(ADMIN);
      expect(result.state).toBe('pending');
      expect(result.pendingTransfer!.pendingAdmin).toBe(PENDING_ADMIN);
      expect(result.pendingTransfer!.expirationBlock).toBe(ACCEPT_SCHEDULE);
      // No indexer enrichment
      expect(result.pendingTransfer!.initiatedAt).toBeUndefined();
    });

    it('should throw for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.getAdminInfo(unregisteredAddress)).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw for invalid address', async () => {
      await expect(service.getAdminInfo(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── getCurrentRoles (Phase 5 — US3) ──────────────────────────────────

  describe('getCurrentRoles', () => {
    const MINTER_ROLE = VALID_ROLE_ID;
    const PAUSER_ROLE = VALID_ROLE_ID_2;
    const MEMBER_1 = '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe';
    const MEMBER_2 = '0xFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf';

    beforeEach(() => {
      mockReadOwnership.mockReset();
      mockGetAdmin.mockReset();
      mockReadCurrentRoles.mockReset();
      mockEnumerateRoleMembers.mockReset();
      mockHasRole.mockReset();
      mockIndexerIsAvailable.mockReset();
      mockQueryPendingOwnershipTransfer.mockReset();
      mockQueryPendingAdminTransfer.mockReset();
      mockQueryLatestGrants.mockReset();
    });

    it('should return role assignments via enumeration (hasEnumerableRoles)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [
        MINTER_ROLE,
        PAUSER_ROLE,
      ]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
        {
          role: { id: PAUSER_ROLE },
          members: [MEMBER_1, MEMBER_2],
        },
      ]);

      const result: RoleAssignment[] = await service.getCurrentRoles(VALID_ADDRESS);

      expect(result).toHaveLength(2);
      expect(result[0].role.id).toBe(MINTER_ROLE);
      expect(result[0].members).toContain(MEMBER_1);
      expect(result[1].role.id).toBe(PAUSER_ROLE);
      expect(result[1].members).toHaveLength(2);
    });

    it('should return role assignments via known role IDs + hasRole when not enumerable', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [MINTER_ROLE]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      const result: RoleAssignment[] = await service.getCurrentRoles(VALID_ADDRESS);

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(MINTER_ROLE);
    });

    it('should return empty array when no roles/indexer/enumeration available', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockReadCurrentRoles.mockResolvedValueOnce([]);
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: RoleAssignment[] = await service.getCurrentRoles(VALID_ADDRESS);

      expect(result).toHaveLength(0);
    });

    it('should map DEFAULT_ADMIN_ROLE label correctly', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [
        DEFAULT_ADMIN_ROLE,
      ]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: DEFAULT_ADMIN_ROLE, label: 'DEFAULT_ADMIN_ROLE' },
          members: [MEMBER_1],
        },
      ]);

      const result: RoleAssignment[] = await service.getCurrentRoles(VALID_ADDRESS);

      expect(result[0].role.label).toBe('DEFAULT_ADMIN_ROLE');
    });

    it('should NOT auto-include DEFAULT_ADMIN_ROLE in knownRoleIds on registration (FR-026)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      // Verify DEFAULT_ADMIN_ROLE is not automatically added
      const roleIds = service.addKnownRoleIds(VALID_ADDRESS, []);
      expect(roleIds).not.toContain(DEFAULT_ADMIN_ROLE);
    });

    it('should throw for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.getCurrentRoles(unregisteredAddress)).rejects.toThrow(
        ConfigurationInvalid
      );
    });

    it('should throw for invalid address', async () => {
      await expect(service.getCurrentRoles(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── getCurrentRolesEnriched (Phase 5 — US3) ──────────────────────────

  describe('getCurrentRolesEnriched', () => {
    const MINTER_ROLE = VALID_ROLE_ID;
    const MEMBER_1 = '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe';
    const MEMBER_2 = '0xFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf';

    beforeEach(() => {
      mockReadOwnership.mockReset();
      mockGetAdmin.mockReset();
      mockReadCurrentRoles.mockReset();
      mockEnumerateRoleMembers.mockReset();
      mockHasRole.mockReset();
      mockIndexerIsAvailable.mockReset();
      mockQueryPendingOwnershipTransfer.mockReset();
      mockQueryPendingAdminTransfer.mockReset();
      mockQueryLatestGrants.mockReset();
    });

    it('should return enriched role assignments with grant metadata', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [MINTER_ROLE]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1, MEMBER_2],
        },
      ]);

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryLatestGrants.mockResolvedValueOnce(
        new Map([
          [
            MEMBER_1.toLowerCase(),
            {
              account: MEMBER_1,
              role: MINTER_ROLE,
              grantedAt: '2026-01-10T08:00:00Z',
              txHash: '0xgrant1',
              grantedBy: '0xGranter0000000000000000000000000000000001',
            },
          ],
          [
            MEMBER_2.toLowerCase(),
            {
              account: MEMBER_2,
              role: MINTER_ROLE,
              grantedAt: '2026-01-12T12:00:00Z',
              txHash: '0xgrant2',
              grantedBy: '0xGranter0000000000000000000000000000000001',
            },
          ],
        ])
      );

      const result: EnrichedRoleAssignment[] = await service.getCurrentRolesEnriched(VALID_ADDRESS);

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(MINTER_ROLE);
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members[0].address).toBe(MEMBER_1);
      expect(result[0].members[0].grantedAt).toBe('2026-01-10T08:00:00Z');
      expect(result[0].members[0].grantedTxId).toBe('0xgrant1');
      /**
       * The `grantedLedger` field in `EnrichedRoleMember` stores an EVM block number
       * despite its Stellar-originated name. The `roleMemberships` query does not
       * return block numbers directly, so this field remains undefined when
       * enriching via the roleMemberships endpoint. See data-model.md §6.
       */
      expect(result[0].members[0].grantedLedger).toBeUndefined();
    });

    it('should return enriched structure without timestamps when indexer unavailable (graceful degradation)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [MINTER_ROLE]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: EnrichedRoleAssignment[] = await service.getCurrentRolesEnriched(VALID_ADDRESS);

      expect(result).toHaveLength(1);
      expect(result[0].members[0].address).toBe(MEMBER_1);
      expect(result[0].members[0].grantedAt).toBeUndefined();
      expect(result[0].members[0].grantedTxId).toBeUndefined();
      expect(result[0].members[0].grantedLedger).toBeUndefined();
    });

    it('should return on-chain data with warning when enrichment fails partially', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [MINTER_ROLE]);

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryLatestGrants.mockRejectedValueOnce(new Error('Indexer enrichment failed'));

      const result: EnrichedRoleAssignment[] = await service.getCurrentRolesEnriched(VALID_ADDRESS);

      // Should still return the role structure without enrichment
      expect(result).toHaveLength(1);
      expect(result[0].members[0].address).toBe(MEMBER_1);
      expect(result[0].members[0].grantedAt).toBeUndefined();
    });

    it('should return empty array when no roles exist', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockReadCurrentRoles.mockResolvedValueOnce([]);
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: EnrichedRoleAssignment[] = await service.getCurrentRolesEnriched(VALID_ADDRESS);

      expect(result).toHaveLength(0);
    });

    it('should throw for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.getCurrentRolesEnriched(unregisteredAddress)).rejects.toThrow(
        ConfigurationInvalid
      );
    });

    it('should throw for invalid address', async () => {
      await expect(service.getCurrentRolesEnriched(INVALID_ADDRESS)).rejects.toThrow(
        ConfigurationInvalid
      );
    });
  });
});
