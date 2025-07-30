/**
 * EVM-specific ABI types for comparison and validation
 * Uses viem's Abi type as the foundation for type safety
 */

import type { Abi } from 'viem';

/**
 * Result of comparing two ABIs
 */
export interface AbiComparisonResult {
  /** Whether the ABIs are identical after normalization */
  identical: boolean;
  /** List of differences found between the ABIs */
  differences: AbiDifference[];
  /** Overall severity of the changes */
  severity: 'none' | 'minor' | 'major' | 'breaking';
  /** Human-readable summary of the comparison */
  summary: string;
}

/**
 * Represents a single difference between two ABIs
 */
export interface AbiDifference {
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Which section of the ABI was affected */
  section: 'function' | 'event' | 'constructor' | 'error' | 'fallback' | 'receive';
  /** Name of the affected item (or type if no name) */
  name: string;
  /** Detailed description of the change */
  details: string;
  /** Impact level of this change */
  impact: 'low' | 'medium' | 'high';
  /** Signature before the change (for removed/modified) */
  oldSignature?: string;
  /** Signature after the change (for added/modified) */
  newSignature?: string;
}

/**
 * Result of validating an ABI structure
 */
export interface AbiValidationResult {
  /** Whether the ABI is structurally valid */
  valid: boolean;
  /** List of validation errors found */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Normalized ABI if validation passed */
  normalizedAbi?: Abi;
}

/**
 * Type guard to check if a value is a valid ABI array
 */
export function isValidAbiArray(value: unknown): value is Abi {
  return Array.isArray(value) && value.every(isValidAbiItem);
}

/**
 * Type guard to check if a value is a valid ABI item
 */
export function isValidAbiItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const abiItem = item as Record<string, unknown>;

  // Must have a valid type
  if (typeof abiItem.type !== 'string') {
    return false;
  }

  const validTypes = ['function', 'event', 'constructor', 'error', 'fallback', 'receive'];
  if (!validTypes.includes(abiItem.type)) {
    return false;
  }

  // Functions and events must have a name
  if (
    (abiItem.type === 'function' || abiItem.type === 'event') &&
    typeof abiItem.name !== 'string'
  ) {
    return false;
  }

  // Functions, events, and constructors should have inputs array
  if (
    (abiItem.type === 'function' || abiItem.type === 'event' || abiItem.type === 'constructor') &&
    abiItem.inputs !== undefined &&
    !Array.isArray(abiItem.inputs)
  ) {
    return false;
  }

  return true;
}
