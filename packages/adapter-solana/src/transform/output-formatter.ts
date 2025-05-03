import type { ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

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
