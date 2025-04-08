import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

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

  /**
   * Data attributes for styling and accessibility
   */
  'data-compatible'?: string;

  /**
   * Whether this option is recommended
   */
  'data-recommended'?: string;
}

/**
 * Option group for select fields
 */
export interface SelectOptionGroup {
  /**
   * Label for the option group
   */
  label: string;

  /**
   * Options in this group
   */
  options: SelectOption[];
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
   * Option groups for grouped selection
   */
  optionGroups?: SelectOptionGroup[];

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
  optionGroups = [],
  validateSelect,
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
                  {/* Render optgroups if provided */}
                  {optionGroups.length > 0
                    ? optionGroups.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                              className={cn(
                                option['data-compatible'] === 'false' ? 'opacity-50' : '',
                                option['data-recommended'] === 'true' ? 'font-medium' : ''
                              )}
                              data-compatible={option['data-compatible']}
                              data-recommended={option['data-recommended']}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))
                    : // Render flat list if no groups
                      options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                          className={cn(
                            option['data-compatible'] === 'false' ? 'opacity-50' : '',
                            option['data-recommended'] === 'true' ? 'font-medium' : ''
                          )}
                          data-compatible={option['data-compatible']}
                          data-recommended={option['data-recommended']}
                        >
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
