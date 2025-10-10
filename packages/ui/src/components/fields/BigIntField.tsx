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
 * BigIntField component properties
 */
export interface BigIntFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Custom validation function for big integer string values
   */
  validateBigInt?: (value: string) => boolean | string;
}

/**
 * Big integer input field component for large numbers beyond JavaScript's Number precision.
 *
 * This component is designed for blockchain integer types like uint128, uint256, int128, int256
 * that can hold values larger than JavaScript's Number.MAX_SAFE_INTEGER (2^53 - 1).
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects BigIntField for large integer types
 * 4. This component handles string-based integer input with validation
 * 5. Adapters convert the string to BigInt when submitting transactions
 *
 * The component includes:
 * - Integer-only validation (no decimals allowed)
 * - String-based storage to avoid JavaScript Number precision issues
 * - Integration with React Hook Form
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export function BigIntField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  validateBigInt,
  readOnly,
}: BigIntFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Regular expression for integer validation (no decimals)
  const INTEGER_REGEX = /^-?\d+$/;

  // Validation function for big integer strings
  const validateBigIntValue = (value: string): string | true => {
    // Run standard validation first
    const standardValidation = validateField(value, validation);
    if (standardValidation !== true) return standardValidation as string;

    // Validate integer format (no decimals)
    if (!INTEGER_REGEX.test(value)) {
      return 'Value must be a valid integer (no decimals)';
    }

    // Run custom validator if provided
    if (validateBigInt) {
      const customValidation = validateBigInt(value);
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
        <Label htmlFor={id}>
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        rules={{
          validate: (value) => {
            // Skip validation if empty and check required separately
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Handle incomplete inputs
            if (value === '-') {
              return 'Please enter a complete number';
            }

            // For string values, validate as big integer
            if (typeof value === 'string') {
              return validateBigIntValue(value);
            }

            // Convert numbers to strings (in case value is accidentally a number)
            if (typeof value === 'number') {
              return validateBigIntValue(value.toString());
            }

            return true;
          },
        }}
        disabled={readOnly}
        render={({ field, fieldState: { error, isTouched } }) => {
          const hasError = !!error;
          const shouldShowError = hasError && isTouched;
          const validationClasses = getValidationStateClasses(error, isTouched);

          // Handle input change
          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const rawValue = e.target.value;

            // Allow empty string
            if (rawValue === '') {
              field.onChange('');
              return;
            }

            // Allow standalone minus sign for negative numbers
            if (rawValue === '-') {
              field.onChange(rawValue);
              return;
            }

            // Check if the input is a valid integer format
            // Allow only digits and optional leading minus sign
            if (/^-?\d*$/.test(rawValue)) {
              field.onChange(rawValue);
            }
            // If invalid format, don't update (prevents non-numeric input)
          };

          // Handle keyboard events
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
            // Allow only numeric characters, backspace, delete, tab, escape, enter, arrows, hyphen
            const allowedKeys = [
              '0',
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              'Backspace',
              'Delete',
              'Tab',
              'Escape',
              'Enter',
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              '-',
            ];

            // Allow Ctrl/Cmd+A, C, V, X, Z for common editing operations
            if (
              (e.ctrlKey || e.metaKey) &&
              ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())
            ) {
              return;
            }

            if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
            }

            // Handle escape key to clear input
            if (e.key === 'Escape') {
              handleEscapeKey(field.onChange, field.value)(e);
              return;
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
                value={field.value ?? ''}
                id={id}
                placeholder={placeholder || 'Enter integer value'}
                type="text"
                className={validationClasses}
                onKeyDown={handleKeyDown}
                data-slot="input"
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="-?[0-9]*"
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                disabled={readOnly}
              />

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId} className="text-muted-foreground text-sm">
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              <ErrorMessage
                error={error}
                id={errorId}
                message={shouldShowError ? error?.message : undefined}
              />
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
BigIntField.displayName = 'BigIntField';
