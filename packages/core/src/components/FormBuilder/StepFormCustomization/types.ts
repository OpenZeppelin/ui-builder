import { FieldType } from '@openzeppelin/transaction-form-renderer';

/**
 * Form values for the field editor form
 *
 * While similar to FormFieldType, this interface:
 * 1. Uses "field" prefixes to avoid variable name collisions in the form
 * 2. Flattens complex nested properties like validation.required to fieldRequired
 * 3. Maps helperText to fieldDescription for UX clarity
 */
export interface FieldEditorFormValues {
  /** Maps to FormFieldType.type */
  fieldType: FieldType;

  /** Maps to FormFieldType.width */
  fieldWidth: 'full' | 'half' | 'third';

  /** Maps to FormFieldType.label */
  fieldLabel: string;

  /** Maps to FormFieldType.placeholder */
  fieldPlaceholder: string;

  /** Maps to FormFieldType.helperText */
  fieldDescription: string;

  /** Maps to FormFieldType.validation.required */
  fieldRequired: boolean;
}
