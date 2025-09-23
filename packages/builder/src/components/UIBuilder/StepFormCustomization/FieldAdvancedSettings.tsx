import { Control } from 'react-hook-form';

import { BooleanField, TextAreaField } from '@openzeppelin/contracts-ui-builder-ui';

import { FieldEditorFormValues } from './types';

interface FieldAdvancedSettingsProps {
  /**
   * React Hook Form control instance for managing form state
   */
  control: Control<FieldEditorFormValues>;
}

/**
 * Component for editing advanced field settings like description and validation.
 *
 * Provides form controls for:
 * - Field description (optional explanatory text)
 * - Required field validation
 *
 * @param props - Component props
 * @param props.control - React Hook Form control instance
 */
export function FieldAdvancedSettings({ control }: FieldAdvancedSettingsProps) {
  return (
    <>
      <TextAreaField
        id="field-description"
        name="description"
        label="Field Description"
        control={control}
        placeholder="Enter field description or instructions"
      />

      <BooleanField
        id="is-required"
        name="validation.required"
        label="Required Field"
        control={control}
      />
    </>
  );
}
