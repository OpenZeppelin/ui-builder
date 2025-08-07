import type { ContractSchema, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * @inheritdoc
 */
export function formatStellarTransactionData(
  _contractSchema: ContractSchema,
  _functionId: string,
  _submittedInputs: Record<string, unknown>,
  _fields: FormFieldType[]
): unknown {
  logger.warn('adapter-stellar', 'formatTransactionData not implemented, returning placeholder data.');
  // Placeholder implementation
  return { data: 'stellar_formatted_placeholder' };
}
