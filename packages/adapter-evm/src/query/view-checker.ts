import type { ContractFunction } from '@openzeppelin/ui-builder-types';

/**
 * Determines if a function is a view/pure function (read-only).
 * @param functionDetails The function details from the contract schema.
 * @returns True if the function is read-only, false otherwise.
 */
export function isEvmViewFunction(functionDetails: ContractFunction): boolean {
  return functionDetails.stateMutability === 'view' || functionDetails.stateMutability === 'pure';
}
