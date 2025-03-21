import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import { Checkbox } from '../ui';

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
 * - Boolean-specific validation
 * - Custom validation support
 * - Automatic error handling and reporting
 */
export const BooleanField = forwardRef(function BooleanField<
  TFieldValues extends FieldValues = FieldValues,
>(
  { validateBoolean, ...baseProps }: BooleanFieldProps<TFieldValues>,
  ref: ForwardedRef<HTMLButtonElement>
): ReactElement {
  const { setError, clearErrors } = useFormContext();

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            {...field}
            ref={ref}
            id={id}
            checked={Boolean(field.value)}
            onCheckedChange={(checked: boolean) => {
              // Call the original onChange from React Hook Form
              if (typeof field.onChange === 'function') {
                field.onChange(checked);
              }

              // Run custom validation if provided
              if (validateBoolean) {
                const validation = validateBoolean(Boolean(checked));
                if (validation !== true && typeof validation === 'string') {
                  setError(baseProps.name, {
                    type: 'custom',
                    message: validation,
                  });
                  return; // Stop validation chain if custom validation fails
                }
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
        </div>
      )}
    />
  );
});

// Set displayName manually for better debugging
BooleanField.displayName = 'BooleanField';
