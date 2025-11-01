import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { cn } from '@openzeppelin/ui-builder-utils';

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

  /**
   * Optional default value used when the field has no value yet
   */
  defaultValue?: string;
}

/**
 * Select dropdown field component specifically designed for React Hook Form integration.
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
  defaultValue,
}: SelectFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Determine width values
  const widthPercentage = width === 'full' ? '100%' : width === 'half' ? '50%' : '33.333%';
  const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3';

  return (
    <div className={cn('flex flex-col gap-2', widthClass)} style={{ width: widthPercentage }}>
      {label && (
        <Label htmlFor={id}>
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue as unknown as undefined}
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

          // Ensure we properly handle the onValueChange event
          const handleValueChange = (newValue: string): void => {
            field.onChange(newValue);
          };

          return (
            <>
              <Select
                defaultValue={field.value}
                onValueChange={handleValueChange}
                value={field.value}
              >
                <SelectTrigger id={id} {...accessibilityAttrs}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                  // Ensure dropdown width matches trigger width
                  style={{
                    width: 'var(--radix-select-trigger-width)',
                    maxWidth: 'var(--radix-select-trigger-width)',
                  }}
                >
                  {options.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No options available
                    </div>
                  ) : (
                    options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))
                  )}
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
