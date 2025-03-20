import React from 'react';
import { Control, useWatch } from 'react-hook-form';

import { FieldCondition, FormField, FormValues } from '../types/FormTypes';

import { TextField } from './fields';

/**
 * Props for the DynamicFormField component
 */
interface DynamicFormFieldProps {
  /**
   * The field configuration to render
   */
  field: FormField;

  /**
   * The React Hook Form control
   */
  control: Control<FormValues>;

  /**
   * The field error message, if any
   */
  error?: string;
}

/**
 * Evaluates whether a field should be rendered based on its visibility conditions
 */
function useShouldRenderField(field: FormField, control: Control<FormValues>): boolean {
  // Use React Hook Form's useWatch to get the values of form fields
  // This will reactively update when form values change
  const formValues = useWatch({ control });

  // If there are no visible conditions, always render
  if (!field.visibleWhen) {
    return true;
  }

  // Convert single condition to array for consistent processing
  const conditions: FieldCondition[] = Array.isArray(field.visibleWhen)
    ? field.visibleWhen
    : [field.visibleWhen];

  // Check if all conditions are met
  return conditions.every((condition) => {
    const dependentValue = formValues[condition.field];

    switch (condition.operator) {
      case 'equals':
        return dependentValue === condition.value;
      case 'notEquals':
        return dependentValue !== condition.value;
      case 'contains':
        return String(dependentValue).includes(String(condition.value || ''));
      case 'greaterThan':
        return Number(dependentValue) > Number(condition.value || 0);
      case 'lessThan':
        return Number(dependentValue) < Number(condition.value || 0);
      case 'matches':
        if (typeof condition.value === 'string') {
          const regex = new RegExp(condition.value);
          return regex.test(String(dependentValue || ''));
        }
        return false;
      default:
        return true;
    }
  });
}

/**
 * Dynamic Form Field Component
 *
 * Renders the appropriate form field based on the field type
 * @returns The rendered form field component or null if not visible
 */
export function DynamicFormField({
  field,
  control,
}: DynamicFormFieldProps): React.ReactElement | null {
  // Check if the field should be rendered based on visibility conditions
  const shouldRender = useShouldRenderField(field, control);
  if (!shouldRender) {
    return null;
  }

  // For now, we only support text fields
  // Add more field types as needed
  switch (field.type) {
    case 'text':
      return (
        <TextField
          id={field.id}
          label={field.label}
          placeholder={field.placeholder}
          helperText={field.helperText}
          width={field.width}
          control={control}
          name={field.name}
        />
      );
    default:
      console.warn(`No component registered for field type: ${field.type}`);
      return null;
  }
}
