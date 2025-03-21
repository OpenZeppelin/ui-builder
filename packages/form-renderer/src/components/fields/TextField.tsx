import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';

/**
 * TextField component properties
 */
export interface TextFieldProps extends BaseFieldProps {
  /**
   * Minimum length validation
   */
  minLength?: number;

  /**
   * Maximum length validation
   */
  maxLength?: number;

  /**
   * Custom validation function for text values
   */
  validateText?: (value: string) => boolean | string;

  /**
   * Pattern for validation
   */
  pattern?: RegExp;

  /**
   * Message to show when pattern validation fails
   */
  patternMessage?: string;
}

/**
 * Text input field component specifically designed for React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like TextField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles text-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Text-specific validation (minLength, maxLength, pattern)
 * - Custom validation support
 * - Automatic error handling and reporting
 */
export const TextField = forwardRef(function TextField(
  { minLength, maxLength, validateText, pattern, patternMessage, ...baseProps }: TextFieldProps,
  ref: ForwardedRef<HTMLInputElement>
): ReactElement {
  const { setError, clearErrors } = useFormContext();

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <Input
          {...field}
          ref={ref}
          id={id}
          placeholder={baseProps.placeholder}
          minLength={minLength}
          maxLength={maxLength}
          data-slot="input"
          onChange={(e) => {
            const value = e.target.value;

            // Call the original onChange from React Hook Form
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Run custom validation if provided
            if (validateText && value) {
              const validation = validateText(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
                return; // Stop validation chain if custom validation fails
              }
            }

            // Check minLength constraint
            if (minLength && value.length < minLength) {
              setError(baseProps.name, {
                type: 'minLength',
                message: `Must be at least ${minLength} characters`,
              });
              return;
            }

            // Check maxLength constraint
            if (maxLength && value.length > maxLength) {
              setError(baseProps.name, {
                type: 'maxLength',
                message: `Cannot exceed ${maxLength} characters`,
              });
              return;
            }

            // Check pattern constraint
            if (pattern && !pattern.test(value) && value) {
              setError(baseProps.name, {
                type: 'pattern',
                message: patternMessage || 'Value does not match the required pattern',
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
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
TextField.displayName = 'TextField';
