/**
 * Form Generator Service
 *
 * Generates form configurations based on contract functions.
 * Uses chain-specific adapters for field type mapping and other chain-specific details.
 */

import type { ContractFunction } from '../core/types/ContractSchema';
import type { FormConfig } from '../core/types/FormTypes';

/**
 * Generates a default form configuration for a contract function
 */
export function generateDefaultFormConfig(
  functionId: string,
  functionDetails: ContractFunction
): FormConfig {
  // This is a placeholder implementation
  // In the future, this will use the appropriate adapter for field generation
  console.log(`Generating form config for function ${functionId}`, functionDetails);

  // For now, return a minimal form config
  return {
    functionId,
    fields: [],
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    },
    theme: {},
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
  };
}
