import { GripVertical, Plus, X } from 'lucide-react';

import React from 'react';
import { Controller, FieldValues, useFieldArray, useFormContext } from 'react-hook-form';

import type { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';

import { Button } from '../ui/button';
import { Label } from '../ui/label';

import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps } from './utils';

/**
 * ArrayField component properties
 */
export interface ArrayFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * The type of elements in the array (e.g., 'text', 'number', 'blockchain-address')
   */
  elementType?: FormFieldType['type']; // TODO: Consider if a more specific subset of FieldType is relevant here if this component only renders simple types directly.

  /**
   * Minimum number of array elements
   */
  minItems?: number;

  /**
   * Maximum number of array elements
   */
  maxItems?: number;

  /**
   * Base configuration for array element fields.
   * This allows specifying common properties like placeholder, helperText, or specific validation
   * for each element in the array.
   */
  // TODO: Refine elementFieldConfig type. `id` and `name` are derived internally.
  // Consider a type like `Omit<Partial<FormFieldType>, 'id' | 'name'> & { defaultValue?: unknown }`
  // to allow specifying a more complex default value for appended items.
  elementFieldConfig?: Partial<FormFieldType>;

  /**
   * Render function for array elements.
   * This is crucial for rendering complex elements or integrating custom field components.
   */
  // TODO: Explore a fallback rendering mechanism if `renderElement` is not provided,
  // especially if `elementType` is a known simple type (e.g., 'text', 'number').
  // This could make the component more self-contained for basic array types.
  renderElement?: (field: FormFieldType, index: number) => React.ReactNode;
}

/**
 * Array input field component specifically designed for React Hook Form integration.
 *
 * This component provides a dynamic interface for managing array inputs with:
 * - Add/remove functionality for array items
 * - Validation for array length constraints
 * - Integration with existing field components for array elements
 * - Full accessibility support
 *
 * The component reuses existing field components (TextField, NumberField, etc.)
 * for individual array elements, maintaining consistency across the form system.
 */
export function ArrayField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  elementType = 'text',
  minItems = 0,
  maxItems,
  elementFieldConfig,
  renderElement,
  isReadOnly,
}: ArrayFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Get form context for nested field registration
  const formContext = useFormContext();

  // Use useFieldArray for dynamic array management
  const { fields, append, remove } = useFieldArray({
    control: control || formContext.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
    // TODO: Investigate if stricter typing for `name` can be achieved to avoid `as any`
    // with react-hook-form's useFieldArray and deeply nested field names.
  });

  // Handle adding new array item
  const handleAddItem = (): void => {
    // Determine default value based on element type
    // TODO: Enhance default value generation.
    // 1. Allow `elementFieldConfig.defaultValue` to override this basic logic.
    // 2. For 'object' or 'array-object' elementType (if supported directly later),
    //    this would need to be more sophisticated (e.g., an empty object/array).
    // 3. Consider a more generic `getDefaultValueByFieldType` utility if not already used/available.
    const defaultValue =
      elementFieldConfig?.defaultValue !== undefined
        ? elementFieldConfig.defaultValue
        : elementType === 'number' || elementType === 'amount'
          ? 0
          : elementType === 'checkbox'
            ? false
            : ''; // Default for text, address, etc.

    append(defaultValue as FieldValues[typeof name]);
  };

  // Check if we can add more items
  const canAddMore = !maxItems || fields.length < maxItems;

  // Check if we can remove items
  const canRemove = fields.length > minItems;

  // TODO: For future enhancement, consider adding drag-and-drop reordering functionality for array items.
  // The GripVertical icon hints at this, but implementation would require additional libraries/logic.

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        // TODO: Consider if custom validation functions passed via `validation.validate` prop
        // should also be callable here, in addition to these built-in length checks.
        validate: (value) => {
          // Validate array constraints
          if (validation?.required && (!value || !Array.isArray(value) || value.length === 0)) {
            return 'At least one item is required';
          }

          if (minItems && Array.isArray(value) && value.length < minItems) {
            return `Minimum ${minItems} item${minItems > 1 ? 's' : ''} required`;
          }

          if (maxItems && Array.isArray(value) && value.length > maxItems) {
            return `Maximum ${maxItems} item${maxItems > 1 ? 's' : ''} allowed`;
          }

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
        // TODO: Review aria-controls/aria-labelledby for the "Add Item" button and the list of items for improved accessibility.

        return (
          <div
            className={`flex flex-col gap-4 ${width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3'}`}
            {...accessibilityProps}
            aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
          >
            {/* Label */}
            {label && (
              <div className="flex items-center justify-between">
                <Label htmlFor={id}>
                  {label} {isRequired && <span className="text-destructive">*</span>}
                </Label>
              </div>
            )}

            {/* Array items */}
            <div className="space-y-3">
              {fields.length === 0 ? (
                <div className="text-muted-foreground text-sm py-4 text-center border border-dashed rounded-md">
                  No items added yet. Click &ldquo;Add Item&rdquo; to begin.
                </div>
              ) : (
                fields.map((field, index) => {
                  // Create field configuration for array element
                  const elementField: FormFieldType = {
                    id: `${id}-${index}`, // Internal ID for the element's field
                    name: `${name}.${index}`, // RHF name for the element
                    label: elementFieldConfig?.label || '', // Label for the element's field (can be empty if not desired)
                    type: elementType,
                    validation: elementFieldConfig?.validation || {},
                    placeholder: elementFieldConfig?.placeholder,
                    helperText: elementFieldConfig?.helperText,
                    width: 'full', // Typically, elements take full width within their row
                    isReadOnly: elementFieldConfig?.isReadOnly ?? isReadOnly, // Inherit isReadOnly from parent
                    ...elementFieldConfig, // Spread any other config but ensure id, name, type, label are controlled
                  };

                  return (
                    <div key={field.id} className="flex gap-2 items-center">
                      <div className="flex items-center">
                        {/* TODO: The GripVertical icon is purely visual currently.
                            If drag-and-drop is implemented, this would be the drag handle.
                            Ensure it has appropriate ARIA attributes if it becomes interactive. */}
                        <GripVertical className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        {renderElement ? (
                          renderElement(elementField, index)
                        ) : (
                          // This fallback is okay, but a more robust solution might attempt to
                          // render a default UI field based on `elementType` if it's a known simple type.
                          <div className="text-sm text-muted-foreground">
                            Field type &ldquo;{elementType}&rdquo; requires a render function
                          </div>
                        )}
                      </div>
                      {!isReadOnly && canRemove && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
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
            </div>

            {/* Add Item button */}
            {!isReadOnly && canAddMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-1 w-full sm:w-auto"
                // TODO: Add aria-live region or other announcement for screen readers when an item is added/removed.
              >
                <Plus className="size-3" />
                Add Item
              </Button>
            )}

            {/* Helper text */}
            {helperText && (
              <div id={descriptionId} className="text-muted-foreground text-sm">
                {helperText}
              </div>
            )}

            {/* Error message */}
            <ErrorMessage error={error} id={errorId} />
          </div>
        );
      }}
    />
  );
}

// Set display name for debugging
ArrayField.displayName = 'ArrayField';
