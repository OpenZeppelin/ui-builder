import { Control } from 'react-hook-form';

import { BooleanField, TextAreaField } from '@openzeppelin/transaction-form-ui';

import { FieldEditorFormValues } from './types';

interface FieldAdvancedSettingsProps {
  /**
   * React Hook Form control
   */
  control: Control<FieldEditorFormValues>;
}

/**
 * Component for editing advanced field settings like description and validation
 */
export function FieldAdvancedSettings({ control }: FieldAdvancedSettingsProps) {
  return (
    <>
      <TextAreaField
        id="field-description"
        name="helperText"
        label="Field Description"
        control={control}
        placeholder="Enter field description or instructions"
      />

      {/* 
        React Hook Form supports dot notation in name attributes to access nested properties.
        "validation.required" will automatically:
        1. Access/create the validation object in form values
        2. Set the required property within that object
        3. Maintain the proper nested structure needed for FormFieldType
      */}
      <BooleanField
        id="field-required"
        name="validation.required"
        label="Required Field"
        control={control}
      />
    </>
  );
}
