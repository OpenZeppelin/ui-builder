/**
 * EVM Access Control Feature Detection
 *
 * Detects access control capabilities by analyzing a contract's ABI (via ContractSchema).
 * Checks function names AND parameter types against known OpenZeppelin signatures to
 * avoid false positives from similarly-named functions.
 *
 * Supports detection of:
 * - Ownable / Ownable2Step
 * - AccessControl
 * - AccessControlEnumerable
 * - AccessControlDefaultAdminRules (including admin delay operations)
 *
 * @module access-control/feature-detection
 * @see research.md §R4 — Feature Detection via ABI Analysis
 * @see contracts/feature-detection.ts — Detection matrix
 */

import type { AccessControlCapabilities, ContractSchema } from '@openzeppelin/ui-types';

import {
  ACCESS_CONTROL_SIGNATURES,
  DEFAULT_ADMIN_RULES_SIGNATURES,
  ENUMERABLE_SIGNATURES,
  OWNABLE_SIGNATURES,
  OWNABLE_TWO_STEP_SIGNATURES,
} from './abis';

// ---------------------------------------------------------------------------
// Internal Types
// ---------------------------------------------------------------------------

/** Describes a function signature for matching against the ABI */
interface FunctionSignature {
  readonly name: string;
  readonly inputs: readonly string[];
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from the contract schema's functions array.
 * Key is the function name; value is an array of input type arrays
 * (to handle overloaded functions with the same name but different params).
 */
function buildFunctionLookup(contractSchema: ContractSchema): Map<string, string[][]> {
  const lookup = new Map<string, string[][]>();

  for (const fn of contractSchema.functions) {
    const inputTypes = fn.inputs.map((input) => input.type);
    const existing = lookup.get(fn.name);
    if (existing) {
      existing.push(inputTypes);
    } else {
      lookup.set(fn.name, [inputTypes]);
    }
  }

  return lookup;
}

/**
 * Checks whether a specific function signature exists in the lookup.
 * Matches both the function name and the parameter types.
 */
function hasFunction(lookup: Map<string, string[][]>, sig: FunctionSignature): boolean {
  const overloads = lookup.get(sig.name);
  if (!overloads) return false;

  return overloads.some((inputTypes) => {
    if (inputTypes.length !== sig.inputs.length) return false;
    return inputTypes.every((type, i) => type === sig.inputs[i]);
  });
}

/**
 * Checks whether ALL signatures in a set are present in the lookup.
 */
function hasAllFunctions(
  lookup: Map<string, string[][]>,
  signatures: readonly FunctionSignature[]
): boolean {
  return signatures.every((sig) => hasFunction(lookup, sig));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect access control capabilities from a contract's ABI.
 *
 * Analyzes `ContractSchema.functions` for the presence of OpenZeppelin
 * access control function signatures, checking both function names AND
 * parameter types for accuracy.
 *
 * @param contractSchema - Parsed contract schema with functions array
 * @param indexerAvailable - Whether an indexer endpoint is configured and reachable
 * @returns Detected capabilities flags
 */
export function detectAccessControlCapabilities(
  contractSchema: ContractSchema,
  indexerAvailable = false
): AccessControlCapabilities {
  const lookup = buildFunctionLookup(contractSchema);

  // ── Ownable Detection ─────────────────────────────────────────────
  const hasOwnable = hasAllFunctions(lookup, OWNABLE_SIGNATURES);

  // ── Ownable2Step Detection ────────────────────────────────────────
  const hasTwoStepOwnable = hasOwnable && hasAllFunctions(lookup, OWNABLE_TWO_STEP_SIGNATURES);

  // ── AccessControl Detection ───────────────────────────────────────
  const hasAccessControl = hasAllFunctions(lookup, ACCESS_CONTROL_SIGNATURES);

  // ── AccessControlEnumerable Detection ─────────────────────────────
  const hasEnumerableRoles = hasAccessControl && hasAllFunctions(lookup, ENUMERABLE_SIGNATURES);

  // ── AccessControlDefaultAdminRules Detection ──────────────────────
  const hasTwoStepAdmin =
    hasAccessControl && hasAllFunctions(lookup, DEFAULT_ADMIN_RULES_SIGNATURES);

  // ── History Support ───────────────────────────────────────────────
  const supportsHistory = indexerAvailable;

  // ── OZ Interface Verification ─────────────────────────────────────
  // For EVM, ABI-based detection is sufficient. Unlike Stellar, EVM does not
  // have "optional" functions in the same sense. If the required functions are
  // present with correct signatures, the contract conforms to the OZ interface.
  // We set verifiedAgainstOZInterfaces = true if at least one pattern is detected.
  const verifiedAgainstOZInterfaces = hasOwnable || hasAccessControl;

  // ── Notes ─────────────────────────────────────────────────────────
  const notes: string[] = [];

  if (hasOwnable) {
    if (hasTwoStepOwnable) {
      notes.push(
        'OpenZeppelin Ownable2Step interface detected (with pendingOwner + acceptOwnership)'
      );
    } else {
      notes.push('OpenZeppelin Ownable interface detected');
    }
  }

  if (hasAccessControl) {
    if (hasTwoStepAdmin) {
      notes.push('OpenZeppelin AccessControlDefaultAdminRules interface detected');
    } else {
      notes.push('OpenZeppelin AccessControl interface detected');
    }

    if (hasEnumerableRoles) {
      notes.push('Role enumeration supported (getRoleMemberCount, getRoleMember)');
    } else {
      notes.push('Role enumeration not available — requires known role IDs or indexer discovery');
    }
  }

  if (!indexerAvailable && (hasOwnable || hasAccessControl)) {
    notes.push('History queries unavailable without indexer configuration');
  }

  if (!hasOwnable && !hasAccessControl) {
    notes.push('No OpenZeppelin access control interfaces detected');
  }

  return {
    hasOwnable,
    hasTwoStepOwnable,
    hasAccessControl,
    hasTwoStepAdmin,
    hasEnumerableRoles,
    supportsHistory,
    verifiedAgainstOZInterfaces,
    notes: notes.length > 0 ? notes : undefined,
  };
}

/**
 * Validate that a contract has minimum viable access control support.
 *
 * Returns `true` if the contract has at least Ownable or AccessControl.
 * Unlike the Stellar adapter's version (which throws), this returns a boolean
 * for simpler integration — callers can decide how to handle unsupported contracts.
 *
 * @param capabilities - Previously detected capabilities
 * @returns true if the contract has at least Ownable or AccessControl
 */
export function validateAccessControlSupport(capabilities: AccessControlCapabilities): boolean {
  return capabilities.hasOwnable || capabilities.hasAccessControl;
}
