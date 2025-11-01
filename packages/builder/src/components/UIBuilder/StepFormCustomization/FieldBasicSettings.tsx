import { useEffect, useMemo } from 'react';
import { Control, useFormState, useWatch } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/ui-builder-renderer';
import { ContractAdapter, FormFieldType } from '@openzeppelin/ui-builder-types';
import { Banner, BooleanField, SelectGroupedField, TextField } from '@openzeppelin/ui-builder-ui';

import { OptionGroup, shouldShowFieldTypeSelector } from './utils/fieldTypeUtils';

import { FieldEditorFormValues } from './types';

interface FieldBasicSettingsProps {
  /**
   * React Hook Form control instance for managing form state
   */
  control: Control<FieldEditorFormValues>;

  /**
   * Field type groups for the select dropdown, organized by category
   */
  fieldTypeGroups: OptionGroup[];

  /**
   * React Hook Form trigger function for manual validation
   */
  trigger?: (name?: string | string[]) => Promise<boolean>;

  /**
   * The adapter for chain-specific type mapping and validation
   */
  adapter?: ContractAdapter;

  /**
   * The original field being edited.
   * Contains all field properties including components, elementType, etc.
   */
  field: FormFieldType;

  /**
   * Callback fired when field validation status changes
   */
  onFieldValidationChange?: (fieldId: string, hasError: boolean) => void;
}

/**
 * Component for editing basic field settings like label, type, placeholder, and visibility options.
 *
 * Provides form controls for:
 * - Field label and placeholder text
 * - Field type selection (text, number, address, etc.)
 * - Visibility options (hidden, hardcoded values)
 * - Hardcoded value configuration when applicable
 *
 * @param props - Component props
 * @param props.control - React Hook Form control instance
 * @param props.fieldTypeGroups - Available field types organized by category
 * @param props.adapter - Chain-specific adapter for type validation
 * @param props.field - The field being edited with its current configuration
 */
export function FieldBasicSettings({
  control,
  fieldTypeGroups,
  adapter,
  field,
  onFieldValidationChange,
  trigger,
}: FieldBasicSettingsProps) {
  // TODO: Prevent wizard from advancing to the next step if `isHardcodedValueInvalid` is true.
  // This might involve lifting the validation state up or providing a callback/ref to the parent wizard.

  const isHardcoded = useWatch({ control, name: 'isHardcoded' }) || false;
  const fieldType = useWatch({ control, name: 'type' }) || 'text';
  // Watch the 'Required Field' checkbox state
  const isFieldRequired = useWatch({ control, name: 'validation.required' }) || false;
  // Watch the hardcodedValue to detect changes
  const hardcodedValue = useWatch({ control, name: 'hardcodedValue' });
  // Get the complete form state to track hardcodedValue errors
  // Using useFormState with explicit subscription to ensure we get updates
  const formState = useFormState({
    control,
    name: 'hardcodedValue', // Subscribe specifically to this field's changes
  });
  // Check specifically for the hardcodedValue error
  const hardcodedValueError = formState.errors?.hardcodedValue;
  const isHardcodedValueInvalid = !!hardcodedValueError;

  // Trigger validation when hardcoded is toggled on or hardcodedValue changes
  useEffect(() => {
    if (isHardcoded && trigger) {
      // Force validation of the hardcodedValue field when hardcoded is enabled or value changes
      // Use a small delay to allow React Hook Form to update its internal state
      const timeoutId = setTimeout(() => {
        void trigger('hardcodedValue');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isHardcoded, hardcodedValue, trigger]);

  // Report validation status to parent component
  useEffect(() => {
    if (onFieldValidationChange) {
      // Only report hardcoded value validation errors when the field is actually hardcoded
      // This prevents false positives when the field is not hardcoded
      const shouldReportError = isHardcoded && isHardcodedValueInvalid;
      onFieldValidationChange(field.id, shouldReportError);
    }
  }, [field.id, isHardcoded, isHardcodedValueInvalid, onFieldValidationChange]);

  // Construct synthetic field config for DynamicFormField
  const hardcodedFieldConfig = useMemo(
    (): FormFieldType => ({
      id: 'hardcoded-value',
      name: 'hardcodedValue',
      label: 'Hardcoded Value',
      type: fieldType,
      // Make hardcoded value required only if the main field is marked as required
      validation: isFieldRequired ? { required: true } : {},
      // Add the missing properties based on the original field's structure
      ...((fieldType === 'object' || fieldType === 'array-object') && field.components
        ? { components: field.components }
        : {}),
      ...(fieldType === 'array' && field.elementType
        ? {
            elementType: field.elementType,
            elementFieldConfig: field.elementFieldConfig,
          }
        : {}),
      ...(fieldType === 'enum' && field.enumMetadata ? { enumMetadata: field.enumMetadata } : {}),
      ...(fieldType === 'map' && field.mapMetadata ? { mapMetadata: field.mapMetadata } : {}),
    }),
    [
      fieldType,
      isFieldRequired,
      field.components,
      field.elementType,
      field.elementFieldConfig,
      field.enumMetadata,
      field.mapMetadata,
    ]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className={!shouldShowFieldTypeSelector(fieldType) ? 'md:col-span-2' : ''}>
        <TextField
          id="field-label"
          name="label"
          label="Field Label"
          control={control}
          placeholder="Enter field label"
        />
      </div>

      {shouldShowFieldTypeSelector(fieldType) && (
        <SelectGroupedField
          id="field-type"
          name="type"
          label="Field Type"
          control={control}
          groups={fieldTypeGroups}
          placeholder="Select field type"
        />
      )}

      <div className="md:col-span-2">
        <TextField
          id="field-placeholder"
          name="placeholder"
          label="Placeholder Text"
          control={control}
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t pt-4 md:col-span-2 md:grid-cols-2">
        <BooleanField
          id="is-hidden"
          name="isHidden"
          label="Hide field from form UI"
          control={control}
          helperText="Field will not be shown, but its value (if any) is still used."
        />

        <BooleanField
          id="is-hardcoded"
          name="isHardcoded"
          label="Use hardcoded value"
          control={control}
          helperText="Provide a fixed value instead of user input."
        />
      </div>

      {isHardcoded && adapter && (
        <div className="space-y-4 border-t pt-4 md:col-span-2">
          {fieldType === 'runtimeSecret' && (
            <Banner variant="warning" title="Security Notice" dismissible={false}>
              This runtime secret will be hardcoded and included in your exported application.
              Ensure you understand the risks of exposing this value to your users.
            </Banner>
          )}
          <DynamicFormField
            key={`hardcoded-${field.id}-${fieldType}`}
            field={hardcodedFieldConfig}
            control={control}
            adapter={adapter}
          />
          <BooleanField
            id="is-read-only"
            name="readOnly"
            label="Display as read-only"
            control={control}
            helperText="If checked, the field shows the hardcoded value but cannot be edited by the end-user."
            readOnly={isHardcodedValueInvalid}
          />
        </div>
      )}
      {isHardcoded && !adapter && fieldType === 'blockchain-address' && (
        <div className="text-destructive border-t pt-4 text-sm md:col-span-2">
          Cannot edit hardcoded address value: Adapter not available.
        </div>
      )}
    </div>
  );
}
