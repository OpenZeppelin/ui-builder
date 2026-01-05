import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Placeholder
export function formatSolanaTransactionData(
  _contractSchema: ContractSchema, // Use underscore prefix for unused placeholder args
  _functionId: string,
  _submittedInputs: Record<string, unknown>,
  _fields: FormFieldType[]
): unknown {
  logger.warn('adapter-solana', 'formatSolanaTransactionData not implemented');
  return {};
}
