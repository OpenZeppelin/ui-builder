import type { ContractFunction, ContractSchema } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Determines if a function is a view/pure function (read-only) for Stellar contracts.
 * @param functionDetails The function details from the contract schema.
 * @returns True if the function is read-only, false otherwise.
 */
export function isStellarViewFunction(functionDetails: ContractFunction): boolean {
  // First check stateMutability if available (following EVM pattern)
  if (functionDetails.stateMutability) {
    return functionDetails.stateMutability === 'view' || functionDetails.stateMutability === 'pure';
  }

  // Fallback to modifiesState if stateMutability is not available
  return !functionDetails.modifiesState;
}

/**
 * Get only the functions that modify state (writable functions) for Stellar contracts.
 * @param contractSchema The contract schema to filter
 * @returns Array of writable functions
 */
export function getStellarWritableFunctions(
  contractSchema: ContractSchema
): ContractSchema['functions'] {
  return contractSchema.functions.filter((func) => !isStellarViewFunction(func));
}
