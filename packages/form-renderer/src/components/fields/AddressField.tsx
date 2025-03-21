import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { BaseFieldProps } from './BaseField';
import {
  ErrorMessage,
  getAccessibilityProps,
  getValidationStateClasses,
  handleEscapeKey,
  validateField,
} from './utils';

/**
 * AddressField component properties
 */
export interface AddressFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Custom validation function for address format
   */
  validateAddress?: (address: string) => boolean | string;
}

/**
 * Address input field component specifically designed for blockchain addresses via React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like AddressField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles blockchain address-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Blockchain address validation
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Chain-agnostic design (validation handled by adapters)
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export function AddressField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  validateAddress,
}: AddressFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Function to validate address values
  const validateAddressValue = (value: string): string | true => {
    // Run standard validation first
    const standardValidation = validateField(value, validation);
    if (standardValidation !== true) return standardValidation as string;

    // Then run custom validator if provided
    if (validateAddress) {
      const customValidation = validateAddress(value);
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
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        rules={{
          validate: (value) => {
            // Check required field explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Validate string values
            if (typeof value === 'string') {
              return validateAddressValue(value);
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;
          const validationClasses = getValidationStateClasses(error);

          // Handle input change with validation
          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const value = e.target.value;
            field.onChange(value);

            // Trigger validation if the field is required and empty
            if (isRequired && value === '') {
              setTimeout(() => field.onBlur(), 0);
            }
          };

          // Add keyboard accessibility for clearing the field with Escape
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
            if (e.key === 'Escape') {
              handleEscapeKey(field.onChange, field.value)(e);

              // If required, trigger validation after clearing
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
              <Input
                {...field}
                id={id}
                placeholder={placeholder || '0x...'}
                className={validationClasses}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                data-slot="input"
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
              />

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
AddressField.displayName = 'AddressField';
