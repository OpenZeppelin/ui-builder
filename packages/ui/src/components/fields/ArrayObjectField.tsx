import { ChevronDown, ChevronRight, GripVertical, Plus, X } from 'lucide-react';
import React from 'react';
import { Controller, FieldValues, useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import type {
  ContractAdapter,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps } from './utils';

/**
 * ArrayObjectField component properties
 */
export interface ArrayObjectFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * The components/properties of each object in the array.
   * Defines the schema for the nested fields within each object item.
   */
  components?: FunctionParameter[]; // TODO: As above, review type for `components`.

  /**
   * Minimum number of array elements
   */
  minItems?: number;

  /**
   * Maximum number of array elements
   */
  maxItems?: number;

  /**
   * Render function for object properties.
   * This function is responsible for rendering each individual property
   * of an object within an array item.
   */
  // TODO: Explore a fallback rendering mechanism if `renderProperty` is not provided,
  // for known simple property types.
  renderProperty?: (
    field: FormFieldType,
    itemIndex: number,
    propertyName: string
  ) => React.ReactNode;

  /**
   * Whether items should be collapsible.
   * Useful for managing UI complexity when objects have many properties.
   */
  collapsible?: boolean;

  /**
   * Whether items should start collapsed.
   */
  defaultCollapsed?: boolean;

  /**
   * The adapter for chain-specific type mapping.
   * Essential for correctly determining field types for object properties.
   */
  adapter?: ContractAdapter;
}

/**
 * Array of objects input field component specifically designed for React Hook Form integration.
 *
 * This component provides a dynamic interface for managing arrays of composite objects with:
 * - Add/remove functionality for array items
 * - Structured rendering of object properties within each array item
 * - Collapsible items for better UX with complex objects
 * - Validation for array constraints and object properties (though individual property validation is largely via rendered component)
 * - Full accessibility support
 *
 * The component combines the functionality of ArrayField and ObjectField to handle
 * complex nested data structures commonly found in blockchain contracts.
 */
export function ArrayObjectField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  components = [],
  minItems = 0,
  maxItems,
  renderProperty,
  collapsible = true,
  defaultCollapsed = false,
  readOnly,
  adapter,
}: ArrayObjectFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Get form context for nested field registration
  const formContext = useFormContext();
  const effectiveControl = control || formContext.control;

  // Use useFieldArray for dynamic array management
  const { fields, append, remove } = useFieldArray({
    control: effectiveControl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
    // TODO: Investigate if stricter typing for `name` can be achieved here.
  });

  // Track collapsed state for each item
  const [collapsedItems, setCollapsedItems] = React.useState<Record<string, boolean>>(() => {
    // TODO: Initialize collapsedItems based on `fields` from useFieldArray if `defaultCollapsed`
    // needs to apply to dynamically added items after initial render.
    // Current initialization only covers items present on first render.
    // This might require a useEffect hook that syncs with `fields`.
    const initial: Record<string, boolean> = {};
    fields.forEach((field) => {
      initial[field.id] = defaultCollapsed;
    });
    return initial;
  });

  // Handle adding new array item
  const handleAddItem = (): void => {
    // Create default object based on components
    const defaultObject: Record<string, unknown> = {};
    components.forEach((component) => {
      // TODO: This default value logic is extensive.
      // 1. Consider moving to a utility function `generateDefaultObject(components: FunctionParameter[]): Record<string, unknown>`.
      // 2. For nested 'tuple' (objects), recursively call this utility to generate deeply nested default structures.
      //    Currently, `defaultObject[component.name] = {};` is a shallow empty object.
      // 3. Ensure consistency with any default value generation used elsewhere (e.g., in FormGenerator or core).
      if (component.type.includes('bool')) {
        defaultObject[component.name] = false;
      } else if (component.type.includes('int') || component.type.includes('uint')) {
        defaultObject[component.name] = 0; // Or perhaps '' to align with NumberField's initial controlled state?
      } else if (component.type.includes('[]')) {
        // Array types
        defaultObject[component.name] = [];
      } else if (component.type.startsWith('tuple')) {
        // Object/tuple types
        defaultObject[component.name] = {}; // TODO: Recursive default generation for nested tuples.
      } else {
        // Default for string and other types
        defaultObject[component.name] = '';
      }
    });

    // TODO: RHF's `append` type for nested field arrays is complex. `defaultObject` is Record<string, unknown>.
    // Casting to `any` here is a pragmatic approach if precisely matching RHF's expected generic type
    // (e.g., FieldArray<TFieldValues, TFieldName>[number]) proves too difficult for this dynamically built object.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    append(defaultObject as any);
  };

  // Toggle collapsed state for an item
  const toggleCollapsed = (fieldId: string): void => {
    setCollapsedItems((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  // Check if we can add more items
  const canAddMore = !maxItems || fields.length < maxItems;

  // Check if we can remove items
  const canRemove = fields.length > minItems;

  // TODO: For future enhancement, consider drag-and-drop reordering for array items.
  // TODO: Performance for very large arrays of complex objects. Virtualization might be needed.

  return (
    <Controller
      control={effectiveControl}
      name={name}
      rules={{
        // TODO: Similar to ArrayField, consider integration of custom validation functions.
        validate: (value) => {
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
        const accessibilityProps = getAccessibilityProps({
          id,
          hasError,
          isRequired,
          hasHelperText: !!helperText,
        });
        // TODO: Review aria-controls/aria-labelledby for the "Add Item" button and the list of items.

        return (
          <div
            className={`flex flex-col gap-4 ${width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3'}`}
            {...accessibilityProps}
            aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
          >
            {label && (
              <div className="flex items-center justify-between">
                <Label htmlFor={id}>
                  {label} {isRequired && <span className="text-destructive">*</span>}
                </Label>
              </div>
            )}

            <div className="space-y-3">
              {fields.length === 0 ? (
                <div className="text-muted-foreground text-sm py-4 text-center border border-dashed rounded-md">
                  No items added yet. Click &ldquo;Add Item&rdquo; to begin.
                </div>
              ) : (
                fields.map((field, index) => {
                  const isCollapsed = collapsedItems[field.id] ?? defaultCollapsed;

                  return (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {/* TODO: Aria attributes for GripVertical if it becomes interactive (drag handle). */}
                          <GripVertical className="size-4 text-muted-foreground" />
                          {collapsible && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCollapsed(field.id)}
                              className="p-0 h-auto"
                              aria-label={isCollapsed ? 'Expand item' : 'Collapse item'}
                              // TODO: Add aria-expanded={!isCollapsed} and aria-controls={`item-content-${field.id}`}
                            >
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {isCollapsed && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-2">
                              <CollapsedSummary
                                name={name}
                                index={index}
                                components={components}
                                control={effectiveControl}
                              />
                            </div>
                          )}
                        </div>
                        {!readOnly && canRemove && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-4 mt-4">
                          {((): React.ReactNode[] => {
                            return components.map((component) => {
                              // Generate field using adapter to get full configuration including elementType for arrays
                              if (!adapter) {
                                throw new Error(
                                  `ArrayObjectField: No adapter provided for field generation. Cannot generate field for "${component.name}"`
                                );
                              }

                              const generatedField = adapter.generateDefaultField(component);

                              // Override with array object-specific configuration
                              const propertyField: FormFieldType = {
                                ...generatedField, // Include elementType and other adapter-specific properties
                                id: `${id}-${index}-${component.name}`,
                                name: `${name}.${index}.${component.name}`,
                                label: component.displayName || component.name,
                                validation: {
                                  // TODO: This makes each property required if the parent array item's object is considered required.
                                  // Re-evaluate if this is the desired behavior or if properties should have independent required flags.
                                  required: validation?.required,
                                },
                                placeholder: `Enter ${component.displayName || component.name}`,
                                helperText:
                                  component.description ||
                                  (generatedField.type === 'number' ? 'Numbers only' : undefined),
                                width: 'full',
                                readOnly,
                                // Pass components for nested objects
                                ...(component.components && {
                                  components: component.components,
                                }),
                                // TODO: Consider passing `adapter` down to nested `propertyField` if it's an object/array-object.
                              };

                              return (
                                <div key={component.name}>
                                  {renderProperty ? (
                                    renderProperty(propertyField, index, component.name)
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      Property &ldquo;{component.name}&rdquo; requires a render
                                      function
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Add Item button */}
            {!readOnly && canAddMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-1 w-full sm:w-auto"
              >
                {/* TODO: Add aria-live region or other announcement for item add/remove. */}
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            )}

            {helperText && (
              <div id={descriptionId} className="text-muted-foreground text-sm">
                {helperText}
              </div>
            )}
            <ErrorMessage error={error} id={errorId} />
          </div>
        );
      }}
    />
  );
}

/**
 * Component to display collapsed item summary
 * TODO: This component is quite specific to ArrayObjectField.
 * If similar summaries are needed elsewhere, consider making it more generic
 * or moving it to a shared utils/components location.
 */
function CollapsedSummary({
  name,
  index,
  components,
  control,
}: {
  name: string;
  index: number;
  components: FunctionParameter[];
  control: FieldValues['control']; // TODO: useFormContext<TFieldValues>['control'] for better type safety if possible
}): React.ReactElement {
  // Watch all values for this item
  // TODO: `useWatch` can be performance-intensive if the object is large and updates frequently.
  // If performance issues arise, consider optimizing what's watched or how often.
  const itemValues = useWatch({
    control,
    name: `${name}.${index}`, // Watch the entire object at this index
  });

  const summaryItems = components
    .slice(0, 3)
    .map((component) => {
      const fieldValue = itemValues?.[component.name];
      const displayValue =
        fieldValue !== undefined && fieldValue !== '' && fieldValue !== 0 && fieldValue !== false
          ? String(fieldValue).length > 20
            ? `${String(fieldValue).substring(0, 20)}...`
            : String(fieldValue)
          : null;

      return displayValue ? (
        <span key={component.name} className="flex items-center gap-1">
          <span className="font-medium">{component.displayName || component.name}:</span>
          <span className="text-foreground">{displayValue}</span>
        </span>
      ) : null;
    })
    .filter(Boolean);

  const isEmpty =
    !itemValues ||
    Object.values(itemValues).every(
      (value) => value === undefined || value === '' || value === 0 || value === false
    );

  if (isEmpty && summaryItems.length === 0) {
    // Ensure we don't show "Empty item" if summaryItems has content
    return <span className="italic">Empty item</span>;
  }

  return (
    <>
      {summaryItems.length > 0 ? (
        summaryItems
      ) : (
        <span className="italic">Item has values (not shown in summary)</span>
      )}
      {/* TODO: The "+ X more" count should be accurate based on total properties vs. shown in summary.
          If summaryItems is empty but the item is not (due to values not fitting summary criteria),
          this count might be misleading.
          Consider `components.length - (actually displayed count in summaryItems)`
      */}
      {components.length > 3 &&
        summaryItems.length < components.length && ( // Only show "more" if not all are summarized or could be summarized
          <span className="text-xs">+{components.length - summaryItems.length} more</span>
        )}
    </>
  );
}

// Set display name for debugging
ArrayObjectField.displayName = 'ArrayObjectField';
