import { type ForwardedRef, forwardRef, type ReactElement } from 'react';

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
}

/**
 * Text input field component specifically designed for React Hook Form integration.
 * This component is not meant to be used as a standalone input.
 * It requires the React Hook Form control and properly named field path.
 */
export const TextField = forwardRef(function TextField(
  { minLength, maxLength, ...baseProps }: TextFieldProps,
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
          placeholder={baseProps.placeholder}
          minLength={minLength}
          maxLength={maxLength}
          data-slot="input"
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
TextField.displayName = 'TextField';
