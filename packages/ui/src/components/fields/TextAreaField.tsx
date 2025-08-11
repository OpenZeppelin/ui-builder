import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

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
 * TextAreaField component properties
 */
export interface TextAreaFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Number of rows for the textarea
   */
  rows?: number;

  /**
   * Maximum characters allowed in textarea
   */
  maxLength?: number;

  /**
   * Custom validation function for textarea values
   */
  validateTextArea?: (value: string) => boolean | string;
}

/**
 * Multi-line text input field component specifically designed for React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles textarea-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Resizable multi-line text input
 * - Character limit support
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with Escape to clear
 */
export function TextAreaField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  rows = 4,
  maxLength,
  validateTextArea,
}: TextAreaFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

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
            // Handle required validation explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Run custom validation if provided
            if (validateTextArea && value) {
              const validation = validateTextArea(value);
              if (validation !== true && typeof validation === 'string') {
                return validation;
              }
            }

            // Check maximum length
            if (maxLength && typeof value === 'string' && value.length > maxLength) {
              return `Maximum length is ${maxLength} characters`;
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

          return (
            <>
              <Textarea
                {...field}
                id={id}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                className={validationClasses}
                value={field.value ?? ''}
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                onKeyDown={handleEscapeKey((value) => {
                  if (typeof field.onChange === 'function') {
                    field.onChange(value);
                  }
                }, field.value)}
              />

              {/* Display character count if maxLength is provided */}
              {maxLength && typeof field.value === 'string' && (
                <div className="text-muted-foreground text-right text-xs">
                  {field.value.length}/{maxLength}
                </div>
              )}

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
TextAreaField.displayName = 'TextAreaField';
