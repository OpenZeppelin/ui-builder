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
        <Label htmlFor={radioGroupId} className="text-sm font-medium">
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
                className={`flex ${layout === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-4'}`}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                {...groupAccessibilityProps}
              >
                {options.map((option, index) => {
                  const optionId = `${id}-option-${index}`;
                  const isSelected = field.value === option.value;
                  const isDisabled = option.disabled;

                  return (
                    <label
                      key={option.value}
                      htmlFor={optionId}
                      className={`group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 ${
                        isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50'
                      } ${isSelected && !hasError ? 'bg-primary/5' : ''}`}
                    >
                      <input
                        type="radio"
                        id={optionId}
                        value={option.value}
                        disabled={isDisabled}
                        checked={isSelected}
                        onChange={() => field.onChange(option.value)}
                        className="sr-only"
                        aria-describedby={hasError ? errorId : undefined}
                      />

                      {/* Custom Radio Button */}
                      <div className="relative flex size-4 items-center justify-center">
                        <div
                          className={`absolute size-4 rounded-full border-2 transition-all duration-150 ${
                            isSelected
                              ? hasError
                                ? 'border-destructive bg-destructive/10'
                                : 'border-primary bg-primary/10'
                              : hasError
                                ? 'border-destructive/50'
                                : 'border-muted-foreground/40 group-hover:border-muted-foreground/60'
                          } ${!isDisabled && 'group-hover:scale-105'}`}
                        />

                        {/* Inner dot for selected state */}
                        <div
                          className={`absolute size-1.5 rounded-full transition-all duration-150 ${
                            isSelected
                              ? hasError
                                ? 'bg-destructive scale-100 opacity-100'
                                : 'bg-primary scale-100 opacity-100'
                              : 'scale-0 opacity-0'
                          }`}
                        />
                      </div>

                      {/* Label text */}
                      <span
                        className={`text-sm transition-colors duration-150 ${
                          isDisabled
                            ? 'text-muted-foreground'
                            : isSelected
                              ? hasError
                                ? 'text-destructive font-medium'
                                : 'text-foreground font-medium'
                              : 'text-foreground'
                        }`}
                      >
                        {option.label}
                      </span>

                      {/* Focus ring */}
                      <div
                        className={`absolute -inset-1 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-opacity duration-150 ${
                          isSelected && !isDisabled
                            ? 'opacity-0 focus-within:opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                    </label>
                  );
                })}
              </div>

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId} className="text-sm text-muted-foreground">
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
