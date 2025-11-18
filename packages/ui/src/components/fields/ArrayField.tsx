import { GripVertical, Plus, X } from 'lucide-react';
import React from 'react';
import { Controller, FieldValues, useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import type { FormFieldType } from '@openzeppelin/ui-builder-types';

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
 *
 * Why the extra guards and synchronization exist (post-mortem/rationale):
 * - In certain runtime states (StrictMode double-invocation, preview remounts, state rehydration
 *   from storage), React Hook Form's useFieldArray may not synchronously reflect an `append()`
 *   or `remove()` call in the immediately subsequent read (e.g., reading `fields.length` or
 *   `getValues(name)` right after the call). This resulted in newly added items (especially
 *   falsy defaults like 0/false) appearing briefly and then disappearing, or remove operations
 *   not updating the UI.
 * - To make array operations deterministic and resilient across flows (preview form with
 *   FormProvider and the wizard's "Use Hardcoded Value" without a provider), we:
 *   1) Read a stable snapshot of the array value BEFORE `append()` and, if the immediate
 *      post-append read doesn't reflect the addition, we coerce the state to
 *      "previousSnapshot + newValue" via `setValue` (when context exists) or `replace`.
 *   2) Avoid `remove()` race conditions by always computing the new array via filter and
 *      applying it with `replace`, which proved to be the most consistent across contexts.
 *   3) Keep `fields` in sync with the watched array value using a guarded `replace` in an effect.
 *      A ref flag (`isReplacingRef`) prevents infinite loops when we ourselves are driving
 *      the `replace`.
 *   4) Use optional chaining for form context (`formContext?.control`, `formContext?.getValues`,
 *      `formContext?.setValue`) so the component works with either an inherited FormProvider or
 *      an explicit `control` prop.
 *   5) Use `queueMicrotask` to reset the guard flag after our `replace` has been scheduled,
 *      avoiding an extra timer tick while ensuring the effect observes the final state.
 *
 * Guarantees:
 * - Operations are idempotent: the fallback only runs when the immediate read does not reflect
 *   the intended state, so we don't double-append/remove.
 * - Works both with and without FormProvider (preview vs wizard) due to context-agnostic state
 *   reads and `replace` fallback.
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
  readOnly,
}: ArrayFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Get form context for nested field registration (may be absent in some builder flows)
  const formContext = useFormContext();

  // Use useFieldArray for dynamic array management
  const { fields, append, replace } = useFieldArray({
    control: control || formContext?.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: name as any, // Type assertion needed due to generic constraints
    // TODO: Investigate if stricter typing for `name` can be achieved to avoid `as any`
    // with react-hook-form's useFieldArray and deeply nested field names.
  });

  // Watch current array value in a context-agnostic way (works with provided control)
  const rawWatchedArray = useWatch({ control: control || formContext?.control, name }) as
    | unknown[]
    | undefined;
  const watchedArrayValue = React.useMemo<unknown[]>(() => {
    return Array.isArray(rawWatchedArray) ? rawWatchedArray : [];
  }, [rawWatchedArray]);

  // Ensure field array is synchronized with current value length on mount/reset
  // Keep field array synchronized with watched values, but prevent infinite loops
  const isReplacingRef = React.useRef(false);
  React.useEffect(() => {
    if (isReplacingRef.current) {
      // Skip sync if we're in the middle of a replace operation
      return;
    }

    if (Array.isArray(watchedArrayValue) && fields.length !== watchedArrayValue.length) {
      isReplacingRef.current = true;
      replace(watchedArrayValue as unknown as never);

      // Reset the flag in a microtask to allow the replace to complete without a timer tick
      queueMicrotask(() => {
        isReplacingRef.current = false;
      });
    }
  }, [fields.length, watchedArrayValue, replace]);

  // Note: Structural changes are observed via useWatch and the sync effect above; no additional tracking needed here.

  // Handle removing an array item with fallback for stale reads
  const handleRemoveItem = (index: number): void => {
    const valuesBeforeRemove = Array.isArray(watchedArrayValue)
      ? (watchedArrayValue as unknown[])
      : ([] as unknown[]);

    // Always use the fallback approach for remove to ensure consistency
    const updatedArray = valuesBeforeRemove.filter((_, i) => i !== index);

    // Set flag to prevent sync loop during manual replace
    isReplacingRef.current = true;
    replace(updatedArray as unknown as never);

    // Reset flag after operation
    queueMicrotask(() => {
      isReplacingRef.current = false;
    });
  };

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

    // Background and rationale:
    // In certain runtime states (e.g., preview remounts, incidental resets, StrictMode double-invocations),
    // an immediate read right after useFieldArray.append(...) can be stale and still reflect the
    // pre-append array. This manifested as a user-visible bug where adding an item (notably value 0)
    // either did nothing or briefly appeared and then disappeared.
    //
    // To make the operation deterministic, we snapshot the array BEFORE calling append and then
    // verify that the length actually increased. If not, we force-set the array using the snapshot
    // plus the new value. This is safe and idempotent because it only runs when the immediate read
    // did not reflect the append; it does not double-append.

    // Set flag to prevent sync interference during add operation
    isReplacingRef.current = true;

    const fieldsBeforeAppend = fields.length;
    const valuesBeforeAppend = Array.isArray(watchedArrayValue)
      ? (watchedArrayValue as unknown[])
      : ([] as unknown[]);

    append(defaultValue as FieldValues[typeof name]);

    // Verify append actually reflected in form state; if not, force set
    const afterAppendFieldsCount =
      (formContext?.getValues?.(name) as unknown[] | undefined)?.length ?? fields.length;

    // Fallback: if the immediate read did not reflect the append, coerce to
    // "previous snapshot + new value" so the UI consistently renders the new item.
    if (afterAppendFieldsCount <= fieldsBeforeAppend) {
      const baseArray = Array.isArray(valuesBeforeAppend)
        ? (valuesBeforeAppend as unknown[])
        : ([] as unknown[]);
      const coercedArray = [...baseArray, defaultValue] as unknown[];

      if (formContext?.setValue) {
        formContext.setValue(name as never, coercedArray as never, {
          shouldDirty: true,
          shouldTouch: true,
        });
      } else {
        // No form context (e.g., builder hardcoded flow). Use useFieldArray.replace to force state.
        replace(coercedArray as unknown as never);
      }
    }

    // Reset flag after operation completes
    queueMicrotask(() => {
      isReplacingRef.current = false;
    });
  };

  // Check if we can add more items
  const canAddMore = !maxItems || fields.length < maxItems;

  // Check if we can remove items
  const canRemove = fields.length > minItems;

  // TODO: For future enhancement, consider adding drag-and-drop reordering functionality for array items.
  // The GripVertical icon hints at this, but implementation would require additional libraries/logic.

  return (
    <Controller
      control={control || formContext?.control}
      name={name}
      rules={{
        // TODO: Consider if custom validation functions passed via `validation.validate` prop
        // should also be callable here, in addition to these built-in length checks.
        validate: (value) => {
          // Validate array constraints
          if (validation?.required && (!Array.isArray(value) || value.length === 0)) {
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
                  // Spread elementFieldConfig first to preserve all properties (including enumMetadata, components)
                  const elementField: FormFieldType = {
                    ...elementFieldConfig, // Include all props from config (enumMetadata, components, etc.)
                    id: field.id, // Use RHF field.id for stable, unique keys per item
                    name: `${name}.${index}`, // RHF name for the element
                    label: elementFieldConfig?.label || '', // Label for the element's field (can be empty if not desired)
                    type: elementFieldConfig?.type || elementType, // Prefer elementFieldConfig.type if available
                    validation: elementFieldConfig?.validation || {},
                    placeholder: elementFieldConfig?.placeholder,
                    helperText: elementFieldConfig?.helperText,
                    width: 'full', // Typically, elements take full width within their row
                    readOnly: elementFieldConfig?.readOnly ?? readOnly, // Inherit readOnly from parent
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
                      {!readOnly && canRemove && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
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
            {!readOnly && canAddMore && (
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
