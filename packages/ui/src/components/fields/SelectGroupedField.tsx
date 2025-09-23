import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { cn } from '@openzeppelin/ui-builder-utils';

import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { BaseFieldProps } from './BaseField';

/**
 * Option item for select fields with visual indicators
 */
export interface GroupedSelectOption {
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
   * Custom CSS class to apply to the option
   */
  className?: string;
}

/**
 * Option group structure
 */
export interface OptionGroup {
  /**
   * Group label to display
   */
  label: string;

  /**
   * Options within this group
   */
  options: GroupedSelectOption[];
}

/**
 * SelectGroupedField component properties
 */
export interface SelectGroupedFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Available option groups for selection
   */
  groups?: OptionGroup[];

  /**
   * Custom validation function for select values
   */
  validateSelect?: (value: string) => boolean | string;
}

/**
 * Select dropdown field component with grouped options specifically designed for React Hook Form integration.
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
export function SelectGroupedField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder = 'Select an option',
  helperText,
  control,
  name,
  width = 'full',
  validation,
  groups = [],
  validateSelect,
}: SelectGroupedFieldProps<TFieldValues>): React.ReactElement {
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
                  {groups.map((group, groupIndex) => (
                    <React.Fragment key={`group-${groupIndex}`}>
                      {groupIndex > 0 && <SelectSeparator />}
                      <SelectGroup>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={cn(option.className, option.disabled && 'opacity-50')}
                          >
                            <span>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </React.Fragment>
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
SelectGroupedField.displayName = 'SelectGroupedField';
