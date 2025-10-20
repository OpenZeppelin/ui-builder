import type { ContractFunction } from '@openzeppelin/ui-builder-types';

/**
 * Determines if a function is a view/pure function (read-only)
 *
 * A view function in Midnight is one that does not modify contract state.
 * These functions can be queried without submitting a transaction.
 *
 * @param functionDetails The function details from the contract schema
 * @returns True if the function is a view function (does not modify state)
 */
export function isMidnightViewFunction(functionDetails: ContractFunction): boolean {
  // A function is a view function if it does NOT modify state
  return !functionDetails.modifiesState;
}
