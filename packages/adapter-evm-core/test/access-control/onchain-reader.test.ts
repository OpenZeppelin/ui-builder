/**
 * On-Chain Reader Tests for EVM Access Control (Phase 4 — Ownership + Admin Suites)
 *
 * Tests the on-chain reader functions for reading ownership state (Ownable/Ownable2Step)
 * and default admin state (AccessControlDefaultAdminRules) from EVM contracts via viem.
 *
 * @see quickstart.md §Step 3 (readOwnership, getAdmin functions)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ADMIN_ROLE, ZERO_ADDRESS } from '../../src/access-control/constants';
// Import after mocking
import { getAdmin, readOwnership } from '../../src/access-control/onchain-reader';

// ---------------------------------------------------------------------------
// Mock viem before importing the module under test
// ---------------------------------------------------------------------------

const mockReadContract = vi.fn();
const mockGetBlockNumber = vi.fn();

vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
      getBlockNumber: mockGetBlockNumber,
    })),
    http: vi.fn((url: string) => ({ url, type: 'http' })),
  };
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_RPC_URL = 'https://rpc.example.com';
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
const OWNER_ADDRESS = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
const PENDING_OWNER_ADDRESS = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
const ADMIN_ADDRESS = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';
const PENDING_ADMIN_ADDRESS = '0xDdDdDdDdDDddDDddDDddDDDDdDdDDdDDdDDDDDDd';

// Role-related constants (Phase 5 — US3)
const DEFAULT_ADMIN_ROLE_CONSTANT = DEFAULT_ADMIN_ROLE;
const ROLE_ID_MINTER = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
const MEMBER_ADDRESS_1 = '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe';
const MEMBER_ADDRESS_2 = '0xFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('onchain-reader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Role Functions (Phase 5 — US3) ────────────────────────────────────

  describe('hasRole', () => {
    it('should return true when account has the role', async () => {
      mockReadContract.mockResolvedValueOnce(true);

      const { hasRole } = await import('../../src/access-control/onchain-reader');
      const result = await hasRole(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        ROLE_ID_MINTER,
        MEMBER_ADDRESS_1
      );

      expect(result).toBe(true);
    });

    it('should return false when account does not have the role', async () => {
      mockReadContract.mockResolvedValueOnce(false);

      const { hasRole } = await import('../../src/access-control/onchain-reader');
      const result = await hasRole(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        ROLE_ID_MINTER,
        MEMBER_ADDRESS_2
      );

      expect(result).toBe(false);
    });

    it('should return false when readContract throws (graceful degradation)', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('execution reverted'));

      const { hasRole } = await import('../../src/access-control/onchain-reader');
      const result = await hasRole(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        ROLE_ID_MINTER,
        MEMBER_ADDRESS_1
      );

      expect(result).toBe(false);
    });

    it('should accept an optional viemChain parameter', async () => {
      mockReadContract.mockResolvedValueOnce(true);

      const { hasRole } = await import('../../src/access-control/onchain-reader');
      const mockChain = { id: 1, name: 'Ethereum' } as unknown as import('viem').Chain;
      const result = await hasRole(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        ROLE_ID_MINTER,
        MEMBER_ADDRESS_1,
        mockChain
      );

      expect(result).toBe(true);
    });
  });

  describe('enumerateRoleMembers', () => {
    it('should enumerate all members of a role', async () => {
      // getRoleMemberCount returns 2
      mockReadContract.mockResolvedValueOnce(2n);
      // getRoleMember(role, 0) and getRoleMember(role, 1)
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_1);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_2);

      const { enumerateRoleMembers } = await import('../../src/access-control/onchain-reader');
      const result = await enumerateRoleMembers(TEST_RPC_URL, CONTRACT_ADDRESS, ROLE_ID_MINTER);

      expect(result).toHaveLength(2);
      expect(result).toContain(MEMBER_ADDRESS_1);
      expect(result).toContain(MEMBER_ADDRESS_2);
    });

    it('should return empty array when role has no members', async () => {
      mockReadContract.mockResolvedValueOnce(0n); // count = 0

      const { enumerateRoleMembers } = await import('../../src/access-control/onchain-reader');
      const result = await enumerateRoleMembers(TEST_RPC_URL, CONTRACT_ADDRESS, ROLE_ID_MINTER);

      expect(result).toHaveLength(0);
    });

    it('should throw when getRoleMemberCount fails', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('execution reverted'));

      const { enumerateRoleMembers } = await import('../../src/access-control/onchain-reader');
      await expect(
        enumerateRoleMembers(TEST_RPC_URL, CONTRACT_ADDRESS, ROLE_ID_MINTER)
      ).rejects.toThrow();
    });

    it('should accept an optional viemChain parameter', async () => {
      mockReadContract.mockResolvedValueOnce(1n);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_1);

      const { enumerateRoleMembers } = await import('../../src/access-control/onchain-reader');
      const mockChain = { id: 1, name: 'Ethereum' } as unknown as import('viem').Chain;
      const result = await enumerateRoleMembers(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        ROLE_ID_MINTER,
        mockChain
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('readCurrentRoles', () => {
    it('should read role assignments for a single role with enumeration', async () => {
      // Single role: count=2, members
      mockReadContract.mockResolvedValueOnce(2n);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_1);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_2);

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [ROLE_ID_MINTER],
        true // hasEnumerableRoles
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(ROLE_ID_MINTER);
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members).toContain(MEMBER_ADDRESS_1);
      expect(result[0].members).toContain(MEMBER_ADDRESS_2);
    });

    it('should return empty array when given empty role IDs', async () => {
      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(TEST_RPC_URL, CONTRACT_ADDRESS, [], true);

      expect(result).toHaveLength(0);
    });

    it('should label DEFAULT_ADMIN_ROLE correctly', async () => {
      mockReadContract.mockResolvedValueOnce(1n);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_1);

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [DEFAULT_ADMIN_ROLE_CONSTANT],
        true
      );

      expect(result[0].role.label).toBe('DEFAULT_ADMIN_ROLE');
    });

    it('should return role with empty members when not enumerable', async () => {
      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [ROLE_ID_MINTER],
        false // not enumerable
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(ROLE_ID_MINTER);
      expect(result[0].members).toHaveLength(0);
    });

    it('should return role with empty members when enumeration fails', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('execution reverted'));

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(TEST_RPC_URL, CONTRACT_ADDRESS, [ROLE_ID_MINTER], true);

      expect(result).toHaveLength(1);
      expect(result[0].members).toHaveLength(0);
    });

    it('should resolve label from roleLabelMap when provided', async () => {
      mockReadContract.mockResolvedValueOnce(1n);
      mockReadContract.mockResolvedValueOnce(MEMBER_ADDRESS_1);

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const labelMap = new Map<string, string>([[ROLE_ID_MINTER, 'Custom Minter Label']]);

      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [ROLE_ID_MINTER],
        true,
        undefined,
        labelMap
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(ROLE_ID_MINTER);
      expect(result[0].role.label).toBe('Custom Minter Label');
    });

    it('should resolve well-known label when roleLabelMap has no entry', async () => {
      // ROLE_ID_MINTER is the well-known MINTER_ROLE hash
      mockReadContract.mockResolvedValueOnce(0n); // count = 0

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const emptyMap = new Map<string, string>();

      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [ROLE_ID_MINTER],
        true,
        undefined,
        emptyMap
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(ROLE_ID_MINTER);
      expect(result[0].role.label).toBe('MINTER_ROLE');
    });

    it('should prefer roleLabelMap over well-known dictionary', async () => {
      mockReadContract.mockResolvedValueOnce(0n); // count = 0

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const labelMap = new Map<string, string>([[DEFAULT_ADMIN_ROLE_CONSTANT, 'Override Admin']]);

      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [DEFAULT_ADMIN_ROLE_CONSTANT],
        true,
        undefined,
        labelMap
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(DEFAULT_ADMIN_ROLE_CONSTANT);
      expect(result[0].role.label).toBe('Override Admin');
    });

    it('should return undefined label for unknown role when no roleLabelMap entry', async () => {
      const unknownRole = '0x1111111111111111111111111111111111111111111111111111111111111111';
      mockReadContract.mockResolvedValueOnce(0n);

      const { readCurrentRoles } = await import('../../src/access-control/onchain-reader');
      const result = await readCurrentRoles(
        TEST_RPC_URL,
        CONTRACT_ADDRESS,
        [unknownRole],
        true,
        undefined,
        new Map()
      );

      expect(result).toHaveLength(1);
      expect(result[0].role.id).toBe(unknownRole);
      expect(result[0].role.label).toBeUndefined();
    });
  });

  describe('getRoleAdmin', () => {
    it('should return the admin role ID for a given role', async () => {
      mockReadContract.mockResolvedValueOnce(DEFAULT_ADMIN_ROLE_CONSTANT);

      const { getRoleAdmin } = await import('../../src/access-control/onchain-reader');
      const result = await getRoleAdmin(TEST_RPC_URL, CONTRACT_ADDRESS, ROLE_ID_MINTER);

      expect(result).toBe(DEFAULT_ADMIN_ROLE_CONSTANT);
    });

    it('should return null when the call fails', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('execution reverted'));

      const { getRoleAdmin } = await import('../../src/access-control/onchain-reader');
      const result = await getRoleAdmin(TEST_RPC_URL, CONTRACT_ADDRESS, ROLE_ID_MINTER);

      expect(result).toBeNull();
    });
  });

  describe('getCurrentBlock', () => {
    it('should return the current block number', async () => {
      mockGetBlockNumber.mockResolvedValueOnce(12345678n);

      const { getCurrentBlock } = await import('../../src/access-control/onchain-reader');
      const result = await getCurrentBlock(TEST_RPC_URL);

      expect(result).toBe(12345678);
    });

    it('should throw when the call fails', async () => {
      mockGetBlockNumber.mockRejectedValueOnce(new Error('RPC error'));

      const { getCurrentBlock } = await import('../../src/access-control/onchain-reader');
      await expect(getCurrentBlock(TEST_RPC_URL)).rejects.toThrow();
    });
  });

  // ── readOwnership ─────────────────────────────────────────────────────

  describe('readOwnership', () => {
    it('should return owner address when contract has an owner', async () => {
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS) // owner()
        .mockRejectedValueOnce(new Error('pendingOwner() not available')); // pendingOwner() — not Ownable2Step

      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.owner).toBe(OWNER_ADDRESS);
      expect(result.pendingOwner).toBeUndefined();
    });

    it('should return owner and pendingOwner for Ownable2Step contracts', async () => {
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS) // owner()
        .mockResolvedValueOnce(PENDING_OWNER_ADDRESS); // pendingOwner()

      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.owner).toBe(OWNER_ADDRESS);
      expect(result.pendingOwner).toBe(PENDING_OWNER_ADDRESS);
    });

    it('should return zero address pendingOwner as undefined (no pending transfer)', async () => {
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS) // owner()
        .mockResolvedValueOnce(ZERO_ADDRESS); // pendingOwner() returns zero (no pending)

      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.owner).toBe(OWNER_ADDRESS);
      expect(result.pendingOwner).toBeUndefined();
    });

    it('should return null owner when ownership is renounced (zero address)', async () => {
      mockReadContract
        .mockResolvedValueOnce(ZERO_ADDRESS) // owner() returns zero
        .mockRejectedValueOnce(new Error('pendingOwner() not available'));

      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.owner).toBeNull();
      expect(result.pendingOwner).toBeUndefined();
    });

    it('should handle contracts without pendingOwner gracefully (basic Ownable)', async () => {
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS) // owner()
        .mockRejectedValueOnce(new Error('execution reverted')); // pendingOwner() doesn't exist

      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.owner).toBe(OWNER_ADDRESS);
      expect(result.pendingOwner).toBeUndefined();
    });

    it('should throw when owner() call fails', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('RPC error'));

      await expect(readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS)).rejects.toThrow();
    });

    it('should accept an optional viemChain parameter', async () => {
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS)
        .mockRejectedValueOnce(new Error('no pendingOwner'));

      const mockChain = { id: 1, name: 'Ethereum' } as unknown as import('viem').Chain;
      const result = await readOwnership(TEST_RPC_URL, CONTRACT_ADDRESS, mockChain);

      expect(result.owner).toBe(OWNER_ADDRESS);
    });
  });

  // ── getAdmin ──────────────────────────────────────────────────────────

  describe('getAdmin', () => {
    it('should return defaultAdmin address', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin() — no pending
        .mockResolvedValueOnce(86400n) // defaultAdminDelay()
        .mockResolvedValueOnce([0n, 0n]); // pendingDefaultAdminDelay() — no pending

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
      expect(result.pendingDefaultAdmin).toBeUndefined();
      expect(result.defaultAdminDelay).toBe(86400);
      expect(result.pendingDefaultAdminDelay).toBeUndefined();
      expect(result.pendingDefaultAdminDelaySchedule).toBeUndefined();
    });

    it('should return pendingDefaultAdmin with acceptSchedule when transfer is scheduled', async () => {
      const acceptSchedule = 1700000000n; // UNIX timestamp

      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([PENDING_ADMIN_ADDRESS, acceptSchedule]) // pendingDefaultAdmin()
        .mockResolvedValueOnce(86400n) // defaultAdminDelay()
        .mockResolvedValueOnce([0n, 0n]); // pendingDefaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
      expect(result.pendingDefaultAdmin).toBe(PENDING_ADMIN_ADDRESS);
      expect(result.acceptSchedule).toBe(Number(acceptSchedule));
      expect(result.defaultAdminDelay).toBe(86400);
    });

    it('should return null defaultAdmin when admin is renounced (zero address)', async () => {
      mockReadContract
        .mockResolvedValueOnce(ZERO_ADDRESS) // defaultAdmin() returns zero
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin()
        .mockResolvedValueOnce(0n) // defaultAdminDelay()
        .mockResolvedValueOnce([0n, 0n]); // pendingDefaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBeNull();
      expect(result.pendingDefaultAdmin).toBeUndefined();
    });

    it('should treat zero address pendingDefaultAdmin as no pending transfer', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin() — zero means no pending
        .mockResolvedValueOnce(86400n) // defaultAdminDelay()
        .mockResolvedValueOnce([0n, 0n]); // pendingDefaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.pendingDefaultAdmin).toBeUndefined();
      expect(result.acceptSchedule).toBeUndefined();
    });

    it('should throw when defaultAdmin() call fails', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('RPC error'));

      await expect(getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS)).rejects.toThrow();
    });

    it('should accept an optional viemChain parameter', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS)
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n])
        .mockResolvedValueOnce(86400n)
        .mockResolvedValueOnce([0n, 0n]);

      const mockChain = { id: 1, name: 'Ethereum' } as unknown as import('viem').Chain;
      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS, mockChain);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
    });

    it('should return pendingDefaultAdminDelay when a delay change is scheduled', async () => {
      const effectSchedule = 1700100000n; // UNIX timestamp

      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin() — no pending transfer
        .mockResolvedValueOnce(86400n) // defaultAdminDelay() — current delay
        .mockResolvedValueOnce([172800n, effectSchedule]); // pendingDefaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdminDelay).toBe(86400);
      expect(result.pendingDefaultAdminDelay).toBe(172800);
      expect(result.pendingDefaultAdminDelaySchedule).toBe(Number(effectSchedule));
    });

    it('should treat (0, 0) pendingDefaultAdminDelay as no pending delay change', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin()
        .mockResolvedValueOnce(86400n) // defaultAdminDelay()
        .mockResolvedValueOnce([0n, 0n]); // pendingDefaultAdminDelay() — no change

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.pendingDefaultAdminDelay).toBeUndefined();
      expect(result.pendingDefaultAdminDelaySchedule).toBeUndefined();
    });

    it('should gracefully handle pendingDefaultAdminDelay() failure', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin()
        .mockResolvedValueOnce(86400n) // defaultAdminDelay()
        .mockRejectedValueOnce(new Error('not supported')); // pendingDefaultAdminDelay() fails

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
      expect(result.defaultAdminDelay).toBe(86400);
      expect(result.pendingDefaultAdminDelay).toBeUndefined();
      expect(result.pendingDefaultAdminDelaySchedule).toBeUndefined();
    });
  });
});
