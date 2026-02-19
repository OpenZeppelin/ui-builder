/**
 * Feature Detection — API Contract
 *
 * Documents the ABI-based capability detection logic.
 */

import type { AccessControlCapabilities, ContractSchema } from '@openzeppelin/ui-types';

// ---------------------------------------------------------------------------
// ABI Function Signatures for Detection
// ---------------------------------------------------------------------------

/** Functions required for Ownable detection */
export const OWNABLE_FUNCTIONS = [
  { name: 'owner', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'transferOwnership', inputs: [{ type: 'address' }], outputs: [] },
] as const;

/** Additional functions for Ownable2Step detection */
export const OWNABLE_TWO_STEP_FUNCTIONS = [
  { name: 'pendingOwner', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'acceptOwnership', inputs: [], outputs: [] },
] as const;

/** Functions required for AccessControl detection */
export const ACCESS_CONTROL_FUNCTIONS = [
  {
    name: 'hasRole',
    inputs: [{ type: 'bytes32' }, { type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  { name: 'grantRole', inputs: [{ type: 'bytes32' }, { type: 'address' }], outputs: [] },
  { name: 'revokeRole', inputs: [{ type: 'bytes32' }, { type: 'address' }], outputs: [] },
  { name: 'getRoleAdmin', inputs: [{ type: 'bytes32' }], outputs: [{ type: 'bytes32' }] },
] as const;

/** Additional functions for AccessControlEnumerable detection */
export const ENUMERABLE_FUNCTIONS = [
  { name: 'getRoleMemberCount', inputs: [{ type: 'bytes32' }], outputs: [{ type: 'uint256' }] },
  {
    name: 'getRoleMember',
    inputs: [{ type: 'bytes32' }, { type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
] as const;

/** Additional functions for AccessControlDefaultAdminRules detection */
export const DEFAULT_ADMIN_RULES_FUNCTIONS = [
  { name: 'defaultAdmin', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'pendingDefaultAdmin', inputs: [], outputs: [{ type: 'address' }, { type: 'uint48' }] },
  { name: 'defaultAdminDelay', inputs: [], outputs: [{ type: 'uint48' }] },
  { name: 'beginDefaultAdminTransfer', inputs: [{ type: 'address' }], outputs: [] },
  { name: 'acceptDefaultAdminTransfer', inputs: [], outputs: [] },
  { name: 'cancelDefaultAdminTransfer', inputs: [], outputs: [] },
] as const;

/** Additional functions for admin delay change operations */
export const ADMIN_DELAY_CHANGE_FUNCTIONS = [
  { name: 'changeDefaultAdminDelay', inputs: [{ type: 'uint48' }], outputs: [] },
  { name: 'rollbackDefaultAdminDelay', inputs: [], outputs: [] },
] as const;

// ---------------------------------------------------------------------------
// Detection API
// ---------------------------------------------------------------------------

/**
 * Detect access control capabilities from contract ABI.
 *
 * Analyzes ContractSchema.functions for the presence of OpenZeppelin
 * access control function signatures.
 *
 * @param contractSchema - Parsed contract schema with functions array
 * @returns Detected capabilities
 */
export declare function detectAccessControlCapabilities(
  contractSchema: ContractSchema
): AccessControlCapabilities;

/**
 * Validate that a contract has minimum viable access control support.
 *
 * @param capabilities - Previously detected capabilities
 * @returns true if the contract has at least Ownable or AccessControl
 */
export declare function validateAccessControlSupport(
  capabilities: AccessControlCapabilities
): boolean;

// ---------------------------------------------------------------------------
// ERC-165 Interface IDs (for optional on-chain verification)
// ---------------------------------------------------------------------------

export const ERC165_INTERFACE_IDS = {
  /** IAccessControl: 0x7965db0b */
  ACCESS_CONTROL: '0x7965db0b',
  /** IAccessControlEnumerable: 0x5a05180f */
  ACCESS_CONTROL_ENUMERABLE: '0x5a05180f',
  /** IAccessControlDefaultAdminRules: 0x31498786 (OZ v5) */
  ACCESS_CONTROL_DEFAULT_ADMIN_RULES: '0x31498786',
} as const;
