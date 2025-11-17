import { Plus, X } from 'lucide-react';
import React from 'react';
import { Controller, FieldValues, useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import type { FormFieldType } from '@openzeppelin/ui-builder-types';

import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { BaseFieldProps } from '../BaseField';
import { ErrorMessage, getAccessibilityProps } from '../utils';
import {
  computeChildTouched,
  MapEntryRow,
  useDuplicateKeyIndexes,
  useMapFieldSync,
  validateMapStructure,
} from './index';

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
  const { fields, append, remove, replace } = useFieldArray({
    control: effectiveControl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
  });

  // Watch the map field value for duplicate key checking and initialization
  const watchedValue = useWatch({
    control: effectiveControl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
  });
  const watchedValueKey = React.useMemo(() => JSON.stringify(watchedValue), [watchedValue]);

  // Keep field array synchronized with watched values
  const isReplacingRef = useMapFieldSync(watchedValue, fields.length, replace);

  /*
   * Keep the parent MapField error in sync without calling trigger:
   * - If any child has an error and the parent is required -> set a parent error
   * - Else use the structural validation result
   * This avoids re-entrancy loops that can happen when calling trigger during Preview.
   */
  React.useEffect(() => {
    if (!formContext) return;
    if (isReplacingRef.current) return;

    const mapArray = Array.isArray(watchedValue)
      ? (watchedValue as Array<{ key?: unknown; value?: unknown }>)
      : [];

    let childHasError = false;
    for (let i = 0; i < mapArray.length; i++) {
      const keyPath = `${name}.${i}.key`;
      const valuePath = `${name}.${i}.value`;
      const keyError = (formContext.formState.errors as Record<string, { message?: string }>)[
        keyPath
      ]?.message;
      const valueError = (formContext.formState.errors as Record<string, { message?: string }>)[
        valuePath
      ]?.message;
      if (keyError || valueError) {
        childHasError = true;
        break;
      }
    }

    const structural = validateMapStructure({
      value: watchedValue,
      required: !!validation?.required,
      minItems,
    });

    let nextMessage: string | undefined;
    if (childHasError && validation?.required) {
      nextMessage = 'This field is required';
    } else if (structural !== true) {
      nextMessage = structural;
    }

    const currentMessage = ((formContext.formState.errors as Record<string, { message?: string }>)[
      name as string
    ]?.message || undefined) as string | undefined;

    if (nextMessage && nextMessage !== currentMessage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formContext.setError(name as any, { type: 'manual', message: nextMessage });
    } else if (!nextMessage && currentMessage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formContext.clearErrors(name as any);
    }
  }, [
    formContext,
    name,
    watchedValue,
    watchedValueKey,
    validation?.required,
    minItems,
    isReplacingRef,
  ]);

  const duplicateKeyIndexes = useDuplicateKeyIndexes(watchedValue);

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
          validate: (value) =>
            validateMapStructure({ value, required: !!validation?.required, minItems }),
        }}
        render={({ fieldState: { error, isTouched } }) => {
          // Check if any child fields have been touched to correctly determine
          // when to show the parent validation message.
          const anyChildTouched = computeChildTouched(formContext, name, watchedValue);
          const effectivelyTouched = isTouched || anyChildTouched;
          const hasError = !!error?.message;

          // Determine if the error message should be shown.
          // For required fields, we want to show the error immediately if the field is invalid.
          // For other fields, we only show it after the user has interacted with the component.
          const shouldShowError = hasError && (effectivelyTouched || isRequired);

          // Get accessibility attributes
          const accessibilityProps = getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!helperText,
          });

          // Add new map item
          const handleAddEntry = (): void => {
            // Set flag to prevent sync interference during add operation
            isReplacingRef.current = true;
            append(createDefaultEntry(mapMetadata) as FieldValues[typeof name]);

            // Reset flag after operation
            queueMicrotask(() => {
              isReplacingRef.current = false;
            });
          };

          // Remove map item
          const handleRemoveEntry = (index: number): void => {
            if (fields.length > minItems) {
              // Set flag to prevent sync interference during remove operation
              isReplacingRef.current = true;
              remove(index);

              // Reset flag after operation
              queueMicrotask(() => {
                isReplacingRef.current = false;
              });
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
                    const isDuplicateKey = duplicateKeyIndexes.has(index);

                    const keyField: FormFieldType = {
                      ...mapMetadata?.keyFieldConfig,
                      id: `${id}-key-${index}`,
                      name: `${name}.${index}.key`,
                      label: formatLabeledType(
                        'Key',
                        mapMetadata?.keyFieldConfig?.originalParameterType || mapMetadata?.keyType
                      ),
                      type: mapMetadata?.keyFieldConfig?.type || 'text',
                      validation: { required: true, ...mapMetadata?.keyFieldConfig?.validation },
                      placeholder: mapMetadata?.keyFieldConfig?.placeholder || 'Enter key',
                      width: 'full',
                      readOnly: readOnly,
                      originalParameterType: mapMetadata?.keyFieldConfig?.originalParameterType,
                    };

                    const valueField: FormFieldType = {
                      ...mapMetadata?.valueFieldConfig,
                      id: `${id}-value-${index}`,
                      name: `${name}.${index}.value`,
                      label: formatLabeledType(
                        'Value',
                        mapMetadata?.valueFieldConfig?.originalParameterType ||
                          mapMetadata?.valueType
                      ),
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
                        <MapEntryRow
                          keyField={keyField}
                          valueField={valueField}
                          isDuplicateKey={isDuplicateKey}
                          renderKeyField={renderKeyField}
                          renderValueField={renderValueField}
                          index={index}
                        />

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
              <ErrorMessage
                message={shouldShowError ? error?.message : undefined}
                error={error}
                id={errorId}
              />
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
MapField.displayName = 'MapField';

function formatLabeledType(baseLabel: string, typeHint?: string): string {
  if (!typeHint) {
    return baseLabel;
  }
  return `${baseLabel} (${typeHint})`;
}

function getDefaultValueForField(field?: Partial<FormFieldType>): unknown {
  const fieldType = field?.type;
  switch (fieldType) {
    case 'checkbox':
      return false;
    case 'object':
      return {};
    case 'array':
    case 'array-object':
    case 'map':
      return [];
    case 'enum':
      return '';
    case 'number':
    case 'bigint':
    case 'amount':
    case 'text':
    case 'textarea':
    case 'blockchain-address':
    case 'bytes':
    case 'select':
    case 'radio':
      return '';
    default:
      return '';
  }
}

function createDefaultEntry(mapMetadata?: MapFieldProps['mapMetadata']): {
  key: unknown;
  value: unknown;
} {
  return {
    key: getDefaultValueForField(mapMetadata?.keyFieldConfig),
    value: getDefaultValueForField(mapMetadata?.valueFieldConfig),
  };
}
