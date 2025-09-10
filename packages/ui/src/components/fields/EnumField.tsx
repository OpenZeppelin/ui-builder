import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import type { EnumValue, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { BaseFieldProps } from './BaseField';
import {
  ErrorMessage,
  getAccessibilityProps,
  getValidationStateClasses,
  validateField,
} from './utils';

/**
 * Enum variant definition
 */
export interface EnumVariant {
  /** Name of the variant (e.g., 'One', 'Two', 'Three') */
  name: string;
  /** Type of variant: 'void' for unit variants, 'tuple' for variants with payload, 'integer' for numeric enums */
  type: 'void' | 'tuple' | 'integer';
  /** For tuple variants: array of payload type names (e.g., ['U32', 'ScString']) */
  payloadTypes?: string[];
  /** For integer variants: the numeric value */
  value?: number;
}

/**
 * Enum metadata extracted from contract spec
 */
export interface EnumMetadata {
  /** Name of the enum type */
  name: string;
  /** Array of variants in the enum */
  variants: EnumVariant[];
  /** True if all variants are unit variants (no payloads), suitable for simple select/radio */
  isUnitOnly: boolean;
}

/**
 * Enum field value structure for blockchain enum types
 */
export type EnumFieldValue = EnumValue;

/**
 * EnumField component properties
 */
export interface EnumFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Enum metadata containing variant information
   */
  enumMetadata?: EnumMetadata;

  /**
   * Custom validation function for enum values
   */
  validateEnum?: (value: EnumFieldValue) => boolean | string;

  /**
   * Render function for payload input fields.
   * This allows the parent component to provide appropriate field components
   * based on the payload type, maintaining separation of concerns.
   */
  renderPayloadField?: (field: FormFieldType, payloadIndex: number) => React.ReactNode;
}

/**
 * Composite enum field component for blockchain enum types.
 *
 * This component handles both unit enums (simple variants) and tagged enums (variants with payloads).
 * For unit enums, it renders as a simple select dropdown.
 * For tagged enums, it renders a variant picker plus conditional input fields for payload data.
 *
 * The value format is designed to be chain-agnostic:
 * - Unit variants: { tag: "VariantName" }
 * - Tuple variants: { tag: "VariantName", values: [...] }
 */
export function EnumField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder = 'Select variant',
  helperText,
  control,
  name,
  width = 'full',
  validation,
  enumMetadata,
  validateEnum,
  renderPayloadField,
  readOnly,
}: EnumFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Use consistent width classes
  const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3';

  // If no enum metadata or empty variants, fallback to a simple text input with helper text
  if (!enumMetadata || enumMetadata.variants.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', widthClass)}>
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
              // Use standard validation first
              const standardValidation = validateField(value, validation);
              if (standardValidation !== true) {
                return standardValidation;
              }

              // If it's a string, try to validate it as JSON
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  // Check if it has the required 'tag' property
                  if (!parsed.tag) {
                    return 'JSON must have a "tag" property specifying the enum variant';
                  }
                } catch {
                  return 'Invalid JSON format. Please enter valid JSON like {"tag":"VariantName"}';
                }
              }

              // If it's an object, check if it has the required 'tag' property
              if (typeof value === 'object' && value !== null) {
                if (!('tag' in value)) {
                  return 'Enum value must have a "tag" property specifying the variant';
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

            return (
              <>
                <div className="space-y-2">
                  <div className="p-3 border border-border rounded-md bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Enum metadata not available. Please enter the value in JSON format.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: {`{"tag":"VariantName"}`} or {`{"tag":"VariantName","values":[...]}`}
                    </p>
                  </div>

                  <Textarea
                    id={id}
                    {...accessibilityProps}
                    className={cn('min-h-[80px]', validationClasses)}
                    placeholder={`{"tag":"One"} or {"tag":"Two","values":[42]}`}
                    value={
                      typeof field.value === 'string'
                        ? field.value
                        : JSON.stringify(field.value || {})
                    }
                    onChange={(e) => {
                      try {
                        // Try to parse as JSON, if successful store as object
                        const parsed = JSON.parse(e.target.value);
                        field.onChange(parsed);
                      } catch {
                        // If parsing fails, store as string (user is still typing)
                        field.onChange(e.target.value);
                      }
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    disabled={readOnly}
                  />
                </div>

                {helperText && (
                  <div id={descriptionId} className="text-muted-foreground text-sm">
                    {helperText}
                  </div>
                )}

                <ErrorMessage error={error} id={errorId} />
              </>
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', widthClass)}>
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
            // Use standard validation first
            const standardValidation = validateField(value, validation);
            if (standardValidation !== true) {
              return standardValidation;
            }

            // Handle enum-specific validation
            if (!value || !value.tag) {
              return validation?.required ? 'This field is required' : true;
            }

            // Run custom validation if provided
            if (validateEnum && value) {
              const customValidation = validateEnum(value);
              if (customValidation !== true && typeof customValidation === 'string') {
                return customValidation;
              }
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;
          const currentValue: EnumFieldValue = field.value || { tag: '' };

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          // Handle variant selection
          const handleVariantChange = (selectedTag: string): void => {
            const selectedVariant = enumMetadata.variants.find((v) => v.name === selectedTag);
            if (!selectedVariant) return;

            if (selectedVariant.type === 'void' || selectedVariant.type === 'integer') {
              // Unit variant - just set the tag
              field.onChange({ tag: selectedTag });
            } else {
              // Tuple variant - initialize with empty values (chain-agnostic)
              const initialValues = new Array(selectedVariant.payloadTypes?.length || 0).fill('');

              field.onChange({
                tag: selectedTag,
                values: initialValues,
              });
            }
          };

          // Handle payload value changes for tuple variants (chain-agnostic)
          const handlePayloadChange = (index: number, value: string): void => {
            const newValues = [...(currentValue.values || [])];
            // Simple chain-agnostic structure - just store the raw values
            newValues[index] = value;
            const newEnumValue = { ...currentValue, values: newValues };
            field.onChange(newEnumValue);
          };

          const selectedVariant = enumMetadata.variants.find((v) => v.name === currentValue.tag);

          return (
            <>
              {/* Variant Picker */}
              <Select
                value={currentValue.tag}
                onValueChange={handleVariantChange}
                disabled={readOnly}
              >
                <SelectTrigger id={id} {...accessibilityProps}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {enumMetadata.variants.map((variant) => (
                    <SelectItem key={variant.name} value={variant.name}>
                      {variant.name}
                      {variant.type === 'integer' && variant.value !== undefined && (
                        <span className="text-muted-foreground ml-2">({variant.value})</span>
                      )}
                      {variant.type === 'tuple' && variant.payloadTypes && (
                        <span className="text-muted-foreground ml-2">
                          ({variant.payloadTypes.join(', ')})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Conditional Payload Inputs for Tuple Variants */}
              {selectedVariant &&
                selectedVariant.type === 'tuple' &&
                selectedVariant.payloadTypes && (
                  <div className="ml-4 space-y-2 border-l-2 border-border pl-4">
                    <p className="text-sm text-muted-foreground">
                      Enter values for {selectedVariant.name}:
                    </p>
                    {selectedVariant.payloadTypes.map((payloadType, index) => {
                      // Create field configuration for payload input
                      const payloadField: FormFieldType = {
                        id: `${id}-payload-${index}`,
                        name: `${name}.values.${index}`,
                        label: payloadType,
                        type: 'text', // Default to text, will be mapped by adapter in DynamicFormField
                        validation: {},
                        placeholder: `Enter ${payloadType} value`,
                        helperText: undefined,
                        width: 'full',
                        originalParameterType: payloadType,
                        readOnly: readOnly, // Inherit readOnly state from parent
                      };

                      return (
                        <div key={index} className="flex flex-col gap-1">
                          {renderPayloadField ? (
                            renderPayloadField(payloadField, index)
                          ) : (
                            // Fallback to basic input if no render function provided
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`${id}-payload-${index}`} className="text-sm">
                                {payloadType}
                              </Label>
                              <Input
                                id={`${id}-payload-${index}`}
                                type="text"
                                placeholder={`Enter ${payloadType} value`}
                                value={(currentValue.values?.[index] as string) || ''}
                                onChange={(e) => handlePayloadChange(index, e.target.value)}
                                disabled={readOnly}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
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
EnumField.displayName = 'EnumField';
