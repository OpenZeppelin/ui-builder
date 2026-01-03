import type { ContractFunction } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Placeholder
export function formatSolanaFunctionResult(
  decodedValue: unknown,
  _functionDetails: ContractFunction
): string {
  logger.warn('adapter-solana', 'formatSolanaFunctionResult not implemented');
  if (decodedValue === null || decodedValue === undefined) return '(null)';
  // Basic string formatting for now
  return String(decodedValue);
}
