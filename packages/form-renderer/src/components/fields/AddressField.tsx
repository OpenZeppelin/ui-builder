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
 * This component is not meant to be used as a standalone input.
 * It requires the React Hook Form control and properly named field path.
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
          onBlur={(e) => {
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
