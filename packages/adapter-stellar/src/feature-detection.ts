/**
 * Feature Detection Module
 *
 * Detects access control capabilities of Stellar (Soroban) contracts by analyzing
 * their function interfaces. Supports detection of Ownable and AccessControl patterns
 * from OpenZeppelin Stellar Contracts.
 */

import type { AccessControlCapabilities, ContractSchema } from '@openzeppelin/ui-builder-types';

/**
 * Known OpenZeppelin Ownable function signatures
 */
const OWNABLE_FUNCTIONS = {
  required: ['get_owner'],
  optional: ['transfer_ownership', 'accept_ownership', 'renounce_ownership'],
} as const;

/**
 * Known OpenZeppelin AccessControl function signatures
 */
const ACCESS_CONTROL_FUNCTIONS = {
  required: ['has_role', 'grant_role', 'revoke_role'],
  optional: [
    'get_role_admin',
    'set_role_admin',
    'get_admin',
    'transfer_admin_role',
    'accept_admin_transfer',
    'renounce_admin',
    'renounce_role',
  ],
} as const;

/**
 * Functions that indicate role enumeration support
 */
const ENUMERATION_FUNCTIONS = ['get_role_member_count', 'get_role_member'] as const;

/**
 * Detects access control capabilities of a Stellar contract
 *
 * @param contractSchema The contract schema to analyze
 * @param indexerAvailable Whether an indexer is configured and available
 * @returns Detected capabilities
 */
export function detectAccessControlCapabilities(
  contractSchema: ContractSchema,
  indexerAvailable = false
): AccessControlCapabilities {
  const functionNames = new Set(contractSchema.functions.map((fn) => fn.name));

  // Detect Ownable
  const hasOwnable = OWNABLE_FUNCTIONS.required.every((fnName) => functionNames.has(fnName));

  // Detect AccessControl
  const hasAccessControl = ACCESS_CONTROL_FUNCTIONS.required.every((fnName) =>
    functionNames.has(fnName)
  );

  // Detect enumerable roles
  const hasEnumerableRoles = ENUMERATION_FUNCTIONS.every((fnName) => functionNames.has(fnName));

  // History is only available when indexer is configured
  const supportsHistory = indexerAvailable;

  // Verify the contract against OZ interfaces
  const verifiedAgainstOZInterfaces = verifyOZInterface(
    functionNames,
    hasOwnable,
    hasAccessControl
  );

  // Collect notes about detected capabilities
  const notes: string[] = [];

  if (hasOwnable) {
    notes.push('OpenZeppelin Ownable interface detected');
  }

  if (hasAccessControl) {
    notes.push('OpenZeppelin AccessControl interface detected');
  }

  if (hasEnumerableRoles) {
    notes.push('Role enumeration supported (get_role_member_count, get_role_member)');
  } else if (hasAccessControl) {
    notes.push('Role enumeration not available - requires event reconstruction');
  }

  if (!indexerAvailable && (hasOwnable || hasAccessControl)) {
    notes.push('History queries unavailable without indexer configuration');
  }

  if (!hasOwnable && !hasAccessControl) {
    notes.push('No OpenZeppelin access control interfaces detected');
  }

  return {
    hasOwnable,
    hasAccessControl,
    hasEnumerableRoles,
    supportsHistory,
    verifiedAgainstOZInterfaces,
    notes: notes.length > 0 ? notes : undefined,
  };
}

/**
 * Verifies that the contract conforms to OpenZeppelin interfaces
 *
 * @param functionNames Set of function names in the contract
 * @param hasOwnable Whether Ownable was detected
 * @param hasAccessControl Whether AccessControl was detected
 * @returns True if verified against OZ interfaces
 */
function verifyOZInterface(
  functionNames: Set<string>,
  hasOwnable: boolean,
  hasAccessControl: boolean
): boolean {
  // If no OZ patterns detected, not applicable
  if (!hasOwnable && !hasAccessControl) {
    return false;
  }

  // Verify Ownable optional functions (at least 2 of 3 should be present)
  if (hasOwnable) {
    const ownableOptionalCount = OWNABLE_FUNCTIONS.optional.filter((fnName) =>
      functionNames.has(fnName)
    ).length;

    if (ownableOptionalCount < 2) {
      return false;
    }
  }

  // Verify AccessControl optional functions (at least 4 of 7 should be present)
  if (hasAccessControl) {
    const accessControlOptionalCount = ACCESS_CONTROL_FUNCTIONS.optional.filter((fnName) =>
      functionNames.has(fnName)
    ).length;

    if (accessControlOptionalCount < 4) {
      return false;
    }
  }

  return true;
}

/**
 * Validates that a contract supports access control operations
 *
 * @param capabilities The detected capabilities
 * @throws Error if contract doesn't support required operations
 */
export function validateAccessControlSupport(
  capabilities: AccessControlCapabilities
): asserts capabilities is
  | (AccessControlCapabilities & { hasOwnable: true })
  | (AccessControlCapabilities & { hasAccessControl: true }) {
  if (!capabilities.hasOwnable && !capabilities.hasAccessControl) {
    throw new Error(
      'UnsupportedContractFeatures: Contract does not implement OpenZeppelin Ownable or AccessControl interfaces'
    );
  }

  if (!capabilities.verifiedAgainstOZInterfaces) {
    throw new Error(
      'UnsupportedContractFeatures: Contract interfaces do not conform to OpenZeppelin standards'
    );
  }
}
