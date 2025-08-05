import { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/contracts-ui-builder-utils';

import { FieldEditorFormValues } from '../types';

/**
 * Initializes form values from a FormFieldType
 */
export function initializeFormValues(field: FormFieldType): FieldEditorFormValues {
  return {
    // Copy all existing properties from the field
    ...field,
    // Ensure hardcodedValue is properly initialized based on field type
    hardcodedValue:
      field.hardcodedValue !== undefined
        ? field.hardcodedValue
        : getDefaultValueForType(field.type),
    // Initialize validation object if not present
    validation: field.validation || { required: false },
    // Ensure boolean flags are properly initialized
    readOnly: field.readOnly ?? false,
    isHidden: field.isHidden ?? false,
    isHardcoded: field.isHardcoded ?? false,
  };
}
