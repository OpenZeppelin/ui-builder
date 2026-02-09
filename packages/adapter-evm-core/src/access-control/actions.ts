/**
 * EVM Access Control Actions Module
 *
 * Assembles transaction data for access control write operations on EVM-compatible
 * contracts. Each function returns a `WriteContractParameters` object containing:
 * - `address`: The target contract address
 * - `abi`: A single-function ABI fragment
 * - `functionName`: The Solidity function name
 * - `args`: The encoded arguments
 *
 * The service layer delegates execution to the caller-provided `executeTransaction`
 * callback, keeping this module purely responsible for data assembly.
 *
 * @module access-control/actions
 * @see quickstart.md §Step 5
 * @see research.md §R2 — Transaction Assembly Strategy
 */

import type { WriteContractParameters } from '../types';
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
} from './abis';

// ---------------------------------------------------------------------------
// Ownership Actions (Phase 6 — US4)
// ---------------------------------------------------------------------------

/**
 * Assembles a `transferOwnership(address newOwner)` transaction.
 *
 * Works with both Ownable (single-step) and Ownable2Step (sets pendingOwner).
 * The contract determines the behavior — same function signature for both patterns.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param newOwner - The new owner address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleTransferOwnershipAction(
  contractAddress: string,
  newOwner: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: TRANSFER_OWNERSHIP_ABI,
    functionName: 'transferOwnership',
    args: [newOwner],
  };
}

/**
 * Assembles an `acceptOwnership()` transaction (Ownable2Step only).
 *
 * Must be called by the pending owner to complete a two-step transfer.
 * No arguments — the caller is implicitly the pending owner.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleAcceptOwnershipAction(contractAddress: string): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: ACCEPT_OWNERSHIP_ABI,
    functionName: 'acceptOwnership',
    args: [],
  };
}

/**
 * Assembles a `renounceOwnership()` transaction (Ownable).
 *
 * Permanently renounces ownership — after execution, `owner()` returns the zero address.
 * This is an EVM-specific operation not present in the Stellar adapter.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleRenounceOwnershipAction(contractAddress: string): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: RENOUNCE_OWNERSHIP_ABI,
    functionName: 'renounceOwnership',
    args: [],
  };
}

// ---------------------------------------------------------------------------
// Admin Actions (Phase 7 — US5)
// ---------------------------------------------------------------------------

/**
 * Assembles a `beginDefaultAdminTransfer(address newAdmin)` transaction.
 *
 * Initiates a two-step admin transfer on an AccessControlDefaultAdminRules contract.
 * The transfer can be accepted after the contract's built-in delay period.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param newAdmin - The new admin address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleBeginAdminTransferAction(
  contractAddress: string,
  newAdmin: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: BEGIN_DEFAULT_ADMIN_TRANSFER_ABI,
    functionName: 'beginDefaultAdminTransfer',
    args: [newAdmin],
  };
}

/**
 * Assembles an `acceptDefaultAdminTransfer()` transaction.
 *
 * Must be called by the pending admin after the accept schedule timestamp
 * has passed. No arguments — the caller is implicitly the pending admin.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleAcceptAdminTransferAction(
  contractAddress: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: ACCEPT_DEFAULT_ADMIN_TRANSFER_ABI,
    functionName: 'acceptDefaultAdminTransfer',
    args: [],
  };
}

/**
 * Assembles a `cancelDefaultAdminTransfer()` transaction.
 *
 * Cancels a pending admin transfer. Must be called by the current default admin.
 * EVM-specific operation — Stellar has no cancel mechanism.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleCancelAdminTransferAction(
  contractAddress: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: CANCEL_DEFAULT_ADMIN_TRANSFER_ABI,
    functionName: 'cancelDefaultAdminTransfer',
    args: [],
  };
}

/**
 * Assembles a `changeDefaultAdminDelay(uint48 newDelay)` transaction.
 *
 * Schedules a change to the admin transfer delay. The delay change itself
 * has a delay before it takes effect.
 * EVM-specific operation — Stellar has no delay mechanism.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param newDelay - The new delay in seconds (uint48)
 * @returns WriteContractParameters ready for execution
 */
export function assembleChangeAdminDelayAction(
  contractAddress: string,
  newDelay: number
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: CHANGE_DEFAULT_ADMIN_DELAY_ABI,
    functionName: 'changeDefaultAdminDelay',
    args: [newDelay],
  };
}

/**
 * Assembles a `rollbackDefaultAdminDelay()` transaction.
 *
 * Rolls back a pending admin delay change. Must be called by the current
 * default admin before the delay change takes effect.
 * EVM-specific operation — Stellar has no delay mechanism.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleRollbackAdminDelayAction(contractAddress: string): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: ROLLBACK_DEFAULT_ADMIN_DELAY_ABI,
    functionName: 'rollbackDefaultAdminDelay',
    args: [],
  };
}

// ---------------------------------------------------------------------------
// Role Actions (Phase 8 — US6)
// ---------------------------------------------------------------------------

/**
 * Assembles a `grantRole(bytes32 role, address account)` transaction.
 *
 * Grants a role to an account. Must be called by an account with the role's
 * admin role (typically DEFAULT_ADMIN_ROLE for newly created roles).
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param roleId - The bytes32 role identifier
 * @param account - The account to grant the role to (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleGrantRoleAction(
  contractAddress: string,
  roleId: string,
  account: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: GRANT_ROLE_ABI,
    functionName: 'grantRole',
    args: [roleId, account],
  };
}

/**
 * Assembles a `revokeRole(bytes32 role, address account)` transaction.
 *
 * Revokes a role from an account. Must be called by an account with the
 * role's admin role.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param roleId - The bytes32 role identifier
 * @param account - The account to revoke the role from (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleRevokeRoleAction(
  contractAddress: string,
  roleId: string,
  account: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: REVOKE_ROLE_ABI,
    functionName: 'revokeRole',
    args: [roleId, account],
  };
}

/**
 * Assembles a `renounceRole(bytes32 role, address callerConfirmation)` transaction.
 *
 * Renounces a role from the caller's own account. The `callerConfirmation` parameter
 * must match the caller's address — this is an on-chain safety check to prevent
 * accidental renouncement.
 *
 * **EVM-specific extension** — Stellar uses `revokeRole` for self-revocation instead
 * of a separate `renounceRole` function.
 *
 * @param contractAddress - The target contract address (0x-prefixed)
 * @param roleId - The bytes32 role identifier
 * @param account - The caller's address for confirmation (0x-prefixed)
 * @returns WriteContractParameters ready for execution
 */
export function assembleRenounceRoleAction(
  contractAddress: string,
  roleId: string,
  account: string
): WriteContractParameters {
  return {
    address: contractAddress as `0x${string}`,
    abi: RENOUNCE_ROLE_ABI,
    functionName: 'renounceRole',
    args: [roleId, account],
  };
}
