import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';
import { getAccessibilityProps, handleEscapeKey } from './utils/accessibility';

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
 * - Text-specific validations (minLength, maxLength, pattern)
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export const TextField = forwardRef(function TextField(
  { validateText, minLength, maxLength, pattern, patternMessage, ...baseProps }: TextFieldProps,
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
          data-slot="input"
          // Apply accessibility attributes
          {...getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!baseProps.helperText,
          })}
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

            // Validate minLength if provided
            if (minLength && value && value.length < minLength) {
              setError(baseProps.name, {
                type: 'minLength',
                message: `Must be at least ${minLength} characters`,
              });
              return;
            }

            // Validate maxLength if provided
            if (maxLength && value && value.length > maxLength) {
              setError(baseProps.name, {
                type: 'maxLength',
                message: `Cannot exceed ${maxLength} characters`,
              });
              return;
            }

            // Validate pattern if provided
            if (pattern && value && !pattern.test(value)) {
              setError(baseProps.name, {
                type: 'pattern',
                message: patternMessage || 'Invalid format',
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
          // Add keyboard event handling for accessibility
          onKeyDown={handleEscapeKey((value) => {
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }
          }, field.value)}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
TextField.displayName = 'TextField';
