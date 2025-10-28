import type { FormFieldType, FormValues } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Extracts runtime secrets from form submission data and field configuration.
 *
 * Handles two cases:
 * 1. User-provided runtime secret (field value in form data)
 * 2. Hardcoded readonly runtime secret (from field configuration)
 *
 * Returns both the extracted secrets and the cleaned contract arguments
 * (with runtimeSecret fields removed).
 *
 * @param data - Form submission data from React Hook Form
 * @param fields - Field configuration array from the schema
 * @returns Object containing extracted secrets and cleaned contract arguments
 */
export function extractRuntimeSecrets(
  data: FormValues,
  fields: FormFieldType[]
): {
  runtimeSecrets: Record<string, string>;
  contractArgs: FormValues;
} {
  const runtimeSecrets: Record<string, string> = {};
  const contractArgs = { ...data };

  logger.debug('TransactionForm', 'All form data values:', data);
  logger.debug(
    'TransactionForm',
    'Schema fields:',
    fields.map((f) => ({ name: f.name, type: f.type, readOnly: f.readOnly }))
  );

  // Identify and extract runtimeSecret fields
  fields.forEach((field) => {
    if (field.type === 'runtimeSecret' && field.adapterBinding?.key) {
      // Try to get value from form data first
      let secretValue = data[field.name];

      // If readonly and no value in form data, try to get hardcoded value from field config
      if (field.readOnly && !secretValue && 'hardcodedValue' in field) {
        secretValue = (field as unknown as { hardcodedValue?: string }).hardcodedValue;
        logger.debug(
          'TransactionForm',
          `Using hardcoded value for readonly runtimeSecret field: ${field.name}`,
          {
            secretValue,
          }
        );
      }

      logger.debug('TransactionForm', `Processing runtimeSecret field: ${field.name}`, {
        secretValue,
        readOnly: field.readOnly,
      });

      if (secretValue) {
        runtimeSecrets[field.adapterBinding.key] = secretValue as string;
      }
      // Remove from contract args
      delete contractArgs[field.name];
    }
  });

  logger.debug(
    'TransactionForm',
    'Extracted runtime secrets:',
    Object.keys(runtimeSecrets),
    runtimeSecrets
  );

  return { runtimeSecrets, contractArgs };
}
