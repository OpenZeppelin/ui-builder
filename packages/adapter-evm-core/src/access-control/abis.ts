/**
 * EVM Access Control ABI Fragments
 *
 * Single-function ABI fragments for all access control operations.
 * Used by the on-chain reader (read operations) and actions module (write operations).
 *
 * Each constant is a minimal ABI array containing exactly one function definition,
 * suitable for use with viem's `readContract()` and `writeContract()`.
 *
 * @module access-control/abis
 */

import type { Abi } from 'viem';

// ---------------------------------------------------------------------------
// Ownable
// ---------------------------------------------------------------------------

/** ABI for `owner() → address` */
export const OWNER_ABI: Abi = [
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `transferOwnership(address newOwner)` */
export const TRANSFER_OWNERSHIP_ABI: Abi = [
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `renounceOwnership()` */
export const RENOUNCE_OWNERSHIP_ABI: Abi = [
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ---------------------------------------------------------------------------
// Ownable2Step
// ---------------------------------------------------------------------------

/** ABI for `pendingOwner() → address` */
export const PENDING_OWNER_ABI: Abi = [
  {
    type: 'function',
    name: 'pendingOwner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `acceptOwnership()` */
export const ACCEPT_OWNERSHIP_ABI: Abi = [
  {
    type: 'function',
    name: 'acceptOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ---------------------------------------------------------------------------
// AccessControl
// ---------------------------------------------------------------------------

/** ABI for `hasRole(bytes32 role, address account) → bool` */
export const HAS_ROLE_ABI: Abi = [
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `getRoleAdmin(bytes32 role) → bytes32` */
export const GET_ROLE_ADMIN_ABI: Abi = [
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [{ name: 'role', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `grantRole(bytes32 role, address account)` */
export const GRANT_ROLE_ABI: Abi = [
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `revokeRole(bytes32 role, address account)` */
export const REVOKE_ROLE_ABI: Abi = [
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `renounceRole(bytes32 role, address callerConfirmation)` */
export const RENOUNCE_ROLE_ABI: Abi = [
  {
    type: 'function',
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'callerConfirmation', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ---------------------------------------------------------------------------
// AccessControlEnumerable
// ---------------------------------------------------------------------------

/** ABI for `getRoleMemberCount(bytes32 role) → uint256` */
export const GET_ROLE_MEMBER_COUNT_ABI: Abi = [
  {
    type: 'function',
    name: 'getRoleMemberCount',
    inputs: [{ name: 'role', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `getRoleMember(bytes32 role, uint256 index) → address` */
export const GET_ROLE_MEMBER_ABI: Abi = [
  {
    type: 'function',
    name: 'getRoleMember',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// ---------------------------------------------------------------------------
// AccessControlDefaultAdminRules
// ---------------------------------------------------------------------------

/** ABI for `defaultAdmin() → address` */
export const DEFAULT_ADMIN_ABI: Abi = [
  {
    type: 'function',
    name: 'defaultAdmin',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

/**
 * ABI for `pendingDefaultAdmin() → (address newAdmin, uint48 schedule)`
 *
 * Returns a tuple of the pending new admin address and the UNIX timestamp
 * (in seconds) at which the transfer can be accepted.
 */
export const PENDING_DEFAULT_ADMIN_ABI: Abi = [
  {
    type: 'function',
    name: 'pendingDefaultAdmin',
    inputs: [],
    outputs: [
      { name: 'newAdmin', type: 'address' },
      { name: 'schedule', type: 'uint48' },
    ],
    stateMutability: 'view',
  },
] as const;

/** ABI for `defaultAdminDelay() → uint48` */
export const DEFAULT_ADMIN_DELAY_ABI: Abi = [
  {
    type: 'function',
    name: 'defaultAdminDelay',
    inputs: [],
    outputs: [{ name: '', type: 'uint48' }],
    stateMutability: 'view',
  },
] as const;

/** ABI for `beginDefaultAdminTransfer(address newAdmin)` */
export const BEGIN_DEFAULT_ADMIN_TRANSFER_ABI: Abi = [
  {
    type: 'function',
    name: 'beginDefaultAdminTransfer',
    inputs: [{ name: 'newAdmin', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `acceptDefaultAdminTransfer()` */
export const ACCEPT_DEFAULT_ADMIN_TRANSFER_ABI: Abi = [
  {
    type: 'function',
    name: 'acceptDefaultAdminTransfer',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `cancelDefaultAdminTransfer()` */
export const CANCEL_DEFAULT_ADMIN_TRANSFER_ABI: Abi = [
  {
    type: 'function',
    name: 'cancelDefaultAdminTransfer',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ---------------------------------------------------------------------------
// Admin Delay Change Operations
// ---------------------------------------------------------------------------

/** ABI for `changeDefaultAdminDelay(uint48 newDelay)` */
export const CHANGE_DEFAULT_ADMIN_DELAY_ABI: Abi = [
  {
    type: 'function',
    name: 'changeDefaultAdminDelay',
    inputs: [{ name: 'newDelay', type: 'uint48' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

/** ABI for `rollbackDefaultAdminDelay()` */
export const ROLLBACK_DEFAULT_ADMIN_DELAY_ABI: Abi = [
  {
    type: 'function',
    name: 'rollbackDefaultAdminDelay',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ---------------------------------------------------------------------------
// ERC-165 (optional on-chain verification)
// ---------------------------------------------------------------------------

/** ABI for `supportsInterface(bytes4 interfaceId) → bool` */
export const SUPPORTS_INTERFACE_ABI: Abi = [
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// ---------------------------------------------------------------------------
// Feature Detection Signature Constants
// ---------------------------------------------------------------------------

/**
 * Function signature descriptors for ABI-based capability detection.
 * Used by `feature-detection.ts` to match function names AND parameter types
 * against the contract's ABI, avoiding false positives from similarly-named functions.
 *
 * @see contracts/feature-detection.ts for the full detection matrix
 */

/** Functions required for Ownable detection */
export const OWNABLE_SIGNATURES = [
  { name: 'owner', inputs: [] as string[] },
  { name: 'transferOwnership', inputs: ['address'] },
] as const;

/** Additional functions for Ownable2Step detection */
export const OWNABLE_TWO_STEP_SIGNATURES = [
  { name: 'pendingOwner', inputs: [] as string[] },
  { name: 'acceptOwnership', inputs: [] as string[] },
] as const;

/** Functions required for AccessControl detection */
export const ACCESS_CONTROL_SIGNATURES = [
  { name: 'hasRole', inputs: ['bytes32', 'address'] },
  { name: 'grantRole', inputs: ['bytes32', 'address'] },
  { name: 'revokeRole', inputs: ['bytes32', 'address'] },
  { name: 'getRoleAdmin', inputs: ['bytes32'] },
] as const;

/** Additional functions for AccessControlEnumerable detection */
export const ENUMERABLE_SIGNATURES = [
  { name: 'getRoleMemberCount', inputs: ['bytes32'] },
  { name: 'getRoleMember', inputs: ['bytes32', 'uint256'] },
] as const;

/** Additional functions for AccessControlDefaultAdminRules detection */
export const DEFAULT_ADMIN_RULES_SIGNATURES = [
  { name: 'defaultAdmin', inputs: [] as string[] },
  { name: 'pendingDefaultAdmin', inputs: [] as string[] },
  { name: 'beginDefaultAdminTransfer', inputs: ['address'] },
  { name: 'acceptDefaultAdminTransfer', inputs: [] as string[] },
  { name: 'cancelDefaultAdminTransfer', inputs: [] as string[] },
] as const;

/** Additional functions for admin delay change operations */
export const ADMIN_DELAY_CHANGE_SIGNATURES = [
  { name: 'changeDefaultAdminDelay', inputs: ['uint48'] },
  { name: 'rollbackDefaultAdminDelay', inputs: [] as string[] },
] as const;

// ---------------------------------------------------------------------------
// ERC-165 Interface IDs (for optional on-chain verification)
// ---------------------------------------------------------------------------

/**
 * Well-known ERC-165 interface identifiers for OpenZeppelin access control contracts.
 * Can be used with `supportsInterface()` for on-chain verification.
 */
export const ERC165_INTERFACE_IDS = {
  /** IAccessControl: 0x7965db0b */
  ACCESS_CONTROL: '0x7965db0b',
  /** IAccessControlEnumerable: 0x5a05180f */
  ACCESS_CONTROL_ENUMERABLE: '0x5a05180f',
  /** IAccessControlDefaultAdminRules: 0x31498786 (OZ v5) */
  ACCESS_CONTROL_DEFAULT_ADMIN_RULES: '0x31498786',
} as const;
