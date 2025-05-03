import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type { FormFieldType } from '@openzeppelin/transaction-form-types/forms';

/**
 * @inheritdoc
 */
export function formatStellarTransactionData(
  _contractSchema: ContractSchema,
  _functionId: string,
  _submittedInputs: Record<string, unknown>,
  _allFieldsConfig: FormFieldType[]
): unknown {
  console.warn('StellarAdapter.formatTransactionData not implemented, returning placeholder data.');
  // Placeholder implementation
  return { data: 'stellar_formatted_placeholder' };
}
