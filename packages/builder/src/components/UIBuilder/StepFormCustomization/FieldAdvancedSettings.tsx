import { Control } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/ui-builder-types';
import { BooleanField, TextAreaField, TextField } from '@openzeppelin/ui-builder-ui';

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
   * Optional adapter to drive adapter-specific settings (e.g., runtimeSecret extras)
   */
  adapter?: ContractAdapter;
}

/**
 * Component for editing advanced field settings like description and validation.
 *
 * Provides form controls for:
 * - Adapter-specific property inputs (e.g., identity secret key property name for Midnight)
 * - Field description (optional explanatory text)
 * - Required field validation (hidden for runtime-only fields like runtime secrets)
 *
 * @param props - Component props
 * @param props.control - React Hook Form control instance
 * @param props.fieldType - The current field type
 * @param props.adapter - Optional adapter for adapter-specific field configurations
 */
export function FieldAdvancedSettings({ control, fieldType, adapter }: FieldAdvancedSettingsProps) {
  const propertyCfg = adapter?.getRuntimeFieldBinding?.()?.propertyNameInput;
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
