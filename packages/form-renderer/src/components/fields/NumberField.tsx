import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';
import { getAccessibilityProps, handleEscapeKey, handleNumericKeys } from './utils/accessibility';

/**
 * NumberField component properties
 */
export interface NumberFieldProps extends BaseFieldProps {
  /**
   * Minimum value validation
   */
  min?: number;

  /**
   * Maximum value validation
   */
  max?: number;

  /**
   * Step value for increment/decrement
   */
  step?: number;

  /**
   * Custom validation function for number values
   */
  validateNumber?: (value: number) => boolean | string;
}

/**
 * Number input field component specifically designed for React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like NumberField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles number-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Numeric-specific validations (min, max, step)
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with arrow keys for numeric increment/decrement
 */
export const NumberField = forwardRef(function NumberField(
  { validateNumber, min, max, step = 1, ...baseProps }: NumberFieldProps,
  ref: ForwardedRef<HTMLInputElement>
): ReactElement {
  const { setError, clearErrors, formState } = useFormContext();
  const hasError = !!formState.errors[baseProps.name];

  // Determine if the field is required based on validation rules
  const isRequired = !!baseProps.validation?.required;

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <Input
          {...field}
          ref={ref}
          id={id}
          placeholder={baseProps.placeholder}
          type="number"
          min={min}
          max={max}
          step={step}
          data-slot="input"
          // Apply accessibility attributes
          {...getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!baseProps.helperText,
          })}
          onChange={(e) => {
            const rawValue = e.target.value;
            const value = rawValue ? parseFloat(rawValue) : null;

            // Call the original onChange from React Hook Form
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Skip validation if empty (unless required, which is handled by react-hook-form)
            if (rawValue === '') {
              clearErrors(baseProps.name);
              return;
            }

            // Run custom validation if provided
            if (validateNumber && value !== null) {
              const validation = validateNumber(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
                return; // Stop validation chain if custom validation fails
              }
            }

            // Validate min if provided
            if (typeof min === 'number' && value !== null && value < min) {
              setError(baseProps.name, {
                type: 'min',
                message: `Must be at least ${min}`,
              });
              return;
            }

            // Validate max if provided
            if (typeof max === 'number' && value !== null && value > max) {
              setError(baseProps.name, {
                type: 'max',
                message: `Cannot exceed ${max}`,
              });
              return;
            }

            // If we reach here, all validations passed
            clearErrors(baseProps.name);
          }}
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }
          }}
          // Add keyboard event handlers for accessibility
          onKeyDown={(e) => {
            // Handle Escape key to clear input
            if (e.key === 'Escape') {
              handleEscapeKey((value) => {
                if (typeof field.onChange === 'function') {
                  field.onChange(value === '' ? null : value);
                }
              }, field.value)(e);
              return;
            }

            // Handle arrow keys for increment/decrement
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              handleNumericKeys(
                (newValue) => {
                  if (typeof field.onChange === 'function') {
                    field.onChange(newValue);
                  }
                },
                typeof field.value === 'number' ? field.value : 0,
                step,
                min,
                max
              )(e);
            }
          }}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
NumberField.displayName = 'NumberField';
