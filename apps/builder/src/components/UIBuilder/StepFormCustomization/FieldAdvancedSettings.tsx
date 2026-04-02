import { Control } from 'react-hook-form';

import { BooleanField, TextAreaField, TextField } from '@openzeppelin/ui-components';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

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
  /**
   * Optional runtime to drive runtime-specific settings (e.g., runtimeSecret extras)
   */
  runtime?: BuilderRuntime;
}

/**
 * Component for editing advanced field settings like description and validation.
 *
 * Provides form controls for:
 * - Runtime-specific property inputs (e.g., identity secret key property name for Midnight)
 * - Field description (optional explanatory text)
 * - Required field validation (hidden for runtime-only fields like runtime secrets)
 *
 * @param props - Component props
 * @param props.control - React Hook Form control instance
 * @param props.fieldType - The current field type
 * @param props.runtime - Optional runtime for runtime-specific field configurations
 */
export function FieldAdvancedSettings({ control, fieldType, runtime }: FieldAdvancedSettingsProps) {
  const propertyCfg = runtime?.typeMapping.getRuntimeFieldBinding?.()?.propertyNameInput;
  const showIdentityProp =
    fieldType === 'runtimeSecret' && (propertyCfg?.visible ?? !!propertyCfg?.metadataKey);

  return (
    <>
      {showIdentityProp && propertyCfg?.metadataKey && (
        <TextField
          id={`identity-secret-prop-${propertyCfg.metadataKey}`}
          name={`adapterBinding.metadata.${propertyCfg.metadataKey}`}
          label={propertyCfg.label || 'Secret Key Property Name'}
          control={control}
          placeholder={propertyCfg.placeholder || 'e.g., secretKey'}
          helperText={propertyCfg.helperText}
        />
      )}

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
