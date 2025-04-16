import { FormFieldType, FormValues } from '@openzeppelin/transaction-form-types/forms';

/**
 * Form values interface for the field editor form
 *
 * While this interface doesn't add any new properties, it provides:
 * 1. A clear, descriptive type name for form values
 * 2. A single place to extend with form-specific properties if needed in the future
 * 3. Type consistency across the form handling components
 */
export interface FieldEditorFormValues extends FormValues, Partial<FormFieldType> {
  // We intentionally don't add any new properties here to maintain a direct mapping
  // to the FormFieldType interface
}
