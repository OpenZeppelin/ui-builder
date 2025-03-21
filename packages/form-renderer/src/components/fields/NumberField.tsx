import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';

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
 * - Number-specific validation (min, max, step)
 * - Custom validation support
 * - Type conversion and formatting
 * - Automatic error handling and reporting
 */
export const NumberField = forwardRef(function NumberField(
  { min, max, step, validateNumber, ...baseProps }: NumberFieldProps,
  ref: ForwardedRef<HTMLInputElement>
): ReactElement {
  const { setError, clearErrors } = useFormContext();

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <Input
          {...field}
          type="number"
          ref={ref}
          id={id}
          min={min}
          max={max}
          step={step}
          placeholder={baseProps.placeholder}
          data-slot="input"
          onChange={(e) => {
            const value = e.target.value === '' ? '' : Number(e.target.value);

            // Call the original onChange from React Hook Form
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Validate input with custom validation if provided
            if (validateNumber && value !== '' && !isNaN(value)) {
              const validation = validateNumber(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
              } else {
                clearErrors(baseProps.name);
              }
            }

            // Check min/max constraints
            if (value !== '' && !isNaN(value)) {
              if (min !== undefined && value < min) {
                setError(baseProps.name, {
                  type: 'min',
                  message: `Value must be at least ${min}`,
                });
              } else if (max !== undefined && value > max) {
                setError(baseProps.name, {
                  type: 'max',
                  message: `Value must be at most ${max}`,
                });
              } else {
                // Clear errors if validation passes
                clearErrors(baseProps.name);
              }
            }
          }}
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }
          }}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
NumberField.displayName = 'NumberField';
