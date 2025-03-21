import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

import { BaseFieldProps } from './BaseField';
import {
  ErrorMessage,
  getAccessibilityProps,
  getValidationStateClasses,
  handleToggleKeys,
  validateField,
} from './utils';

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
 * - Checkbox-specific behavior
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with Space/Enter for toggling
 */
export function BooleanField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  validateBoolean,
}: BooleanFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Function to validate boolean values
  const validateBooleanValue = (value: boolean): string | true => {
    // Run standard validation first
    const standardValidation = validateField(value, validation);
    if (standardValidation !== true) return standardValidation as string;

    // Then run custom validator if provided
    if (validateBoolean) {
      const customValidation = validateBoolean(value);
      if (customValidation !== true && typeof customValidation === 'string') {
        return customValidation;
      }
    }

    return true;
  };

  return (
    <div
      className={`flex flex-col gap-2 ${width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3'}`}
    >
      <Controller
        control={control}
        name={name}
        rules={{
          validate: (value) => {
            // Handle required validation specifically
            if (value === undefined || value === null) {
              return validation?.required ? 'This field is required' : true;
            }

            // For boolean values
            if (typeof value === 'boolean') {
              // If required and false, return error
              if (validation?.required && value === false) {
                return 'This field is required';
              }

              return validateBooleanValue(value);
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;
          const validationClasses = getValidationStateClasses(error);

          // Handle checkbox change with validation
          const handleCheckedChange = (checked: boolean | 'indeterminate'): void => {
            const value = checked === true;
            field.onChange(value);

            // Trigger validation if required and unchecked
            if (isRequired && !value) {
              setTimeout(() => field.onBlur(), 0);
            }
          };

          // Add keyboard accessibility for toggle
          const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
            handleToggleKeys(field.onChange, !!field.value)(e);

            // Trigger validation for required fields
            if (e.key === ' ' || e.key === 'Enter') {
              if (isRequired) {
                setTimeout(() => field.onBlur(), 0);
              }
            }
          };

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          return (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...field}
                  id={id}
                  checked={!!field.value}
                  onCheckedChange={handleCheckedChange}
                  className={validationClasses}
                  onKeyDown={handleKeyDown}
                  {...accessibilityProps}
                  aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                />
                <Label htmlFor={id} className="text-sm font-medium">
                  {label} {isRequired && <span className="text-destructive">*</span>}
                </Label>
              </div>

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId} className="text-muted-foreground pl-6 text-sm">
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              <ErrorMessage error={error} id={errorId} className="pl-6" />
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
BooleanField.displayName = 'BooleanField';
