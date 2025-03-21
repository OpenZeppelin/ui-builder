import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../ui';

import { BaseField, type BaseFieldProps } from './BaseField';

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
 * Address input field component specifically designed for blockchain addresses.
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
 */
export const AddressField = forwardRef(function AddressField(
  { validateAddress, ...baseProps }: AddressFieldProps,
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
          placeholder={baseProps.placeholder || '0x...'}
          data-slot="input"
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }

            if (validateAddress && typeof field.value === 'string') {
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
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
AddressField.displayName = 'AddressField';
