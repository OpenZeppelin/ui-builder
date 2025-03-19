import React from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';

import { FieldCondition, FieldType, FormField, FormValues } from '../types/FormTypes';

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
 * Props for field components, derived from FormField
 */
type FieldComponentProps = Pick<
  FormField,
  'id' | 'label' | 'placeholder' | 'helperText' | 'options' | 'width'
> & {
  /**
   * Current field value
   */
  value: unknown;

  /**
   * Callback when value changes
   */
  onChange: (value: unknown) => void;

  /**
   * Callback when field loses focus
   */
  onBlur?: () => void;

  /**
   * React ref for DOM access
   */
  ref?: React.Ref<unknown>;

  /**
   * Error message to display
   */
  error?: string;
};

/**
 * Registry of field components by type
 */
const fieldComponents: Partial<Record<FieldType, React.ComponentType<FieldComponentProps>>> = {
  text: TextField as React.ComponentType<FieldComponentProps>,
  // Add other field components as they are implemented
};

/**
 * Dynamic Form Field Component
 *
 * Renders the appropriate form field based on the field type
 * @returns The rendered form field component or null if not visible
 */
export function DynamicFormField({
  field,
  control,
  error,
}: DynamicFormFieldProps): React.ReactElement | null {
  // Check if the field should be rendered based on visibility conditions
  const shouldRender = useShouldRenderField(field, control);
  if (!shouldRender) {
    return null;
  }

  // Get the component for this field type
  const FieldComponent = fieldComponents[field.type];

  // If no component is registered for this type, render nothing
  if (!FieldComponent) {
    console.warn(`No component registered for field type: ${field.type}`);
    return null;
  }

  // Input transform for displaying values
  const transformValue = field.transforms?.input;

  return (
    <Controller
      name={field.id}
      control={control}
      defaultValue={field.defaultValue}
      rules={{
        required: field.validation.required ? 'This field is required' : false,
        min:
          field.validation.min !== undefined
            ? {
                value: field.validation.min,
                message: `Minimum value is ${field.validation.min}`,
              }
            : undefined,
        max:
          field.validation.max !== undefined
            ? {
                value: field.validation.max,
                message: `Maximum value is ${field.validation.max}`,
              }
            : undefined,
        minLength:
          field.validation.minLength !== undefined
            ? {
                value: field.validation.minLength,
                message: `Minimum length is ${field.validation.minLength}`,
              }
            : undefined,
        maxLength:
          field.validation.maxLength !== undefined
            ? {
                value: field.validation.maxLength,
                message: `Maximum length is ${field.validation.maxLength}`,
              }
            : undefined,
        pattern: field.validation.pattern
          ? {
              value:
                field.validation.pattern instanceof RegExp
                  ? field.validation.pattern
                  : new RegExp(field.validation.pattern),
              message: 'Invalid format',
            }
          : undefined,
      }}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <FieldComponent
          id={field.id}
          label={field.label}
          value={transformValue ? transformValue(value) : value}
          onChange={(newValue: unknown) => onChange(newValue)}
          onBlur={onBlur}
          ref={ref}
          placeholder={field.placeholder}
          helperText={field.helperText}
          error={error}
          options={field.options}
          width={field.width}
        />
      )}
    />
  );
}
