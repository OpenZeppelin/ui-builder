import { deepEqual } from 'fast-equals';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';

import { FieldAdvancedSettings } from './FieldAdvancedSettings';
import { FieldBasicSettings } from './FieldBasicSettings';
import { FieldEditorFormValues } from './types';
import { TypeWarningSection } from './TypeWarningSection';
import { getFieldTypeGroups, initializeFormValues } from './utils';

interface FieldEditorProps {
  /**
   * The field being edited
   */
  field: FormFieldType;
  /**
   * Callback fired when field properties are updated
   */
  onUpdate: (updates: Partial<FormFieldType>) => void;
  /**
   * Chain-specific adapter for type validation and mapping
   */
  adapter?: ContractAdapter;
  /**
   * Original parameter type from the contract ABI for validation warnings
   */
  originalParameterType?: string;
}

/**
 * Component for editing form field properties with optimized updates.
 *
 * Features:
 * - Debounced updates for text inputs to reduce parent re-renders
 * - Immediate updates for critical changes (type, hardcoded state)
 * - Form state preservation during field switches
 * - Type validation warnings when field type differs from contract parameter
 *
 * @param props - Component props
 * @param props.field - The field configuration being edited
 * @param props.onUpdate - Callback to update field properties in parent state
 * @param props.adapter - Chain adapter for type validation and conversion
 * @param props.originalParameterType - Original contract parameter type for validation
 */
export const FieldEditor = React.memo(
  function FieldEditor({ field, onUpdate, adapter, originalParameterType }: FieldEditorProps) {
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

    const debouncedUpdate = useMemo(
      () =>
        debounce((updates: Partial<FormFieldType>) => {
          onUpdate(updates);
        }, 300),
      [onUpdate]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedUpdate.cancel();
      };
    }, [debouncedUpdate]);

    /**
     * Optimized update handler that debounces text inputs but immediately processes critical changes
     */
    const handleUpdate = useCallback(
      (updates: Partial<FormFieldType>) => {
        // For critical updates like type changes, update immediately
        if ('type' in updates || 'isHardcoded' in updates) {
          debouncedUpdate.cancel(); // Cancel any pending debounced updates
          onUpdate(updates);
          return;
        }

        // For other updates (text input, etc.), use debounced update
        debouncedUpdate(updates);
      },
      [onUpdate, debouncedUpdate]
    );

    /**
     * Helper function to check if field has meaningful changes (excluding hardcodedValue)
     */
    const hasFieldChangedExceptHardcodedValue = useCallback(
      (currentField: FormFieldType, previousField: FormFieldType): boolean => {
        // Check if field IDs are different (switching between different fields)
        if (currentField.id !== previousField.id) {
          return true;
        }

        // Check all properties except hardcodedValue for changes
        return Object.keys(currentField).some((key) => {
          if (key === 'hardcodedValue') return false;
          return (
            currentField[key as keyof FormFieldType] !== previousField[key as keyof FormFieldType]
          );
        });
      },
      []
    );

    // Reset form when field changes - use a deep reset to ensure all values are properly refreshed
    React.useEffect(() => {
      const previousField = previousFieldRef.current;

      // Only reset if there's a meaningful change
      if (hasFieldChangedExceptHardcodedValue(field, previousField)) {
        // Get current form values before reset
        const currentValues = getValues();
        const newValues = initializeFormValues(field);

        // Only preserve the current hardcodedValue if we're on the same field (not switching fields)
        // This prevents losing user input when the parent re-renders the same field
        const isSameField = field.id === previousField.id;
        if (isSameField && field.isHardcoded && currentValues.hardcodedValue !== undefined) {
          newValues.hardcodedValue = currentValues.hardcodedValue;
        }

        reset(newValues);
      }

      // Update the ref for next comparison
      previousFieldRef.current = field;
    }, [field, reset, getValues, hasFieldChangedExceptHardcodedValue]);

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
              handleUpdate({ hardcodedValue: currentValues.hardcodedValue });
            } else {
              handleUpdate({ validation: currentValues.validation });
            }
          } else {
            // For other fields, send the change with appropriate debouncing
            const change = { [name]: value[name] } as Partial<FormFieldType>;
            handleUpdate(change);
          }
        }
      });

      return () => subscription.unsubscribe();
    }, [watch, handleUpdate, getValues]);

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
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders on identical props
    return (
      prevProps.field.id === nextProps.field.id &&
      deepEqual(prevProps.field, nextProps.field) &&
      prevProps.adapter === nextProps.adapter &&
      prevProps.originalParameterType === nextProps.originalParameterType
    );
  }
);
