import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';

import { Checkbox } from '../ui';

import { getAccessibilityProps, handleToggleKeys } from './utils/accessibility';
import { BaseField, type BaseFieldProps } from './BaseField';

/**
 * BooleanField component properties
 */
export interface BooleanFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Custom validation function for boolean values
   */
  validateBoolean?: (value: boolean) => boolean | string;
}

/**
 * Boolean input field component (checkbox) specifically designed for React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like BooleanField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles boolean-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Checkbox-specific behavior
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with Space/Enter for toggling
 */
export const BooleanField = forwardRef(function BooleanField<
  TFieldValues extends FieldValues = FieldValues,
>(
  { validateBoolean, ...baseProps }: BooleanFieldProps<TFieldValues>,
  ref: ForwardedRef<HTMLButtonElement>
): ReactElement {
  const { setError, clearErrors, formState } = useFormContext();
  const hasError = !!formState.errors[baseProps.name];

  // Determine if the field is required based on validation rules
  const isRequired = !!baseProps.validation?.required;

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <Checkbox
          {...field}
          id={id}
          ref={ref}
          checked={!!field.value}
          // Apply accessibility attributes
          {...getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!baseProps.helperText,
          })}
          onCheckedChange={(checked) => {
            const value = checked === true;

            // Call the original onChange from React Hook Form
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Run custom validation if provided
            if (validateBoolean) {
              const validation = validateBoolean(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
              } else {
                clearErrors(baseProps.name);
              }
            }
          }}
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }
          }}
          // Add keyboard event handling for accessibility
          onKeyDown={handleToggleKeys((value) => {
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Run validation on toggle
            if (validateBoolean) {
              const validation = validateBoolean(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
              } else {
                clearErrors(baseProps.name);
              }
            }
          }, !!field.value)}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
BooleanField.displayName = 'BooleanField';
