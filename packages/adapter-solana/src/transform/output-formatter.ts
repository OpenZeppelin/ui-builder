import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';

// Placeholder
export function formatSolanaFunctionResult(
  decodedValue: unknown,
  _functionDetails: ContractFunction
): string {
  console.warn('formatSolanaFunctionResult not implemented');
  if (decodedValue === null || decodedValue === undefined) return '(null)';
  // Basic string formatting for now
  return String(decodedValue);
}
