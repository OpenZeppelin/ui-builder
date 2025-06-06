import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';
import { FormFieldType } from '@openzeppelin/transaction-form-types';

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

  // Track previous field to detect meaningful changes
  const previousFieldRef = React.useRef(field);

  // Helper function to check if field has meaningful changes
  const hasFieldChangedExceptHardcodedValue = (
    currentField: FormFieldType,
    previousField: FormFieldType
  ): boolean => {
    return Object.keys(currentField).some((key) => {
      if (key === 'hardcodedValue') return false;
      return currentField[key as keyof FormFieldType] !== previousField[key as keyof FormFieldType];
    });
  };

  // Reset form when field changes - use a deep reset to ensure all values are properly refreshed
  React.useEffect(() => {
    const previousField = previousFieldRef.current;

    // Only reset if there's a meaningful change
    if (hasFieldChangedExceptHardcodedValue(field, previousField)) {
      // Get current form values before reset
      const currentValues = getValues();
      const newValues = initializeFormValues(field);

      // Preserve the current hardcodedValue if we're actively editing it
      // This prevents losing user input when the parent re-renders
      if (field.isHardcoded && currentValues.hardcodedValue !== undefined) {
        newValues.hardcodedValue = currentValues.hardcodedValue;
      }

      reset(newValues);
    }

    // Update the ref for next comparison
    previousFieldRef.current = field;
  }, [field, reset, getValues]);

  // Watch for changes and update fields
  React.useEffect(() => {
    const subscription = watch((value, { name, type: eventType }) => {
      // Skip updates if we're just seeing validation changes for hardcodedValue
      if (name === 'hardcodedValue' && eventType === undefined) {
        return;
      }

      if (name && value) {
        // Skip if type is undefined
        if (name === 'type' && value[name] === undefined) {
          return;
        }

        // Handle special cases that need full form values
        if (
          name === 'hardcodedValue' ||
          name?.startsWith('hardcodedValue.') ||
          name === 'validation.required'
        ) {
          const currentValues = getValues();

          if (name === 'hardcodedValue' || name?.startsWith('hardcodedValue.')) {
            onUpdate({ hardcodedValue: currentValues.hardcodedValue });
          } else {
            onUpdate({ validation: currentValues.validation });
          }
        } else {
          // For other fields, send the simple change immediately
          const change = { [name]: value[name] } as Partial<FormFieldType>;
          onUpdate(change);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, onUpdate, getValues]);

  // Get the current type value with a fallback to the field's original type to avoid undefined
  const selectedType = watch('type') || field.type;

  return (
    <div className="space-y-6">
      <FieldBasicSettings
        control={control}
        fieldTypeGroups={typeGroups}
        adapter={adapter}
        field={field}
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
