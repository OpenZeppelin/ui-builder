import { type ForwardedRef, forwardRef, type ReactElement } from 'react';

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
                // Handle validation error
                console.error(validation);
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
