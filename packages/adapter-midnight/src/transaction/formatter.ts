import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type { FormFieldType } from '@openzeppelin/transaction-form-types/forms';

/**
 * @inheritdoc
 */
export function formatMidnightTransactionData(
  _contractSchema: ContractSchema,
  _functionId: string,
  _submittedInputs: Record<string, unknown>,
  _allFieldsConfig: FormFieldType[]
): unknown {
  console.warn(
    'MidnightAdapter.formatTransactionData not implemented, returning placeholder data.'
  );
  // Placeholder implementation
  return { data: 'midnight_formatted_placeholder' };
}
