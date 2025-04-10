import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { Label } from '../ui/label';

import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps } from './utils';

/**
 * Option item for radio fields
 */
export interface RadioOption {
  /**
   * Value to be submitted with the form
   */
  value: string;

  /**
   * Display label for the option
   */
  label: string;

  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
}

/**
 * RadioField component properties
 */
export interface RadioFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Available options for selection
   */
  options?: RadioOption[];

  /**
   * Direction of radio options layout
   */
  layout?: 'horizontal' | 'vertical';

  /**
   * Custom validation function for radio values
   */
  validateRadio?: (value: string) => boolean | string;
}

/**
 * Radio button field component specifically designed for React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles radio-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Customizable options list
 * - Horizontal or vertical layout options
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 */
export function RadioField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  options = [],
  layout = 'vertical',
  validateRadio,
}: RadioFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const radioGroupId = `${id}-group`;

  return (
    <div
      className={`flex flex-col gap-2 ${width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3'}`}
    >
      {label && (
        <Label htmlFor={radioGroupId}>
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        rules={{
          validate: (value) => {
            // Handle required validation explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Run custom validation if provided
            if (validateRadio && value) {
              const validation = validateRadio(value);
              if (validation !== true && typeof validation === 'string') {
                return validation;
              }
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;

          // Group accessibility attributes
          const groupAccessibilityProps = getAccessibilityProps({
            id: radioGroupId,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          return (
            <>
              <div
                id={radioGroupId}
                role="radiogroup"
                className={`flex ${layout === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4'}`}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                {...groupAccessibilityProps}
              >
                {options.map((option, index) => {
                  const optionId = `${id}-option-${index}`;
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={optionId}
                        value={option.value}
                        disabled={option.disabled}
                        checked={field.value === option.value}
                        onChange={() => field.onChange(option.value)}
                        className={`text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded-full border-gray-300 focus:ring-2 ${hasError ? 'border-destructive' : ''}`}
                      />
                      <Label htmlFor={optionId} className="cursor-pointer text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId} className="text-muted-foreground text-sm">
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              <ErrorMessage error={error} id={errorId} />
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
RadioField.displayName = 'RadioField';
