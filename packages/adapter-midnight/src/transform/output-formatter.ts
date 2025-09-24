import type { ContractFunction } from '@openzeppelin/ui-builder-types';

/**
 * Formats a function result for display
 */
export function formatMidnightFunctionResult(
  result: unknown,
  _functionDetails: ContractFunction
): string {
  // TODO: Implement Midnight-specific result formatting
  if (result === null || result === undefined) {
    return 'No data';
  }

  // Placeholder: Return simple string representation
  return String(result);
}
