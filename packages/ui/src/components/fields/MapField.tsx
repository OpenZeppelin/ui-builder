import { Plus, X } from 'lucide-react';
import React from 'react';
import { Controller, FieldValues, useFieldArray, useFormContext } from 'react-hook-form';

import type { FormFieldType, MapEntry } from '@openzeppelin/contracts-ui-builder-types';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps } from './utils';

/**
 * MapField component properties
 */
export interface MapFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Map metadata containing key and value type information
   */
  mapMetadata?: {
    keyType?: string;
    valueType?: string;
    keyFieldConfig?: Partial<FormFieldType>;
    valueFieldConfig?: Partial<FormFieldType>;
  };

  /**
   * Minimum number of map entries
   */
  minItems?: number;

  /**
   * Render function for map keys.
   * This allows the parent component to provide appropriate field components
   * based on the key type, maintaining separation of concerns.
   */
  renderKeyField?: (field: FormFieldType, entryIndex: number) => React.ReactNode;

  /**
   * Render function for map values.
   * This allows the parent component to provide appropriate field components
   * based on the value type, maintaining separation of concerns.
   */
  renderValueField?: (field: FormFieldType, entryIndex: number) => React.ReactNode;
}

/**
 * Map (key-value dictionary) input field component specifically designed for React Hook Form integration.
 *
 * This component provides a dynamic interface for managing map/dictionary inputs with:
 * - Add/remove functionality for key-value pairs
 * - Validation for map size constraints
 * - Integration with existing field components for keys and values
 * - Chain-agnostic data format (array of {key, value} objects)
 * - Full accessibility support
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like MapField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles map-specific rendering and validation
 *
 * The component stores data in a chain-agnostic format as an array of {key, value} objects.
 * The adapter is responsible for converting this to the chain-specific format (e.g., SorobanMapEntry[])
 * when submitting to the blockchain.
 */
export function MapField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  mapMetadata,
  minItems = 0,
  renderKeyField,
  renderValueField,
  readOnly,
}: MapFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Get form context for field array operations
  const formContext = useFormContext();
  const effectiveControl = control || formContext.control;

  // Use field array for dynamic key-value pairs
  const { fields, append, remove } = useFieldArray({
    control: effectiveControl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
  });

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
        control={effectiveControl}
        name={name}
        disabled={readOnly}
        rules={{
          validate: (value) => {
            // Map-specific validation
            const mapArray = Array.isArray(value) ? value : [];

            // Handle required validation - just check if entries exist
            // Individual field validation handles whether the entries are properly filled
            if (validation?.required && mapArray.length === 0) {
              return 'This field is required';
            }

            // Check minimum items
            if (minItems > 0 && mapArray.length < minItems) {
              return `At least ${minItems} item${minItems > 1 ? 's' : ''} required`;
            }

            // Skip validation for empty arrays (unless required)
            if (mapArray.length === 0) {
              return true;
            }

            // Check for duplicate keys (using string representation for comparison)
            const keys = mapArray
              .map((entry: MapEntry) => entry?.key)
              .filter((key) => key !== undefined && key !== null && key !== '');

            const keyStrings = keys.map((key) => String(key));
            const uniqueKeyStrings = new Set(keyStrings);

            if (keyStrings.length !== uniqueKeyStrings.size) {
              return 'Duplicate keys are not allowed';
            }

            // Note: Individual key/value validation is handled by the rendered field components
            // which know about the specific types (ScSymbol, Bytes, etc.) through the adapter

            return true;
          },
        }}
        render={({ fieldState: { error } }) => {
          const hasError = !!error;

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          // Add new map item
          const handleAddEntry = (): void => {
            append({ key: '', value: '' } as FieldValues[typeof name]);
          };

          // Remove map item
          const handleRemoveEntry = (index: number): void => {
            if (fields.length > minItems) {
              remove(index);
            }
          };

          return (
            <>
              <div
                className="space-y-3"
                {...accessibilityProps}
                aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`.trim()}
              >
                {fields.length === 0 ? (
                  <div className="text-muted-foreground text-sm p-4 border border-dashed border-border rounded-md text-center">
                    No items added yet. Click &ldquo;Add Item&rdquo; to begin.
                  </div>
                ) : (
                  fields.map((field, index) => {
                    // Create field configurations for key and value, following ArrayField pattern
                    const keyField: FormFieldType = {
                      ...mapMetadata?.keyFieldConfig, // Base config from adapter
                      id: `${id}-key-${index}`,
                      name: `${name}.${index}.key`,
                      label: 'Key',
                      type: mapMetadata?.keyFieldConfig?.type || 'text',
                      validation: { required: true, ...mapMetadata?.keyFieldConfig?.validation },
                      placeholder: mapMetadata?.keyFieldConfig?.placeholder || 'Enter key',
                      width: 'full',
                      readOnly: readOnly,
                      originalParameterType: mapMetadata?.keyFieldConfig?.originalParameterType,
                    };

                    const valueField: FormFieldType = {
                      ...mapMetadata?.valueFieldConfig, // Base config from adapter
                      id: `${id}-value-${index}`,
                      name: `${name}.${index}.value`,
                      label: 'Value',
                      type: mapMetadata?.valueFieldConfig?.type || 'text',
                      validation: { required: true, ...mapMetadata?.valueFieldConfig?.validation },
                      placeholder: mapMetadata?.valueFieldConfig?.placeholder || 'Enter value',
                      width: 'full',
                      readOnly: readOnly,
                      originalParameterType: mapMetadata?.valueFieldConfig?.originalParameterType,
                    };

                    return (
                      <div
                        key={field.id}
                        className="flex items-start gap-2 p-3 border border-border rounded-md bg-background"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          {/* Key Field */}
                          <div className="flex flex-col gap-1">
                            {renderKeyField ? (
                              renderKeyField(keyField, index)
                            ) : (
                              // Fallback - show message that render function is required
                              <div className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded">
                                Key field type &ldquo;{keyField.type}&rdquo; requires a render
                                function
                              </div>
                            )}
                          </div>

                          {/* Value Field */}
                          <div className="flex flex-col gap-1">
                            {renderValueField ? (
                              renderValueField(valueField, index)
                            ) : (
                              // Fallback - show message that render function is required
                              <div className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded">
                                Value field type &ldquo;{valueField.type}&rdquo; requires a render
                                function
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        {!readOnly && fields.length > minItems && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEntry(index)}
                            className="size-8 p-0"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Add Item Button */}
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddEntry}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>

              {/* Helper text */}
              {helperText && (
                <div id={descriptionId} className="text-muted-foreground text-sm">
                  {helperText}
                </div>
              )}

              {/* Error message */}
              <ErrorMessage error={error} id={errorId} />
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
MapField.displayName = 'MapField';
