import { FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { FieldEditorFormValues } from '../types';

/**
 * Converts field editor form values to a partial FormFieldType
 * for updating the original field
 */
export function mapFormValuesToField(
  values: Partial<FieldEditorFormValues>
): Partial<FormFieldType> {
  const fieldUpdates: Partial<FormFieldType> = {};

  if ('fieldType' in values) fieldUpdates.type = values.fieldType!;
  if ('fieldWidth' in values) fieldUpdates.width = values.fieldWidth;
  if ('fieldLabel' in values) fieldUpdates.label = values.fieldLabel!;
  if ('fieldPlaceholder' in values) fieldUpdates.placeholder = values.fieldPlaceholder;
  if ('fieldDescription' in values) fieldUpdates.helperText = values.fieldDescription;

  if ('fieldRequired' in values) {
    fieldUpdates.validation = {
      required: values.fieldRequired,
    };
  }

  return fieldUpdates;
}

/**
 * Initializes form values from a FormFieldType
 */
export function initializeFormValues(field: FormFieldType): FieldEditorFormValues {
  return {
    fieldType: field.type,
    fieldWidth: field.width || 'full',
    fieldLabel: field.label || '',
    fieldPlaceholder: field.placeholder || '',
    fieldDescription: field.helperText || '',
    fieldRequired: field.validation?.required || false,
  };
}
