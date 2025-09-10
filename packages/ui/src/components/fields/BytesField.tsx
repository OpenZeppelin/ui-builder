import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { validateBytesSimple } from '@openzeppelin/contracts-ui-builder-utils';

import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { BaseFieldProps } from './BaseField';
import {
  ErrorMessage,
  getAccessibilityProps,
  getValidationStateClasses,
  handleEscapeKey,
} from './utils';

/**
 * BytesField component properties
 */
export interface BytesFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Number of rows for the textarea
   */
  rows?: number;

  /**
   * Maximum length in bytes (not characters)
   */
  maxBytes?: number;

  /**
   * Whether to accept hex, base64, or both formats
   */
  acceptedFormats?: 'hex' | 'base64' | 'both';

  /**
   * Whether to automatically add/remove 0x prefix for hex values
   */
  autoPrefix?: boolean;

  /**
   * Whether to allow 0x prefix in hex input (defaults to true)
   */
  allowHexPrefix?: boolean;
}

/**
 * Specialized input field for bytes data with built-in hex/base64 validation.
 *
 * This component provides proper validation for blockchain bytes data including:
 * - Hex encoding validation (with optional 0x prefix support)
 * - Base64 encoding validation
 * - Byte length validation
 * - Format detection and conversion
 *
 * Key props for EVM compatibility:
 * - `allowHexPrefix`: Whether to accept 0x prefixed input (defaults to true)
 * - `autoPrefix`: Whether to automatically add 0x prefixes (defaults to false)
 *
 * These are separate concerns - you can accept 0x input without auto-adding prefixes.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects BytesField for 'bytes' field types
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles bytes-specific validation and formatting
 */
export function BytesField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  placeholder = 'Enter hex or base64 encoded bytes',
  rows = 3,
  maxBytes,
  acceptedFormats = 'both',
  autoPrefix = false,
  allowHexPrefix = true,
  readOnly,
}: BytesFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  /**
   * Validates bytes input format and encoding using validator.js
   */
  const validateBytesField = (value: string): boolean | string => {
    return validateBytesSimple(value, {
      acceptedFormats,
      maxBytes,
      allowHexPrefix, // Allow prefix based on explicit prop (defaults to true)
    });
  };

  /**
   * Formats the input value (adds 0x prefix if needed)
   */
  const formatValue = (value: string): string => {
    if (!value || !autoPrefix) return value;

    const cleanValue = value.trim().replace(/\s+/g, '');
    const withoutPrefix = cleanValue.startsWith('0x') ? cleanValue.slice(2) : cleanValue;

    // Only add prefix for valid hex that doesn't already have it
    if (withoutPrefix && /^[0-9a-fA-F]*$/.test(withoutPrefix) && withoutPrefix.length % 2 === 0) {
      return cleanValue.startsWith('0x') ? cleanValue : `0x${cleanValue}`;
    }

    return cleanValue;
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
        disabled={readOnly}
        rules={{
          validate: (value) => {
            // Handle required validation explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Run bytes-specific validation using validator.js
            return validateBytesField(value);
          },
        }}
        render={({ field, fieldState: { error, isTouched } }) => {
          const hasError = !!error;
          const shouldShowError = hasError && (isTouched || validation?.required);
          const validationClasses = getValidationStateClasses(error, isTouched);

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            isDisabled: readOnly,
            hasHelperText: !!helperText,
          });

          return (
            <>
              <Textarea
                id={id}
                name={field.name}
                ref={field.ref}
                placeholder={placeholder}
                rows={rows}
                className={validationClasses}
                disabled={readOnly}
                value={field.value ?? ''}
                onChange={(e) => {
                  // Only update value without formatting for better performance
                  field.onChange(e.target.value);
                }}
                onBlur={(e) => {
                  // Apply formatting on blur when user finishes typing
                  const formatted = formatValue(e.target.value);
                  field.onChange(formatted);
                  // Note: Let React Hook Form handle blur naturally without programmatic trigger
                }}
                onKeyDown={handleEscapeKey(field.onChange, field.value)}
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`.trim()}
              />

              {/* Display helper text with format hint */}
              {helperText && (
                <div id={descriptionId} className="text-muted-foreground text-sm">
                  {helperText}
                  <div className="text-xs text-muted-foreground mt-1">
                    {acceptedFormats === 'hex' && 'Hex format (e.g., 48656c6c6f or 0x48656c6c6f)'}
                    {acceptedFormats === 'base64' && 'Base64 format (e.g., SGVsbG8=)'}
                    {acceptedFormats === 'both' &&
                      'Hex (e.g., 48656c6c6f) or Base64 (e.g., SGVsbG8=) format'}
                    {maxBytes && ` • Max ${maxBytes} bytes`}
                  </div>
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
BytesField.displayName = 'BytesField';
