import { type ForwardedRef, forwardRef, type ReactElement } from 'react';

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
}

/**
 * Number input field component specifically designed for React Hook Form integration.
 * This component is not meant to be used as a standalone input.
 * It requires the React Hook Form control and properly named field path.
 */
export const NumberField = forwardRef(function NumberField(
  { min, max, step, ...baseProps }: NumberFieldProps,
  ref: ForwardedRef<HTMLInputElement>
): ReactElement {
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
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }
          }}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
NumberField.displayName = 'NumberField';
