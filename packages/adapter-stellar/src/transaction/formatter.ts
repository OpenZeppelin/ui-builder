import type { ContractSchema, FormFieldType } from '@openzeppelin/transaction-form-types';

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
