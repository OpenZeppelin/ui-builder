import { FormFieldType } from '@openzeppelin/transaction-form-types';

import { FieldEditorFormValues } from '../types';

/**
 * Initializes form values from a FormFieldType
 */
export function initializeFormValues(field: FormFieldType): FieldEditorFormValues {
  return {
    // Copy all existing properties from the field
    ...field,
    // Ensure hardcodedValue is always defined to prevent uncontrolled/controlled issues
    hardcodedValue: field.hardcodedValue ?? '',
    // Initialize validation object if not present
    validation: field.validation || { required: false },
    // Ensure isReadOnly is initialized
    isReadOnly: field.isReadOnly ?? false,
  };
}
