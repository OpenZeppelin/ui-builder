import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { BaseFieldProps } from './BaseField';

/**
 * Option item for select fields
 */
export interface SelectOption {
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
 * SelectField component properties
 */
export interface SelectFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Available options for selection
   */
  options?: SelectOption[];

  /**
   * Custom validation function for select values
   */
  validateSelect?: (value: string) => boolean | string;
}

/**
 * Select dropdown field component specifically designed for React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 */
export function SelectField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder = 'Select an option',
  helperText,
  control,
  name,
  width = 'full',
  validation,
  options = [],
  validateSelect,
}: SelectFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        width === 'full' ? 'w-full' : width === 'half' ? 'w-full md:w-1/2' : 'w-full md:w-1/3'
      )}
    >
      {label && (
        <Label htmlFor={id}>
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
            if (validateSelect && value) {
              const validation = validateSelect(value);
              if (validation !== true && typeof validation === 'string') {
                return validation;
              }
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;

          // Get accessibility attributes
          const accessibilityAttrs = {
            'aria-invalid': hasError,
            'aria-required': isRequired,
            'aria-describedby':
              `${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`.trim(),
          };

          return (
            <>
              <Select
                defaultValue={field.value}
                onValueChange={field.onChange}
                {...field}
                value={field.value}
              >
                <SelectTrigger id={id} {...accessibilityAttrs}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId} data-slot="form-description">
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              {error && (
                <div id={errorId} data-slot="form-message">
                  {error.message}
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
SelectField.displayName = 'SelectField';
