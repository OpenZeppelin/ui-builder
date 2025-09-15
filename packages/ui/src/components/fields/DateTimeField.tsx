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
 * DateTimeField component properties
 */
export interface DateTimeFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Placeholder text displayed when the field is empty
   */
  placeholder?: string;

  /**
   * If true, clears the field when user clicks Escape; otherwise just blurs
   */
  clearOnEscape?: boolean;
}

/**
 * Datetime-local input field component specifically designed for React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like DateTimeField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles date-time specific rendering, conversion, and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Conversion between input value (YYYY-MM-DDTHH:mm) and ISO 8601 strings (toISOString)
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation with Escape-to-clear behavior
 */
export function DateTimeField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  readOnly,
  clearOnEscape = true,
}: DateTimeFieldProps<TFieldValues>): React.ReactElement {
  /**
   * TODO: Replace native datetime-local input with a styled popover-based
   * calendar/time picker (Radix Popover + Select) to match the design system.
   * Maintain ISO 8601 value semantics and provide a mobile fallback to native input.
   */
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Validate ISO 8601 string or empty according to validation rules
  const validateDateValue = (value: string): string | true => {
    const validationResult = validateField(value, validation);
    return validationResult === true ? true : (validationResult as string);
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
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }
            if (typeof value === 'string') {
              return validateDateValue(value);
            }
            return true;
          },
        }}
        disabled={readOnly}
        render={({ field, fieldState: { error, isTouched } }) => {
          const hasError = !!error;
          const shouldShowError = hasError && isTouched;
          const validationClasses = getValidationStateClasses(error, isTouched);

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const raw = e.target.value; // YYYY-MM-DDTHH:mm or ''
            if (!raw) {
              field.onChange('');
              return;
            }
            // Preserve the exact local selection instead of converting to UTC.
            // Store as ISO-like local string with timezone offset maintained by parsing components.
            const [datePart, timePart] = raw.split('T');
            const [year, month, day] = datePart.split('-').map((s) => Number(s));
            const [hours, minutes] = timePart.split(':').map((s) => Number(s));
            const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
            // Serialize back to local YYYY-MM-DDTHH:mm string so the value remains what the user picked
            const pad = (n: number): string => String(n).padStart(2, '0');
            const serialized = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
            field.onChange(serialized);
          };

          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
            if (e.key === 'Escape') {
              if (clearOnEscape) {
                handleEscapeKey(field.onChange as (v: string) => void, field.value)(e);
              } else {
                (e.target as HTMLElement).blur();
              }
            }
          };

          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
            isDisabled: !!readOnly,
          });

          const formatDateTimeLocal = (val: unknown): string => {
            if (!val) return '';
            try {
              const d = new Date(val as string);
              if (isNaN(d.getTime())) return '';
              const pad = (n: number): string => String(n).padStart(2, '0');
              const year = d.getFullYear();
              const month = pad(d.getMonth() + 1);
              const day = pad(d.getDate());
              const hours = pad(d.getHours());
              const minutes = pad(d.getMinutes());
              // Return a local datetime string for the input value to avoid timezone shifts
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch {
              return '';
            }
          };

          const inputValue: string = formatDateTimeLocal(field.value);

          return (
            <>
              <Input
                {...field}
                id={id}
                placeholder={placeholder}
                className={validationClasses}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                data-slot="input"
                value={inputValue}
                type="datetime-local"
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
                disabled={readOnly}
              />

              {helperText && (
                <div id={descriptionId} className="text-muted-foreground text-sm">
                  {helperText}
                </div>
              )}

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

DateTimeField.displayName = 'DateTimeField';
