/**
 * On-Chain Reader Tests for EVM Access Control (Phase 4 — Ownership + Admin Suites)
 *
 * Tests the on-chain reader functions for reading ownership state (Ownable/Ownable2Step)
 * and default admin state (AccessControlDefaultAdminRules) from EVM contracts via viem.
 *
 * @see quickstart.md §Step 3 (readOwnership, getAdmin functions)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ZERO_ADDRESS } from '../../src/access-control/constants';
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
        .mockResolvedValueOnce(86400n); // defaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
      expect(result.pendingDefaultAdmin).toBeUndefined();
      expect(result.defaultAdminDelay).toBe(86400);
    });

    it('should return pendingDefaultAdmin with acceptSchedule when transfer is scheduled', async () => {
      const acceptSchedule = 1700000000n; // UNIX timestamp

      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([PENDING_ADMIN_ADDRESS, acceptSchedule]) // pendingDefaultAdmin()
        .mockResolvedValueOnce(86400n); // defaultAdminDelay()

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
        .mockResolvedValueOnce(0n); // defaultAdminDelay()

      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS);

      expect(result.defaultAdmin).toBeNull();
      expect(result.pendingDefaultAdmin).toBeUndefined();
    });

    it('should treat zero address pendingDefaultAdmin as no pending transfer', async () => {
      mockReadContract
        .mockResolvedValueOnce(ADMIN_ADDRESS) // defaultAdmin()
        .mockResolvedValueOnce([ZERO_ADDRESS, 0n]) // pendingDefaultAdmin() — zero means no pending
        .mockResolvedValueOnce(86400n); // defaultAdminDelay()

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
        .mockResolvedValueOnce(86400n);

      const mockChain = { id: 1, name: 'Ethereum' } as unknown as import('viem').Chain;
      const result = await getAdmin(TEST_RPC_URL, CONTRACT_ADDRESS, mockChain);

      expect(result.defaultAdmin).toBe(ADMIN_ADDRESS);
    });
  });
});
