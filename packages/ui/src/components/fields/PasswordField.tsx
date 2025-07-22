import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { Button } from '../ui/button';
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
 * PasswordField component properties
 */
export interface PasswordFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Placeholder text displayed when the field is empty
   */
  placeholder?: string;

  /**
   * Whether to show the password visibility toggle button
   * @default true
   */
  showToggle?: boolean;
}

/**
 * Password input field component specifically designed for React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like PasswordField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles password-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Password visibility toggle functionality
 * - Password-specific validations (minLength, maxLength, pattern)
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export function PasswordField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  isReadOnly,
  showToggle = true,
}: PasswordFieldProps<TFieldValues>): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Function for validating password values
  const validatePasswordValue = (value: string): string | true => {
    const validationResult = validateField(value, validation);
    return validationResult === true ? true : (validationResult as string);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (): void => {
    setShowPassword((prev) => !prev);
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
            // Handle required validation explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Validate password values
            if (typeof value === 'string') {
              return validatePasswordValue(value);
            }

            return true;
          },
        }}
        disabled={isReadOnly}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;
          const validationClasses = getValidationStateClasses(error);

          // Handle input change with validation for required fields
          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const value = e.target.value;
            field.onChange(value);

            // Trigger validation if the field is required and empty
            if (isRequired && value === '') {
              setTimeout(() => field.onBlur(), 0);
            }
          };

          // Handle keyboard events
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
              <div className="relative">
                <Input
                  {...field}
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={placeholder}
                  className={`${validationClasses} ${showToggle ? 'pr-10' : ''}`}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  data-slot="input"
                  value={field.value ?? ''}
                  {...accessibilityProps}
                  aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                  disabled={isReadOnly}
                />
                {showToggle && !isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
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
PasswordField.displayName = 'PasswordField';
