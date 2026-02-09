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
 * Phase 8 (US6): Role management actions
 * - assembleGrantRoleAction
 * - assembleRevokeRoleAction
 * - assembleRenounceRoleAction
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
  GRANT_ROLE_ABI,
  RENOUNCE_OWNERSHIP_ABI,
  RENOUNCE_ROLE_ABI,
  REVOKE_ROLE_ABI,
  ROLLBACK_DEFAULT_ADMIN_DELAY_ABI,
  TRANSFER_OWNERSHIP_ABI,
} from '../../src/access-control/abis';
import {
  assembleAcceptAdminTransferAction,
  assembleAcceptOwnershipAction,
  assembleBeginAdminTransferAction,
  assembleCancelAdminTransferAction,
  assembleChangeAdminDelayAction,
  assembleGrantRoleAction,
  assembleRenounceOwnershipAction,
  assembleRenounceRoleAction,
  assembleRevokeRoleAction,
  assembleRollbackAdminDelayAction,
  assembleTransferOwnershipAction,
} from '../../src/access-control/actions';

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
const NEW_OWNER = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
const NEW_ADMIN = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';
const ACCOUNT = '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe';
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

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

  // ── Role Actions (Phase 8 — US6) ────────────────────────────────────

  describe('assembleGrantRoleAction', () => {
    it('should return correct WriteContractParameters for grantRole', () => {
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(GRANT_ROLE_ABI);
      expect(result.functionName).toBe('grantRole');
      expect(result.args).toEqual([MINTER_ROLE, ACCOUNT]);
    });

    it('should use the exact ABI fragment for grantRole', () => {
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'grantRole',
        inputs: [
          { name: 'role', type: 'bytes32' },
          { name: 'account', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should preserve the exact role ID (bytes32)', () => {
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(MINTER_ROLE);
    });

    it('should preserve the exact account address', () => {
      const checksummedAccount = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, checksummedAccount);

      expect(result.args[1]).toBe(checksummedAccount);
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', () => {
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, DEFAULT_ADMIN_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(DEFAULT_ADMIN_ROLE);
    });

    it('should set address as the contract address', () => {
      const result = assembleGrantRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
    });
  });

  describe('assembleRevokeRoleAction', () => {
    it('should return correct WriteContractParameters for revokeRole', () => {
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(REVOKE_ROLE_ABI);
      expect(result.functionName).toBe('revokeRole');
      expect(result.args).toEqual([MINTER_ROLE, ACCOUNT]);
    });

    it('should use the exact ABI fragment for revokeRole', () => {
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'revokeRole',
        inputs: [
          { name: 'role', type: 'bytes32' },
          { name: 'account', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should preserve the exact role ID (bytes32)', () => {
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(MINTER_ROLE);
    });

    it('should preserve the exact account address', () => {
      const checksummedAccount = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, checksummedAccount);

      expect(result.args[1]).toBe(checksummedAccount);
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', () => {
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, DEFAULT_ADMIN_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(DEFAULT_ADMIN_ROLE);
    });

    it('should set address as the contract address', () => {
      const result = assembleRevokeRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
    });
  });

  describe('assembleRenounceRoleAction', () => {
    it('should return correct WriteContractParameters for renounceRole', () => {
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
      expect(result.abi).toEqual(RENOUNCE_ROLE_ABI);
      expect(result.functionName).toBe('renounceRole');
      expect(result.args).toEqual([MINTER_ROLE, ACCOUNT]);
    });

    it('should use the exact ABI fragment for renounceRole', () => {
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.abi).toHaveLength(1);
      expect(result.abi[0]).toMatchObject({
        type: 'function',
        name: 'renounceRole',
        inputs: [
          { name: 'role', type: 'bytes32' },
          { name: 'callerConfirmation', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      });
    });

    it('should preserve the exact role ID (bytes32)', () => {
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(MINTER_ROLE);
    });

    it('should preserve the exact callerConfirmation address', () => {
      const checksummedAccount = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, checksummedAccount);

      expect(result.args[1]).toBe(checksummedAccount);
    });

    it('should work with DEFAULT_ADMIN_ROLE (bytes32 zero)', () => {
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, DEFAULT_ADMIN_ROLE, ACCOUNT);

      expect(result.args[0]).toBe(DEFAULT_ADMIN_ROLE);
    });

    it('should set address as the contract address', () => {
      const result = assembleRenounceRoleAction(CONTRACT_ADDRESS, MINTER_ROLE, ACCOUNT);

      expect(result.address).toBe(CONTRACT_ADDRESS);
    });
  });
});
