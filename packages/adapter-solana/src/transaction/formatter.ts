import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type { FormFieldType } from '@openzeppelin/transaction-form-types/forms';

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
