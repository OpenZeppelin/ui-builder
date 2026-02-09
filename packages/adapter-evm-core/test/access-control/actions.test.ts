/**
 * Actions Tests for EVM Access Control
 *
 * Tests the action assembly functions that create `WriteContractParameters`
 * for access control write operations.
 *
 * Phase 6 (US4): Ownership transfer actions
 * - assembleTransferOwnershipAction
 * - assembleAcceptOwnershipAction
 * - assembleRenounceOwnershipAction
 *
 * Phase 7 (US5): Admin transfer and delay actions
 * - assembleBeginAdminTransferAction
 * - assembleAcceptAdminTransferAction
 * - assembleCancelAdminTransferAction
 * - assembleChangeAdminDelayAction
 * - assembleRollbackAdminDelayAction
 *
 * @see quickstart.md §Step 5
 * @see research.md §R2 — Transaction Assembly Strategy
 */

import { describe, expect, it } from 'vitest';

import {
  ACCEPT_DEFAULT_ADMIN_TRANSFER_ABI,
  ACCEPT_OWNERSHIP_ABI,
  BEGIN_DEFAULT_ADMIN_TRANSFER_ABI,
  CANCEL_DEFAULT_ADMIN_TRANSFER_ABI,
  CHANGE_DEFAULT_ADMIN_DELAY_ABI,
  RENOUNCE_OWNERSHIP_ABI,
  ROLLBACK_DEFAULT_ADMIN_DELAY_ABI,
  TRANSFER_OWNERSHIP_ABI,
} from '../../src/access-control/abis';
import {
  assembleAcceptAdminTransferAction,
  assembleAcceptOwnershipAction,
  assembleBeginAdminTransferAction,
  assembleCancelAdminTransferAction,
  assembleChangeAdminDelayAction,
  assembleRenounceOwnershipAction,
  assembleRollbackAdminDelayAction,
  assembleTransferOwnershipAction,
} from '../../src/access-control/actions';

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
const NEW_OWNER = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
const NEW_ADMIN = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Access Control Actions', () => {
  // ── Ownership Actions (Phase 6 — US4) ─────────────────────────────────

  describe('assembleTransferOwnershipAction', () => {
    it('should return correct WriteContractParameters for transferOwnership', () => {
      const result = assembleTransferOwnershipAction(CONTRACT_ADDRESS, NEW_OWNER);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(TRANSFER_OWNERSHIP_ABI);
      expect(result.functionName).toBe('transferOwnership');
      expect(result.args).toEqual([NEW_OWNER]);
    });

    it('should use the exact ABI fragment for transferOwnership', () => {
      const result = assembleTransferOwnershipAction(CONTRACT_ADDRESS, NEW_OWNER);

      // Verify the ABI has the correct single-function structure
      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'transferOwnership',
        inputs: [{ name: 'newOwner', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should preserve the exact newOwner address', () => {
      const checksummedOwner = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = assembleTransferOwnershipAction(CONTRACT_ADDRESS, checksummedOwner);

      expect(result.args[0]).toBe(checksummedOwner);
    });

    it('should set address as the contract address', () => {
      const result = assembleTransferOwnershipAction(CONTRACT_ADDRESS, NEW_OWNER);

      expect(result.address).toBe(CONTRACT_ADDRESS);
    });
  });

  describe('assembleAcceptOwnershipAction', () => {
    it('should return correct WriteContractParameters for acceptOwnership', () => {
      const result = assembleAcceptOwnershipAction(CONTRACT_ADDRESS);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(ACCEPT_OWNERSHIP_ABI);
      expect(result.functionName).toBe('acceptOwnership');
      expect(result.args).toEqual([]);
    });

    it('should use the exact ABI fragment for acceptOwnership', () => {
      const result = assembleAcceptOwnershipAction(CONTRACT_ADDRESS);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'acceptOwnership',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should have no args (called by pending owner)', () => {
      const result = assembleAcceptOwnershipAction(CONTRACT_ADDRESS);

      expect(result.args).toHaveLength(0);
    });
  });

  describe('assembleRenounceOwnershipAction', () => {
    it('should return correct WriteContractParameters for renounceOwnership', () => {
      const result = assembleRenounceOwnershipAction(CONTRACT_ADDRESS);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(RENOUNCE_OWNERSHIP_ABI);
      expect(result.functionName).toBe('renounceOwnership');
      expect(result.args).toEqual([]);
    });

    it('should use the exact ABI fragment for renounceOwnership', () => {
      const result = assembleRenounceOwnershipAction(CONTRACT_ADDRESS);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'renounceOwnership',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should have no args (called by current owner)', () => {
      const result = assembleRenounceOwnershipAction(CONTRACT_ADDRESS);

      expect(result.args).toHaveLength(0);
    });
  });

  // ── Admin Actions (Phase 7 — US5) ──────────────────────────────────

  describe('assembleBeginAdminTransferAction', () => {
    it('should return correct WriteContractParameters for beginDefaultAdminTransfer', () => {
      const result = assembleBeginAdminTransferAction(CONTRACT_ADDRESS, NEW_ADMIN);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(BEGIN_DEFAULT_ADMIN_TRANSFER_ABI);
      expect(result.functionName).toBe('beginDefaultAdminTransfer');
      expect(result.args).toEqual([NEW_ADMIN]);
    });

    it('should use the exact ABI fragment for beginDefaultAdminTransfer', () => {
      const result = assembleBeginAdminTransferAction(CONTRACT_ADDRESS, NEW_ADMIN);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'beginDefaultAdminTransfer',
        inputs: [{ name: 'newAdmin', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should preserve the exact newAdmin address', () => {
      const checksummedAdmin = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = assembleBeginAdminTransferAction(CONTRACT_ADDRESS, checksummedAdmin);

      expect(result.args[0]).toBe(checksummedAdmin);
    });

    it('should set address as the contract address', () => {
      const result = assembleBeginAdminTransferAction(CONTRACT_ADDRESS, NEW_ADMIN);

      expect(result.address).toBe(CONTRACT_ADDRESS);
    });
  });

  describe('assembleAcceptAdminTransferAction', () => {
    it('should return correct WriteContractParameters for acceptDefaultAdminTransfer', () => {
      const result = assembleAcceptAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(ACCEPT_DEFAULT_ADMIN_TRANSFER_ABI);
      expect(result.functionName).toBe('acceptDefaultAdminTransfer');
      expect(result.args).toEqual([]);
    });

    it('should use the exact ABI fragment for acceptDefaultAdminTransfer', () => {
      const result = assembleAcceptAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'acceptDefaultAdminTransfer',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should have no args (called by pending admin)', () => {
      const result = assembleAcceptAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.args).toHaveLength(0);
    });
  });

  describe('assembleCancelAdminTransferAction', () => {
    it('should return correct WriteContractParameters for cancelDefaultAdminTransfer', () => {
      const result = assembleCancelAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(CANCEL_DEFAULT_ADMIN_TRANSFER_ABI);
      expect(result.functionName).toBe('cancelDefaultAdminTransfer');
      expect(result.args).toEqual([]);
    });

    it('should use the exact ABI fragment for cancelDefaultAdminTransfer', () => {
      const result = assembleCancelAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'cancelDefaultAdminTransfer',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should have no args (called by current admin)', () => {
      const result = assembleCancelAdminTransferAction(CONTRACT_ADDRESS);

      expect(result.args).toHaveLength(0);
    });
  });

  describe('assembleChangeAdminDelayAction', () => {
    it('should return correct WriteContractParameters for changeDefaultAdminDelay', () => {
      const newDelay = 172800; // 2 days in seconds
      const result = assembleChangeAdminDelayAction(CONTRACT_ADDRESS, newDelay);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(CHANGE_DEFAULT_ADMIN_DELAY_ABI);
      expect(result.functionName).toBe('changeDefaultAdminDelay');
      expect(result.args).toEqual([newDelay]);
    });

    it('should use the exact ABI fragment for changeDefaultAdminDelay with uint48 param', () => {
      const result = assembleChangeAdminDelayAction(CONTRACT_ADDRESS, 86400);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'changeDefaultAdminDelay',
        inputs: [{ name: 'newDelay', type: 'uint48' }],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should accept zero delay', () => {
      const result = assembleChangeAdminDelayAction(CONTRACT_ADDRESS, 0);

      expect(result.args).toEqual([0]);
    });

    it('should preserve the exact delay value', () => {
      const largeDelay = 281474976710655; // max uint48 value
      const result = assembleChangeAdminDelayAction(CONTRACT_ADDRESS, largeDelay);

      expect(result.args[0]).toBe(largeDelay);
    });
  });

  describe('assembleRollbackAdminDelayAction', () => {
    it('should return correct WriteContractParameters for rollbackDefaultAdminDelay', () => {
      const result = assembleRollbackAdminDelayAction(CONTRACT_ADDRESS);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(ROLLBACK_DEFAULT_ADMIN_DELAY_ABI);
      expect(result.functionName).toBe('rollbackDefaultAdminDelay');
      expect(result.args).toEqual([]);
    });

    it('should use the exact ABI fragment for rollbackDefaultAdminDelay', () => {
      const result = assembleRollbackAdminDelayAction(CONTRACT_ADDRESS);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'rollbackDefaultAdminDelay',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should have no args (called by current admin)', () => {
      const result = assembleRollbackAdminDelayAction(CONTRACT_ADDRESS);

      expect(result.args).toHaveLength(0);
    });
  });
});
