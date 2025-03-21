import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';
import { getAccessibilityProps, handleEscapeKey } from './utils/accessibility';

/**
 * AddressField component properties
 */
export interface AddressFieldProps extends BaseFieldProps {
  /**
   * Custom validation function for address format
   */
  validateAddress?: (address: string) => boolean | string;
}

/**
 * Address input field component specifically designed for blockchain addresses via React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like AddressField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles blockchain address-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Blockchain address validation
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Chain-agnostic design (validation handled by adapters)
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export const AddressField = forwardRef(function AddressField(
  { validateAddress, ...baseProps }: AddressFieldProps,
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
          placeholder={baseProps.placeholder || '0x...'}
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

            // Perform real-time validation for address format
            if (validateAddress && value) {
              const validation = validateAddress(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
              } else {
                clearErrors(baseProps.name);
              }
            } else {
              clearErrors(baseProps.name);
            }
          }}
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }

            // Final validation on blur
            if (validateAddress && typeof field.value === 'string' && field.value) {
              const validation = validateAddress(field.value);
              if (validation !== true && typeof validation === 'string') {
                // Set the error in React Hook Form
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
              } else {
                // Clear previous validation errors if now valid
                clearErrors(baseProps.name);
              }
            }
          }}
          // Add keyboard event handling for accessibility
          onKeyDown={handleEscapeKey((value) => {
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }
            clearErrors(baseProps.name);
          }, field.value)}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
AddressField.displayName = 'AddressField';
