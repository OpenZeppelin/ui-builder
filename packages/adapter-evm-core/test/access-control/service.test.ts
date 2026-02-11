/**
 * Service Tests for EVM Access Control
 *
 * Tests the EvmAccessControlService class for:
 * - Phase 3 (US1): Contract registration, input validation, role ID management, capability detection
 * - Phase 4 (US2): Ownership queries, admin info queries, indexer enrichment, graceful degradation
 * - Phase 5 (US3): Role queries, enriched role assignments, graceful degradation
 * - Phase 6 (US4): Ownership transfer, accept, renounce — write operations
 * - Phase 7 (US5): Admin transfer, accept, cancel, delay change, delay rollback — write operations
 * - Phase 8 (US6): Role management — grantRole, revokeRole, renounceRole write operations
 * - Phase 9 (US7): History queries — getHistory with filtering, pagination, graceful degradation
 * - Phase 10 (US8): Snapshot export — exportSnapshot with roles + optional ownership, validation
 * - Phase 11 (US9): Role discovery — discoverKnownRoleIds with caching, precedence, graceful degradation
 *
 * @see spec.md §US1 — acceptance scenarios 1–5
 * @see spec.md §US2 — acceptance scenarios 1–6
 * @see spec.md §US4 — acceptance scenarios 1–5
 * @see spec.md §US5 — acceptance scenarios 1–6
 * @see spec.md §US6 — acceptance scenarios 1–5
 * @see spec.md §US7 — acceptance scenarios 1–3
 * @see spec.md §US8 — acceptance scenarios 1–3
 * @see contracts/access-control-service.ts §Contract Registration + §Capability Detection + §Ownership + §Admin + §Roles + §History & Snapshots
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AccessSnapshot,
  AdminInfo,
  ContractFunction,
  ContractSchema,
  EnrichedRoleAssignment,
  OperationResult,
  OwnershipInfo,
  PaginatedHistoryResult,
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
const mockQueryHistory = vi.fn();
const mockDiscoverRoleIds = vi.fn();

vi.mock('../../src/access-control/indexer-client', () => ({
  createIndexerClient: () => ({
    isAvailable: () => mockIndexerIsAvailable(),
    queryPendingOwnershipTransfer: (...args: unknown[]) =>
      mockQueryPendingOwnershipTransfer(...args),
    queryPendingAdminTransfer: (...args: unknown[]) => mockQueryPendingAdminTransfer(...args),
    queryLatestGrants: (...args: unknown[]) => mockQueryLatestGrants(...args),
    queryHistory: (...args: unknown[]) => mockQueryHistory(...args),
    discoverRoleIds: (...args: unknown[]) => mockDiscoverRoleIds(...args),
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

  // ── transferOwnership (Phase 6 — US4) ────────────────────────────────

  describe('transferOwnership', () => {
    const NEW_OWNER = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.transferOwnership(
        VALID_ADDRESS,
        NEW_OWNER,
        undefined,
        MOCK_EXECUTION_CONFIG
      );

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('transferOwnership');
      expect(txData.args).toEqual([NEW_OWNER]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should ignore expirationBlock for EVM (FR-023)', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      // Pass a non-undefined expirationBlock — should be ignored
      await service.transferOwnership(VALID_ADDRESS, NEW_OWNER, 999999, MOCK_EXECUTION_CONFIG);

      // Verify the assembled transaction doesn't include expirationBlock in args
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('transferOwnership');
      expect(txData.args).toEqual([NEW_OWNER]);
      // Only one arg: newOwner
      expect(txData.args).toHaveLength(1);
    });

    it('should pass executionConfig to callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.transferOwnership(VALID_ADDRESS, NEW_OWNER, undefined, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[1]).toBe(MOCK_EXECUTION_CONFIG);
    });

    it('should pass onStatusChange callback when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.transferOwnership(
        VALID_ADDRESS,
        NEW_OWNER,
        undefined,
        MOCK_EXECUTION_CONFIG,
        onStatusChange
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
    });

    it('should pass runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.transferOwnership(
        VALID_ADDRESS,
        NEW_OWNER,
        undefined,
        MOCK_EXECUTION_CONFIG,
        undefined,
        'test-api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[3]).toBe('test-api-key');
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.transferOwnership(unregisteredAddress, NEW_OWNER, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
      await expect(
        service.transferOwnership(unregisteredAddress, NEW_OWNER, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow('Contract not registered');
    });

    it('should throw ConfigurationInvalid for invalid contract address', async () => {
      await expect(
        service.transferOwnership(INVALID_ADDRESS, NEW_OWNER, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid new owner address', async () => {
      await expect(
        service.transferOwnership(VALID_ADDRESS, 'not-an-address', undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── acceptOwnership (Phase 6 — US4) ─────────────────────────────────

  describe('acceptOwnership', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.acceptOwnership(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('acceptOwnership');
      expect(txData.args).toEqual([]);
    });

    it('should use the normalized contract address', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.acceptOwnership(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.acceptOwnership(unregisteredAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(service.acceptOwnership(INVALID_ADDRESS, MOCK_EXECUTION_CONFIG)).rejects.toThrow(
        ConfigurationInvalid
      );
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.acceptOwnership(
        VALID_ADDRESS,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── renounceOwnership (Phase 6 — US4, EVM-specific) ─────────────────

  describe('renounceOwnership', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.renounceOwnership(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('renounceOwnership');
      expect(txData.args).toEqual([]);
    });

    it('should use the normalized contract address', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.renounceOwnership(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.renounceOwnership(unregisteredAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(
        service.renounceOwnership(INVALID_ADDRESS, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.renounceOwnership(
        VALID_ADDRESS,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── transferAdminRole (Phase 7 — US5) ────────────────────────────────

  describe('transferAdminRole', () => {
    const NEW_ADMIN = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.transferAdminRole(
        VALID_ADDRESS,
        NEW_ADMIN,
        undefined,
        MOCK_EXECUTION_CONFIG
      );

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('beginDefaultAdminTransfer');
      expect(txData.args).toEqual([NEW_ADMIN]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should ignore expirationBlock for EVM', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.transferAdminRole(VALID_ADDRESS, NEW_ADMIN, 999999, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('beginDefaultAdminTransfer');
      expect(txData.args).toEqual([NEW_ADMIN]);
      expect(txData.args).toHaveLength(1);
    });

    it('should pass executionConfig to callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.transferAdminRole(VALID_ADDRESS, NEW_ADMIN, undefined, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[1]).toBe(MOCK_EXECUTION_CONFIG);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.transferAdminRole(
        VALID_ADDRESS,
        NEW_ADMIN,
        undefined,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'test-api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('test-api-key');
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.transferAdminRole(unregisteredAddress, NEW_ADMIN, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
      await expect(
        service.transferAdminRole(unregisteredAddress, NEW_ADMIN, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow('Contract not registered');
    });

    it('should throw ConfigurationInvalid for invalid contract address', async () => {
      await expect(
        service.transferAdminRole(INVALID_ADDRESS, NEW_ADMIN, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid newAdmin address', async () => {
      await expect(
        service.transferAdminRole(VALID_ADDRESS, 'not-an-address', undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid when contract lacks hasTwoStepAdmin capability (FR-024)', async () => {
      // Register with Ownable-only schema (no DefaultAdminRules)
      const ownableOnlyAddress = '0x2222222222222222222222222222222222222222';
      service.registerContract(ownableOnlyAddress, OWNABLE_SCHEMA);

      await expect(
        service.transferAdminRole(ownableOnlyAddress, NEW_ADMIN, undefined, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── acceptAdminTransfer (Phase 7 — US5) ──────────────────────────────

  describe('acceptAdminTransfer', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.acceptAdminTransfer(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('acceptDefaultAdminTransfer');
      expect(txData.args).toEqual([]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.acceptAdminTransfer(unregisteredAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(
        service.acceptAdminTransfer(INVALID_ADDRESS, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid when contract lacks hasTwoStepAdmin capability (FR-024)', async () => {
      const ownableOnlyAddress = '0x2222222222222222222222222222222222222222';
      service.registerContract(ownableOnlyAddress, OWNABLE_SCHEMA);

      await expect(
        service.acceptAdminTransfer(ownableOnlyAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.acceptAdminTransfer(
        VALID_ADDRESS,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── cancelAdminTransfer (Phase 7 — US5) ──────────────────────────────

  describe('cancelAdminTransfer', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.cancelAdminTransfer(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('cancelDefaultAdminTransfer');
      expect(txData.args).toEqual([]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.cancelAdminTransfer(unregisteredAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(
        service.cancelAdminTransfer(INVALID_ADDRESS, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid when contract lacks hasTwoStepAdmin capability (FR-024)', async () => {
      const accessControlOnlyAddress = '0x3333333333333333333333333333333333333333';
      service.registerContract(accessControlOnlyAddress, ACCESS_CONTROL_SCHEMA);

      await expect(
        service.cancelAdminTransfer(accessControlOnlyAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.cancelAdminTransfer(
        VALID_ADDRESS,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── changeAdminDelay (Phase 7 — US5) ─────────────────────────────────

  describe('changeAdminDelay', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const newDelay = 172800; // 2 days in seconds
      const result = await service.changeAdminDelay(VALID_ADDRESS, newDelay, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('changeDefaultAdminDelay');
      expect(txData.args).toEqual([newDelay]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should accept zero delay', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.changeAdminDelay(VALID_ADDRESS, 0, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.args).toEqual([0]);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.changeAdminDelay(unregisteredAddress, 86400, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(
        service.changeAdminDelay(INVALID_ADDRESS, 86400, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid when contract lacks hasTwoStepAdmin capability (FR-024)', async () => {
      const ownableOnlyAddress = '0x2222222222222222222222222222222222222222';
      service.registerContract(ownableOnlyAddress, OWNABLE_SCHEMA);

      await expect(
        service.changeAdminDelay(ownableOnlyAddress, 86400, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.changeAdminDelay(
        VALID_ADDRESS,
        86400,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── rollbackAdminDelay (Phase 7 — US5) ───────────────────────────────

  describe('rollbackAdminDelay', () => {
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.rollbackAdminDelay(VALID_ADDRESS, MOCK_EXECUTION_CONFIG);

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('rollbackDefaultAdminDelay');
      expect(txData.args).toEqual([]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.rollbackAdminDelay(unregisteredAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(
        service.rollbackAdminDelay(INVALID_ADDRESS, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid when contract lacks hasTwoStepAdmin capability (FR-024)', async () => {
      const ownableOnlyAddress = '0x2222222222222222222222222222222222222222';
      service.registerContract(ownableOnlyAddress, OWNABLE_SCHEMA);

      await expect(
        service.rollbackAdminDelay(ownableOnlyAddress, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.rollbackAdminDelay(
        VALID_ADDRESS,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('api-key');
    });
  });

  // ── grantRole (Phase 8 — US6) ────────────────────────────────────────

  describe('grantRole', () => {
    const ROLE_ACCOUNT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.grantRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('grantRole');
      expect(txData.args).toEqual([VALID_ROLE_ID, ROLE_ACCOUNT]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should pass executionConfig to callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.grantRole(VALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[1]).toBe(MOCK_EXECUTION_CONFIG);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.grantRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'test-api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('test-api-key');
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.grantRole(
        VALID_ADDRESS,
        DEFAULT_ADMIN_ROLE,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.args).toEqual([DEFAULT_ADMIN_ROLE, ROLE_ACCOUNT]);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.grantRole(unregisteredAddress, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
      await expect(
        service.grantRole(unregisteredAddress, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow('Contract not registered');
    });

    it('should throw ConfigurationInvalid for invalid contract address', async () => {
      await expect(
        service.grantRole(INVALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid role ID', async () => {
      await expect(
        service.grantRole(VALID_ADDRESS, INVALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid account address', async () => {
      await expect(
        service.grantRole(VALID_ADDRESS, VALID_ROLE_ID, 'not-an-address', MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── revokeRole (Phase 8 — US6) ───────────────────────────────────────

  describe('revokeRole', () => {
    const ROLE_ACCOUNT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.revokeRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('revokeRole');
      expect(txData.args).toEqual([VALID_ROLE_ID, ROLE_ACCOUNT]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should pass executionConfig to callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.revokeRole(VALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[1]).toBe(MOCK_EXECUTION_CONFIG);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.revokeRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'test-api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('test-api-key');
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.revokeRole(
        VALID_ADDRESS,
        DEFAULT_ADMIN_ROLE,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.args).toEqual([DEFAULT_ADMIN_ROLE, ROLE_ACCOUNT]);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.revokeRole(unregisteredAddress, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
      await expect(
        service.revokeRole(unregisteredAddress, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow('Contract not registered');
    });

    it('should throw ConfigurationInvalid for invalid contract address', async () => {
      await expect(
        service.revokeRole(INVALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid role ID', async () => {
      await expect(
        service.revokeRole(VALID_ADDRESS, INVALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid account address', async () => {
      await expect(
        service.revokeRole(VALID_ADDRESS, VALID_ROLE_ID, 'not-an-address', MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── renounceRole (Phase 8 — US6, EVM-specific) ───────────────────────

  describe('renounceRole', () => {
    const ROLE_ACCOUNT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const MOCK_EXECUTION_CONFIG = {
      type: 'EOA',
    } as unknown as import('@openzeppelin/ui-types').ExecutionConfig;

    beforeEach(() => {
      vi.mocked(mockExecuteTransaction).mockClear();
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
    });

    it('should assemble and delegate to executeTransaction callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      const result = await service.renounceRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      expect(result.id).toBe('0xtxhash');
      expect(mockExecuteTransaction).toHaveBeenCalledTimes(1);

      // Verify the assembled WriteContractParameters
      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.functionName).toBe('renounceRole');
      expect(txData.args).toEqual([VALID_ROLE_ID, ROLE_ACCOUNT]);
      expect(txData.address).toBe(VALID_ADDRESS.toLowerCase());
    });

    it('should pass executionConfig to callback', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.renounceRole(VALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG);

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[1]).toBe(MOCK_EXECUTION_CONFIG);
    });

    it('should pass onStatusChange and runtimeApiKey when provided', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });
      const onStatusChange = vi.fn();

      await service.renounceRole(
        VALID_ADDRESS,
        VALID_ROLE_ID,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG,
        onStatusChange,
        'test-api-key'
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      expect(callArgs[2]).toBe(onStatusChange);
      expect(callArgs[3]).toBe('test-api-key');
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', async () => {
      vi.mocked(mockExecuteTransaction).mockResolvedValueOnce({ id: '0xtxhash' });

      await service.renounceRole(
        VALID_ADDRESS,
        DEFAULT_ADMIN_ROLE,
        ROLE_ACCOUNT,
        MOCK_EXECUTION_CONFIG
      );

      const callArgs = vi.mocked(mockExecuteTransaction).mock.calls[0];
      const txData = callArgs[0];
      expect(txData.args).toEqual([DEFAULT_ADMIN_ROLE, ROLE_ACCOUNT]);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(
        service.renounceRole(
          unregisteredAddress,
          VALID_ROLE_ID,
          ROLE_ACCOUNT,
          MOCK_EXECUTION_CONFIG
        )
      ).rejects.toThrow(ConfigurationInvalid);
      await expect(
        service.renounceRole(
          unregisteredAddress,
          VALID_ROLE_ID,
          ROLE_ACCOUNT,
          MOCK_EXECUTION_CONFIG
        )
      ).rejects.toThrow('Contract not registered');
    });

    it('should throw ConfigurationInvalid for invalid contract address', async () => {
      await expect(
        service.renounceRole(INVALID_ADDRESS, VALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid role ID', async () => {
      await expect(
        service.renounceRole(VALID_ADDRESS, INVALID_ROLE_ID, ROLE_ACCOUNT, MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });

    it('should throw ConfigurationInvalid for invalid account address', async () => {
      await expect(
        service.renounceRole(VALID_ADDRESS, VALID_ROLE_ID, 'not-an-address', MOCK_EXECUTION_CONFIG)
      ).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── getHistory (Phase 9 — US7) ───────────────────────────────────────

  describe('getHistory', () => {
    beforeEach(() => {
      mockReadOwnership.mockReset();
      mockGetAdmin.mockReset();
      mockReadCurrentRoles.mockReset();
      mockIndexerIsAvailable.mockReset();
      mockQueryPendingOwnershipTransfer.mockReset();
      mockQueryPendingAdminTransfer.mockReset();
      mockQueryLatestGrants.mockReset();
      mockQueryHistory.mockReset();

      // Register a contract for history tests
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA, [VALID_ROLE_ID]);
    });

    it('should return paginated history events from indexer', async () => {
      const mockResult: PaginatedHistoryResult = {
        items: [
          {
            role: { id: VALID_ROLE_ID },
            account: '0xAccount1000000000000000000000000000000001',
            changeType: 'GRANTED',
            txId: '0xhash1',
            timestamp: '2026-01-20T12:00:00Z',
            ledger: 300,
          },
          {
            role: { id: DEFAULT_ADMIN_ROLE, label: 'OWNER' },
            account: '0xNewOwner000000000000000000000000000000aa',
            changeType: 'OWNERSHIP_TRANSFER_STARTED',
            txId: '0xhash2',
            timestamp: '2026-01-15T08:00:00Z',
            ledger: 200,
          },
        ],
        pageInfo: { hasNextPage: false },
      };

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockResolvedValueOnce(mockResult);

      const result: PaginatedHistoryResult = await service.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].changeType).toBe('GRANTED');
      expect(result.items[1].changeType).toBe('OWNERSHIP_TRANSFER_STARTED');
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should delegate to indexer client with correct parameters', async () => {
      const mockResult: PaginatedHistoryResult = {
        items: [],
        pageInfo: { hasNextPage: false },
      };

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockResolvedValueOnce(mockResult);

      const options = {
        roleId: VALID_ROLE_ID,
        account: '0xAccount1000000000000000000000000000000001',
        changeType: 'GRANTED' as const,
        limit: 10,
      };

      await service.getHistory(VALID_ADDRESS, options);

      // Verify the indexer client was called with the correct contract address and options
      expect(mockQueryHistory).toHaveBeenCalledTimes(1);
      expect(mockQueryHistory).toHaveBeenCalledWith(VALID_ADDRESS.toLowerCase(), options);
    });

    it('should return empty PaginatedHistoryResult when indexer is unavailable (FR-017)', async () => {
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result: PaginatedHistoryResult = await service.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(mockQueryHistory).not.toHaveBeenCalled();
    });

    it('should return empty PaginatedHistoryResult when indexer returns null', async () => {
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockResolvedValueOnce(null);

      const result: PaginatedHistoryResult = await service.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should gracefully handle indexer errors and return empty result', async () => {
      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockRejectedValueOnce(new Error('Indexer query failed'));

      const result: PaginatedHistoryResult = await service.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should pass filter options through to indexer client', async () => {
      const mockResult: PaginatedHistoryResult = {
        items: [],
        pageInfo: { hasNextPage: false },
      };

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockResolvedValueOnce(mockResult);

      const filterOptions = {
        roleId: VALID_ROLE_ID,
        account: '0xAccount1000000000000000000000000000000001',
        changeType: 'REVOKED' as const,
        timestampFrom: '2026-01-01T00:00:00',
        timestampTo: '2026-02-01T00:00:00',
        limit: 25,
        cursor: 'page-cursor-abc',
      };

      await service.getHistory(VALID_ADDRESS, filterOptions);

      expect(mockQueryHistory).toHaveBeenCalledWith(VALID_ADDRESS.toLowerCase(), filterOptions);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.getHistory(unregisteredAddress)).rejects.toThrow(ConfigurationInvalid);
      await expect(service.getHistory(unregisteredAddress)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(service.getHistory(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });

    it('should work with no options (query all history)', async () => {
      const mockResult: PaginatedHistoryResult = {
        items: [
          {
            role: { id: VALID_ROLE_ID },
            account: '0xAcc1',
            changeType: 'GRANTED',
            txId: '0xhash1',
            timestamp: '2026-01-20T12:00:00Z',
            ledger: 300,
          },
        ],
        pageInfo: { hasNextPage: false },
      };

      mockIndexerIsAvailable.mockResolvedValueOnce(true);
      mockQueryHistory.mockResolvedValueOnce(mockResult);

      const result = await service.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(1);
      expect(mockQueryHistory).toHaveBeenCalledWith(VALID_ADDRESS.toLowerCase(), undefined);
    });

    it('should work with service created without indexer URL', async () => {
      const serviceNoIndexer = new EvmAccessControlService(
        mockNetworkConfigNoIndexer,
        mockExecuteTransaction
      );
      serviceNoIndexer.registerContract(VALID_ADDRESS, COMBINED_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      const result = await serviceNoIndexer.getHistory(VALID_ADDRESS);

      expect(result.items).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);

      serviceNoIndexer.dispose();
    });
  });

  // ── exportSnapshot (Phase 10 — US8) ─────────────────────────────────

  describe('exportSnapshot', () => {
    const OWNER = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
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
      mockQueryHistory.mockReset();
    });

    // ── US8 Scenario 1: Complete snapshot with roles + ownership ─────

    it('should return a complete snapshot with roles and ownership (US8 scenario 1)', async () => {
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA, [MINTER_ROLE, PAUSER_ROLE]);

      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: undefined,
      });

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

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Verify roles
      expect(snapshot.roles).toHaveLength(2);
      expect(snapshot.roles[0].role.id).toBe(MINTER_ROLE);
      expect(snapshot.roles[0].members).toContain(MEMBER_1);
      expect(snapshot.roles[1].role.id).toBe(PAUSER_ROLE);
      expect(snapshot.roles[1].members).toHaveLength(2);

      // Verify ownership
      expect(snapshot.ownership).toBeDefined();
      expect(snapshot.ownership!.owner).toBe(OWNER);
      expect(snapshot.ownership!.state).toBe('owned');
    });

    // ── US8 Scenario 2: Snapshot validates against AccessSnapshot schema ─

    it('should produce a valid AccessSnapshot structure (US8 scenario 2)', async () => {
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA, [MINTER_ROLE]);

      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: undefined,
      });

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Verify structure conforms to AccessSnapshot
      expect(snapshot).toHaveProperty('roles');
      expect(snapshot).toHaveProperty('ownership');
      expect(Array.isArray(snapshot.roles)).toBe(true);

      // Each role has the correct shape
      for (const roleAssignment of snapshot.roles) {
        expect(roleAssignment).toHaveProperty('role');
        expect(roleAssignment.role).toHaveProperty('id');
        expect(Array.isArray(roleAssignment.members)).toBe(true);
      }

      // Ownership has the correct shape
      expect(snapshot.ownership).toHaveProperty('owner');
      expect(snapshot.ownership).toHaveProperty('state');
    });

    // ── US8 Scenario 3: Non-Ownable contract → ownership omitted ─────

    it('should omit ownership when contract does not support Ownable (US8 scenario 3)', async () => {
      // Register with AccessControl-only schema (no Ownable functions)
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [MINTER_ROLE]);

      // getOwnership will fail because readOwnership throws for non-Ownable contracts
      mockReadOwnership.mockRejectedValueOnce(new Error('Contract does not support Ownable'));

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Roles should be present
      expect(snapshot.roles).toHaveLength(1);
      expect(snapshot.roles[0].role.id).toBe(MINTER_ROLE);

      // Ownership should be omitted
      expect(snapshot.ownership).toBeUndefined();
    });

    // ── No adminInfo in AccessSnapshot (known limitation) ────────────

    it('should not include adminInfo in the snapshot (known limitation)', async () => {
      service.registerContract(VALID_ADDRESS, DEFAULT_ADMIN_RULES_SCHEMA, [MINTER_ROLE]);

      mockReadOwnership.mockRejectedValueOnce(new Error('Not Ownable'));

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // The unified AccessSnapshot type does not include adminInfo
      expect(snapshot).not.toHaveProperty('adminInfo');
    });

    // ── Snapshot parity tests ────────────────────────────────────────

    it('should produce a snapshot that matches current ownership state', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);

      mockReadOwnership.mockResolvedValue({
        owner: OWNER,
        pendingOwner: undefined,
      });

      // Get fresh ownership
      const ownership: OwnershipInfo = await service.getOwnership(VALID_ADDRESS);

      // Get snapshot
      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Verify parity
      expect(snapshot.ownership).toEqual(ownership);
    });

    it('should produce a snapshot that matches current role assignments', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [
        MINTER_ROLE,
        PAUSER_ROLE,
      ]);

      const mockRoles: RoleAssignment[] = [
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
        {
          role: { id: PAUSER_ROLE },
          members: [MEMBER_1, MEMBER_2],
        },
      ];

      // Mock readOwnership to fail (non-Ownable) for both getCurrentRoles and exportSnapshot calls
      mockReadOwnership.mockRejectedValue(new Error('Not Ownable'));
      mockReadCurrentRoles.mockResolvedValue(mockRoles);

      // Get fresh roles
      const roles: RoleAssignment[] = await service.getCurrentRoles(VALID_ADDRESS);

      // Get snapshot
      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Verify parity
      expect(snapshot.roles).toEqual(roles);
    });

    // ── Edge cases ───────────────────────────────────────────────────

    it('should handle ownership read failure gracefully', async () => {
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA, [MINTER_ROLE]);

      mockReadOwnership.mockRejectedValueOnce(new Error('RPC unavailable'));

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [MEMBER_1],
        },
      ]);

      // Should not throw
      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Roles present, ownership absent
      expect(snapshot.roles).toHaveLength(1);
      expect(snapshot.ownership).toBeUndefined();
    });

    it('should handle roles read failure gracefully', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);

      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: undefined,
      });

      mockReadCurrentRoles.mockRejectedValueOnce(new Error('Roles enumeration failed'));

      // Should not throw
      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Ownership present, roles empty
      expect(snapshot.ownership).toBeDefined();
      expect(snapshot.ownership!.owner).toBe(OWNER);
      expect(snapshot.roles).toEqual([]);
    });

    it('should handle both reads failing gracefully', async () => {
      service.registerContract(VALID_ADDRESS, EMPTY_SCHEMA);

      mockReadOwnership.mockRejectedValueOnce(new Error('Not Ownable'));
      mockReadCurrentRoles.mockRejectedValueOnce(new Error('No roles'));

      // Should not throw
      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      // Empty snapshot
      expect(snapshot.roles).toEqual([]);
      expect(snapshot.ownership).toBeUndefined();
    });

    it('should handle roles with empty member lists', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_ENUMERABLE_SCHEMA, [MINTER_ROLE]);

      mockReadOwnership.mockRejectedValueOnce(new Error('Not Ownable'));

      mockReadCurrentRoles.mockResolvedValueOnce([
        {
          role: { id: MINTER_ROLE },
          members: [],
        },
      ]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      expect(snapshot.roles).toHaveLength(1);
      expect(snapshot.roles[0].members).toEqual([]);
    });

    it('should include pending ownership state in snapshot', async () => {
      const PENDING_OWNER = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';

      service.registerContract(VALID_ADDRESS, OWNABLE_TWO_STEP_SCHEMA);

      mockReadOwnership.mockResolvedValueOnce({
        owner: OWNER,
        pendingOwner: PENDING_OWNER,
      });
      mockIndexerIsAvailable.mockResolvedValueOnce(false);

      mockReadCurrentRoles.mockResolvedValueOnce([]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      expect(snapshot.ownership).toBeDefined();
      expect(snapshot.ownership!.state).toBe('pending');
      expect(snapshot.ownership!.pendingTransfer).toBeDefined();
      expect(snapshot.ownership!.pendingTransfer!.pendingOwner).toBe(PENDING_OWNER);
    });

    it('should include renounced ownership state in snapshot', async () => {
      service.registerContract(VALID_ADDRESS, OWNABLE_SCHEMA);

      mockReadOwnership.mockResolvedValueOnce({
        owner: null,
        pendingOwner: undefined,
      });

      mockReadCurrentRoles.mockResolvedValueOnce([]);

      const snapshot: AccessSnapshot = await service.exportSnapshot(VALID_ADDRESS);

      expect(snapshot.ownership).toBeDefined();
      expect(snapshot.ownership!.owner).toBeNull();
      expect(snapshot.ownership!.state).toBe('renounced');
    });

    it('should produce consistent snapshots across multiple calls', async () => {
      service.registerContract(VALID_ADDRESS, COMBINED_SCHEMA, [MINTER_ROLE]);

      const mockOwnershipData = { owner: OWNER, pendingOwner: undefined };
      const mockRolesData: RoleAssignment[] = [{ role: { id: MINTER_ROLE }, members: [MEMBER_1] }];

      mockReadOwnership.mockResolvedValue(mockOwnershipData);
      mockReadCurrentRoles.mockResolvedValue(mockRolesData);

      const snapshot1 = await service.exportSnapshot(VALID_ADDRESS);
      const snapshot2 = await service.exportSnapshot(VALID_ADDRESS);

      expect(snapshot1).toEqual(snapshot2);
    });

    // ── Validation ───────────────────────────────────────────────────

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.exportSnapshot(unregisteredAddress)).rejects.toThrow(
        ConfigurationInvalid
      );
      await expect(service.exportSnapshot(unregisteredAddress)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(service.exportSnapshot(INVALID_ADDRESS)).rejects.toThrow(ConfigurationInvalid);
    });
  });

  // ── discoverKnownRoleIds (Phase 11 — US9) ───────────────────────────

  describe('discoverKnownRoleIds', () => {
    const MINTER_ROLE = VALID_ROLE_ID;
    const PAUSER_ROLE = VALID_ROLE_ID_2;
    const DISCOVERED_ROLE = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

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
      mockQueryHistory.mockReset();
      mockDiscoverRoleIds.mockReset();
    });

    it('should return discovered role IDs from the indexer (US9 scenario 1)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([MINTER_ROLE, PAUSER_ROLE, DISCOVERED_ROLE]);

      const result = await service.discoverKnownRoleIds(VALID_ADDRESS);

      expect(result).toContain(MINTER_ROLE);
      expect(result).toContain(PAUSER_ROLE);
      expect(result).toContain(DISCOVERED_ROLE);
      expect(result).toHaveLength(3);
    });

    it('should cache discovered roles and not re-query on subsequent calls', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([MINTER_ROLE, PAUSER_ROLE]);

      const result1 = await service.discoverKnownRoleIds(VALID_ADDRESS);
      const result2 = await service.discoverKnownRoleIds(VALID_ADDRESS);

      // Same result returned both times
      expect(result1).toEqual(result2);
      // discoverRoleIds only called once — cached after first attempt
      expect(mockDiscoverRoleIds).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when indexer is unavailable (US9 scenario 2)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(false);

      const result = await service.discoverKnownRoleIds(VALID_ADDRESS);

      expect(result).toEqual([]);
      expect(mockDiscoverRoleIds).not.toHaveBeenCalled();
    });

    it('should not retry discovery after a failed attempt (single-attempt flag)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce(null); // Simulate indexer query failure

      const result1 = await service.discoverKnownRoleIds(VALID_ADDRESS);
      expect(result1).toEqual([]);

      const result2 = await service.discoverKnownRoleIds(VALID_ADDRESS);
      expect(result2).toEqual([]);

      // discoverRoleIds should only be called once — flagged as attempted
      expect(mockDiscoverRoleIds).toHaveBeenCalledTimes(1);
    });

    it('should return knownRoleIds when explicitly provided (precedence)', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA, [MINTER_ROLE, PAUSER_ROLE]);

      // Even if indexer would discover more roles, the known ones take precedence
      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([DISCOVERED_ROLE]);

      const result = await service.discoverKnownRoleIds(VALID_ADDRESS);

      // Should include both known and discovered (merged)
      expect(result).toContain(MINTER_ROLE);
      expect(result).toContain(PAUSER_ROLE);
      expect(result).toContain(DISCOVERED_ROLE);
    });

    it('should handle indexer discovery returning empty array', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([]);

      const result = await service.discoverKnownRoleIds(VALID_ADDRESS);

      expect(result).toEqual([]);
    });

    it('should handle indexer error gracefully and return empty array', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockRejectedValueOnce(new Error('Indexer error'));

      const result = await service.discoverKnownRoleIds(VALID_ADDRESS);

      expect(result).toEqual([]);
    });

    it('should throw ConfigurationInvalid for unregistered contract', async () => {
      const unregisteredAddress = '0x9999999999999999999999999999999999999999';
      await expect(service.discoverKnownRoleIds(unregisteredAddress)).rejects.toThrow(
        ConfigurationInvalid
      );
      await expect(service.discoverKnownRoleIds(unregisteredAddress)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should throw ConfigurationInvalid for invalid address', async () => {
      await expect(service.discoverKnownRoleIds(INVALID_ADDRESS)).rejects.toThrow(
        ConfigurationInvalid
      );
    });

    it('should use normalized (lowercase) contract address for indexer query', async () => {
      const checksummedAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      service.registerContract(checksummedAddress, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([MINTER_ROLE]);

      await service.discoverKnownRoleIds(checksummedAddress);

      // Verify the indexer was called with the lowercase address
      expect(mockDiscoverRoleIds).toHaveBeenCalledWith(checksummedAddress.toLowerCase());
    });
  });

  // ── dispose (Phase 11 — updated) ────────────────────────────────────

  describe('dispose (updated)', () => {
    it('should clear all registered contracts and discovered roles', async () => {
      // Register and discover
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);

      mockIndexerIsAvailable.mockResolvedValue(true);
      mockDiscoverRoleIds.mockResolvedValueOnce([VALID_ROLE_ID]);

      await service.discoverKnownRoleIds(VALID_ADDRESS);

      // Dispose
      service.dispose();

      // After dispose, the contract should no longer be registered
      await expect(service.getCapabilities(VALID_ADDRESS)).rejects.toThrow(
        'Contract not registered'
      );
    });

    it('should allow re-registration after dispose', async () => {
      service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      service.dispose();

      // Should be able to re-register
      expect(() => {
        service.registerContract(VALID_ADDRESS, ACCESS_CONTROL_SCHEMA);
      }).not.toThrow();
    });
  });
});
