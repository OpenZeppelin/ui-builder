import { Control } from 'react-hook-form';

import { BooleanField, TextAreaField } from '@openzeppelin/ui-builder-ui';

import { shouldShowFieldTypeSelector } from './utils/fieldTypeUtils';

import { FieldEditorFormValues } from './types';

interface FieldAdvancedSettingsProps {
  /**
   * React Hook Form control instance for managing form state
   */
  control: Control<FieldEditorFormValues>;

  /**
   * The current field type to determine which settings to display
   */
  fieldType?: string;
}

/**
 * Component for editing advanced field settings like description and validation.
 *
 * Provides form controls for:
 * - Field description (optional explanatory text)
 * - Required field validation (hidden for runtime-only fields like runtime secrets)
 *
 * @param props - Component props
 * @param props.control - React Hook Form control instance
 * @param props.fieldType - The current field type
 */
export function FieldAdvancedSettings({ control, fieldType }: FieldAdvancedSettingsProps) {
  return (
    <>
      <TextAreaField
        id="field-description"
        name="description"
        label="Field Description"
        control={control}
        placeholder="Enter field description or instructions"
      />

      {shouldShowFieldTypeSelector(fieldType) && (
        <BooleanField
          id="is-required"
          name="validation.required"
          label="Required Field"
          control={control}
        />
      )}
    </>
  );
}
