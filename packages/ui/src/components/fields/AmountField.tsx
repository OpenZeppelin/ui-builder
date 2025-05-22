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
  handleNumericKeys,
} from './utils';

/**
 * AmountField component properties
 */
export interface AmountFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
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

  /**
   * Number of decimal places to allow
   */
  decimals?: number;

  /**
   * Currency/token symbol to display
   */
  symbol?: string;

  /**
   * Position of the symbol (before or after the amount)
   */
  symbolPosition?: 'prefix' | 'suffix';

  /**
   * Custom validation function for amount values
   */
  validateAmount?: (value: number) => boolean | string;
}

/**
 * Amount input field component specifically designed for currency/token amounts with React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles amount-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Support for currency/token symbols
 * - Numeric-specific validations (min, max, decimals)
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with arrow keys for numeric increment/decrement
 */
export function AmountField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  min,
  max,
  step = 0.01,
  decimals = 2,
  symbol = '',
  symbolPosition = 'suffix',
  validateAmount,
}: AmountFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Formatter for displaying currency/token values
  const formatCurrency = (value: string | number): string => {
    if (value === '' || value === undefined || value === null) return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';

    return numValue.toFixed(decimals);
  };

  // Parse string input to number
  const parseAmount = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
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
            // Convert to number for validation
            const numValue = typeof value === 'string' ? parseFloat(value) : value;

            // Handle required validation explicitly
            if (value === undefined || value === null || value === '' || isNaN(numValue)) {
              return validation?.required ? 'This field is required' : true;
            }

            // Validate min/max constraints
            if (min !== undefined && numValue < min) {
              return `Value must be at least ${min}`;
            }

            if (max !== undefined && numValue > max) {
              return `Value must be at most ${max}`;
            }

            // Run custom validation if provided
            if (validateAmount && !isNaN(numValue)) {
              const validation = validateAmount(numValue);
              if (validation !== true && typeof validation === 'string') {
                return validation;
              }
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;
          const validationClasses = getValidationStateClasses(error);

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          // Format display value
          const displayValue = field.value !== undefined && field.value !== null ? field.value : '';

          return (
            <>
              <div className="relative">
                {symbol && symbolPosition === 'prefix' && (
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                    {symbol}
                  </span>
                )}

                <Input
                  {...field}
                  id={id}
                  type="text"
                  inputMode="decimal"
                  placeholder={placeholder}
                  value={displayValue}
                  className={`${validationClasses} ${
                    symbol && symbolPosition === 'prefix' ? 'pl-8' : ''
                  } ${symbol && symbolPosition === 'suffix' ? 'pr-8' : ''}`}
                  data-slot="input"
                  {...accessibilityProps}
                  aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                  onChange={(e) => {
                    // Allow numeric values and decimal point
                    const value = e.target.value;
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Format on blur
                    if (e.target.value) {
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed)) {
                        field.onChange(formatCurrency(parsed));
                      }
                    }
                    if (field.onBlur) {
                      field.onBlur();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle Escape key
                    if (e.key === 'Escape') {
                      handleEscapeKey((value) => {
                        field.onChange(value === '' ? null : value);
                      }, field.value)(e);
                      return;
                    }

                    // Handle arrow keys for increment/decrement
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      handleNumericKeys(
                        (newValue) => {
                          field.onChange(formatCurrency(newValue));
                        },
                        parseAmount(field.value) || 0,
                        step,
                        min,
                        max
                      )(e);
                    }
                  }}
                />

                {symbol && symbolPosition === 'suffix' && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
                    {symbol}
                  </span>
                )}
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
AmountField.displayName = 'AmountField';
