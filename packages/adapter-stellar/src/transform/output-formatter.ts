import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Formats a function result for display
 */
export function formatStellarFunctionResult(
  result: unknown,
  _functionDetails: ContractFunction
): string {
  // TODO: Implement Stellar-specific result formatting
  if (result === null || result === undefined) {
    return 'No data';
  }

  // Placeholder: Return simple string representation
  return String(result);
}
