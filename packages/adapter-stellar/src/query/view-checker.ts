import type { ContractFunction, ContractSchema } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Determines if a function is a view/pure function (read-only) for Stellar contracts.
 * This function works with simulation-based state mutability detection results
 * from the contract loader, following the same approach as the official Stellar Laboratory.
 *
 * @param functionDetails The function details from the contract schema (with simulation-based mutability info).
 * @returns True if the function is read-only, false otherwise.
 */
export function isStellarViewFunction(functionDetails: ContractFunction): boolean {
  // First check stateMutability if available (set by simulation-based detection)
  if (functionDetails.stateMutability) {
    return functionDetails.stateMutability === 'view' || functionDetails.stateMutability === 'pure';
  }

  // Fallback to modifiesState if stateMutability is not available
  // (also set by simulation-based detection in the loader)
  return !functionDetails.modifiesState;
}

/**
 * Get only the functions that modify state (writable functions) for Stellar contracts.
 * Uses simulation-based state mutability detection results to accurately filter functions.
 * @param contractSchema The contract schema to filter (with simulation-based mutability info).
 * @returns Array of writable functions
 */
export function getStellarWritableFunctions(
  contractSchema: ContractSchema
): ContractSchema['functions'] {
  return contractSchema.functions.filter((func) => !isStellarViewFunction(func));
}
