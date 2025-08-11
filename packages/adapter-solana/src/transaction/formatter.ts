import type { ContractSchema, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
