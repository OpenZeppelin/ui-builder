import { deepEqual } from 'fast-equals';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/ui-builder-types';
import { FieldType, FormFieldType } from '@openzeppelin/ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/ui-builder-utils';

import { coerceHardcodedValue } from './utils/fieldEditorUtils';

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
   * Original parameter type from the contract schema for validation warnings
   */
  originalParameterType?: string;
  /**
   * Callback fired when field validation status changes
   */
  onFieldValidationChange?: (fieldId: string, hasError: boolean) => void;
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
  function FieldEditor({
    field,
    onUpdate,
    adapter,
    originalParameterType,
    onFieldValidationChange,
  }: FieldEditorProps) {
    // Create default values with proper initialization to avoid uncontrolled/controlled warnings
    const defaultValues = useMemo(() => initializeFormValues(field), [field]);

    // Initialize form with field values
    const formMethods = useForm<FieldEditorFormValues>({
      defaultValues,
      mode: 'onChange',
    });
    const { control, watch, reset, getValues, trigger, setValue } = formMethods;

    // Get field type groups using utility function
    const typeGroups = useMemo(
      () => getFieldTypeGroups(adapter, originalParameterType),
      [adapter, originalParameterType]
    );

    // Track previous field to detect meaningful changes
    const previousFieldRef = React.useRef(field);
    const previousHardcodedRef = React.useRef<unknown>(field.hardcodedValue);

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
     * Handles field type changes with hardcoded value coercion
     */
    const handleTypeChange = useCallback(
      (newType: FieldType) => {
        const currentValues = getValues();
        const snapshot: FormFieldType = { ...field, type: newType };
        const currentHardcoded =
          currentValues.hardcodedValue !== undefined
            ? currentValues.hardcodedValue
            : field.hardcodedValue;
        const isHardcodedNow =
          currentValues.isHardcoded !== undefined ? currentValues.isHardcoded : field.isHardcoded;

        if (isHardcodedNow || currentHardcoded !== undefined) {
          const coerced = coerceHardcodedValue(snapshot, currentHardcoded);
          setValue('hardcodedValue', coerced, { shouldValidate: false });
          onUpdate({ type: newType, hardcodedValue: coerced });
          const isRequired = currentValues.validation?.required || field.validation?.required;
          if (isRequired) {
            setTimeout(() => {
              trigger('hardcodedValue').catch(() => {});
            }, 0);
          }
        } else {
          onUpdate({ type: newType });
        }
      },
      [getValues, field, setValue, onUpdate, trigger]
    );

    /**
     * Handles isHardcoded toggle with proper initialization and validation
     */
    const handleHardcodedToggle = useCallback(
      (isHardcoded: boolean) => {
        const currentValues = getValues();
        const isRequired = currentValues.validation?.required || field.validation?.required;

        // When enabling hardcoded mode with no existing value, initialize a sensible default
        if (
          isHardcoded === true &&
          (currentValues.hardcodedValue === undefined ||
            typeof currentValues.hardcodedValue === 'object')
        ) {
          const currentType = (currentValues.type || field.type) as FieldType;
          const defaultHardcoded = getDefaultValueForType(currentType);
          setValue('hardcodedValue', defaultHardcoded, {
            shouldValidate: false,
          });

          // Persist both flags immediately so preview reflects the change
          onUpdate({ isHardcoded: true, hardcodedValue: defaultHardcoded });
          // For required fields, trigger validation as before
          if (isRequired) {
            setTimeout(() => {
              trigger('hardcodedValue').catch(() => {
                // Silently handle trigger errors to avoid breaking the flow
              });
            }, 0);
          }
          return;
        }

        // If toggling hardcoded on a required field, or toggling off any hardcoded field,
        // trigger validation immediately to update validation state
        if ((isHardcoded === true && isRequired) || isHardcoded === false) {
          // Update first, then trigger validation
          onUpdate({ isHardcoded });
          // Use setTimeout to ensure the update has been processed
          setTimeout(() => {
            trigger('hardcodedValue').catch(() => {
              // Silently handle trigger errors to avoid breaking the flow
            });
          }, 0);
          return;
        }

        onUpdate({ isHardcoded });
      },
      [getValues, field, setValue, onUpdate, trigger]
    );

    /**
     * Handles hardcoded value changes
     */
    const handleHardcodedValueChange = useCallback(
      (hardcodedValue: unknown) => {
        onUpdate({ hardcodedValue });
      },
      [onUpdate]
    );

    /**
     * Optimized update handler that dispatches to specific handlers or uses debounced updates
     */
    const handleUpdate = useCallback(
      (updates: Partial<FormFieldType>) => {
        // For critical updates, cancel any pending debounced updates and handle immediately
        if ('type' in updates || 'isHardcoded' in updates || 'hardcodedValue' in updates) {
          debouncedUpdate.cancel();

          if ('type' in updates) {
            handleTypeChange(updates.type as FieldType);
            return;
          }

          if ('isHardcoded' in updates) {
            handleHardcodedToggle(updates.isHardcoded as boolean);
            return;
          }

          if ('hardcodedValue' in updates) {
            handleHardcodedValueChange(updates.hardcodedValue);
            return;
          }
        }

        // For other updates (text input, etc.), use debounced update
        debouncedUpdate(updates);
      },
      [debouncedUpdate, handleTypeChange, handleHardcodedToggle, handleHardcodedValueChange]
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

        // Preserve the current hardcodedValue in different scenarios
        const isSameField = field.id === previousField.id;

        if (isSameField && field.isHardcoded && currentValues.hardcodedValue !== undefined) {
          // Same field re-render: preserve current form input to avoid losing user data
          newValues.hardcodedValue = currentValues.hardcodedValue;
        } else if (
          !isSameField &&
          field.isHardcoded &&
          field.hardcodedValue === undefined &&
          newValues.hardcodedValue === undefined
        ) {
          // Switching to a different hardcoded field that has no stored value AND no default:
          // Don't initialize with defaults to preserve validation state.
          // The field might have been invalid when we switched away from it.
          // Note: if initializeFormValues already set a default value, preserve it
          newValues.hardcodedValue = undefined;
        }

        reset(newValues);

        // If we're switching to a hardcoded field with no value that should be required,
        // trigger validation to ensure error state is shown immediately
        if (
          !isSameField &&
          field.isHardcoded &&
          field.hardcodedValue === undefined &&
          (field.validation?.required || newValues.validation?.required)
        ) {
          // Use setTimeout to ensure reset has completed before triggering validation
          setTimeout(() => {
            trigger('hardcodedValue').catch(() => {
              // Silently handle validation trigger errors
            });
          }, 0);
        }

        // Only update the snapshot when staying on the same field to avoid cross-field contamination
        // For different fields, the watch subscription will establish its own baseline
        if (isSameField) {
          previousHardcodedRef.current = newValues.hardcodedValue;
        } else {
          // When switching to a new field, reset the snapshot to the field's actual hardcoded value
          previousHardcodedRef.current = field.hardcodedValue;
        }
      }

      // Update the ref for next comparison
      previousFieldRef.current = field;
    }, [field, reset, getValues, hasFieldChangedExceptHardcodedValue, trigger]);

    // Watch for changes and update fields
    React.useEffect(() => {
      const subscription = watch((value, { name, type: eventType }) => {
        if (name && value) {
          // Skip if type is undefined
          if (name === 'type' && value[name as keyof typeof value] === undefined) {
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
              const currentHardcoded = currentValues.hardcodedValue;
              const valuesEqual = deepEqual(previousHardcodedRef.current, currentHardcoded);

              // For structural changes from useFieldArray (eventType === undefined), only skip
              // if the value truly hasn't changed. Otherwise, process and update the snapshot.
              if (eventType === undefined && valuesEqual) {
                return;
              }

              previousHardcodedRef.current = currentHardcoded;
              handleUpdate({ hardcodedValue: currentValues.hardcodedValue });
            } else {
              handleUpdate({ validation: currentValues.validation });
            }
          } else {
            // For other fields, send the change with appropriate debouncing
            const change = { [name]: value[name as keyof typeof value] } as Partial<FormFieldType>;
            handleUpdate(change);
          }
        }
      });

      return () => subscription.unsubscribe();
    }, [watch, handleUpdate, getValues]);

    // Get the current type value with a fallback to the field's original type to avoid undefined
    const selectedType = (watch('type') || field.type) as FieldType;

    return (
      <div className="space-y-6">
        <FieldBasicSettings
          control={control}
          fieldTypeGroups={typeGroups}
          adapter={adapter}
          field={field}
          onFieldValidationChange={onFieldValidationChange}
          trigger={trigger}
        />

        <TypeWarningSection
          selectedType={selectedType}
          adapter={adapter}
          originalParameterType={originalParameterType}
        />

        <FieldAdvancedSettings control={control} fieldType={selectedType} />
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
