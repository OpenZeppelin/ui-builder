import type { ContractSchema, FormFieldType } from '@openzeppelin/transaction-form-types';

// Placeholder
export function formatSolanaTransactionData(
  _contractSchema: ContractSchema, // Use underscore prefix for unused placeholder args
  _functionId: string,
  _submittedInputs: Record<string, unknown>,
  _allFieldsConfig: FormFieldType[]
): unknown {
  console.warn('formatSolanaTransactionData not implemented');
  return {};
}
