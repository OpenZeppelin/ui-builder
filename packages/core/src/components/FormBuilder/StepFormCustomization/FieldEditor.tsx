import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { ContractAdapter, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { getFieldTypeGroups } from './utils/fieldTypeUtils';

import { FieldAdvancedSettings } from './FieldAdvancedSettings';
import { FieldBasicSettings } from './FieldBasicSettings';
import { TypeWarningSection } from './TypeWarningSection';
import { FieldEditorFormValues } from './types';
import { initializeFormValues } from './utils';

interface FieldEditorProps {
  field: FormFieldType;
  onUpdate: (updatedField: Partial<FormFieldType>) => void;
  adapter?: ContractAdapter;
  originalParameterType?: string;
}

/**
 * Component for editing form field properties
 */
export function FieldEditor({ field, onUpdate, adapter, originalParameterType }: FieldEditorProps) {
  // Create default values with proper initialization to avoid uncontrolled/controlled warnings
  const defaultValues = useMemo(() => initializeFormValues(field), [field]);

  // Initialize form with field values
  const { control, watch, reset, getValues } = useForm<FieldEditorFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  // Get field type groups using utility function
  const typeGroups = useMemo(
    () => getFieldTypeGroups(adapter, originalParameterType),
    [adapter, originalParameterType]
  );

  // Reset form when field changes - use a deep reset to ensure all values are properly refreshed
  React.useEffect(() => {
    const newValues = initializeFormValues(field);
    reset(newValues);
  }, [field, reset]);

  // Watch for changes and update fields
  React.useEffect(() => {
    const subscription = watch((value, { name, type: eventType }) => {
      // Skip updates if we're just seeing validation changes for hardcodedValue
      // This prevents wiping out error state when validation happens
      if (name === 'hardcodedValue' && eventType === undefined) {
        return; // Do nothing when validation updates come through
      }

      if (name && value) {
        // Defensive handling for fields that should never be undefined
        if (name === 'type' && value[name] === undefined) {
          return; // Don't update if type is somehow undefined
        }

        // Special handling for nested validation updates
        if (name === 'validation.required') {
          // Get current validation state and send upwards
          const currentValues = getValues();
          onUpdate({ validation: currentValues.validation });
        } else {
          // For other fields, send the simple change
          const change = { [name]: value[name] } as Partial<FormFieldType>;
          onUpdate(change);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, onUpdate, field.validation, getValues]);

  // Field width options
  const widthOptions = [
    { value: 'full', label: 'Full Width' },
    { value: 'half', label: 'Half Width' },
    { value: 'third', label: 'One Third' },
  ];

  // Get the current type value with a fallback to the field's original type to avoid undefined
  const selectedType = watch('type') || field.type;

  return (
    <div className="space-y-6">
      <FieldBasicSettings
        control={control}
        fieldTypeGroups={typeGroups}
        fieldWidthOptions={widthOptions}
        adapter={adapter}
      />

      <TypeWarningSection
        selectedType={selectedType}
        adapter={adapter}
        originalParameterType={originalParameterType}
      />

      <FieldAdvancedSettings control={control} />
    </div>
  );
}
