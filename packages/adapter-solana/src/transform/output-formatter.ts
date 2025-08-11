import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
