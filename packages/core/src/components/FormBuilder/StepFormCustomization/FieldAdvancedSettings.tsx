import { Control } from 'react-hook-form';

import { BooleanField, TextAreaField } from '@openzeppelin/transaction-form-renderer';

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
        name="fieldDescription"
        label="Field Description"
        control={control}
        placeholder="Enter field description or instructions"
      />

      <BooleanField
        id="field-required"
        name="fieldRequired"
        label="Required Field"
        control={control}
      />
    </>
  );
}
