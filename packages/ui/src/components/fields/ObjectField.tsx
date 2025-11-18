import React from 'react';
import { Control, Controller, FieldValues, useFormContext } from 'react-hook-form';

import type {
  ContractAdapter,
  ContractSchema,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';

// TODO: Consider if FunctionParameter is the most appropriate type for `components` here,
// or if a UI-specific version of a component/property definition would be more robust.

import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps } from './utils';

/**
 * ObjectField component properties
 */
export interface ObjectFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * The components/properties of the object.
   * These define the schema for the nested fields within the object.
   */
  components?: FunctionParameter[]; // TODO: As above, review type for `components`.

  /**
   * Render function for object properties.
   * This is crucial for rendering complex properties or integrating custom field components.
   */
  // TODO: Explore a fallback rendering mechanism if `renderProperty` is not provided,
  // especially for known simple property types (e.g., 'text', 'number').
  // This could make the component more self-contained for basic object structures.
  renderProperty?: (field: FormFieldType, propertyName: string) => React.ReactNode;

  /**
   * Whether to show the object in a card container.
   * Useful for visually grouping object properties.
   */
  // TODO: Consider more advanced layout options beyond a simple card,
  // e.g., tabs, accordions for very complex objects, or grid layouts.
  showCard?: boolean;

  /**
   * The adapter for chain-specific type mapping.
   * Essential for correctly determining field types for object properties.
   */
  adapter?: ContractAdapter;

  /**
   * Optional contract schema for nested metadata (structs/enums).
   */
  contractSchema?: ContractSchema;
}

/**
 * Object (composite/nested) input field component specifically designed for React Hook Form integration.
 *
 * This component provides a structured interface for managing object inputs with:
 * - Nested field rendering based on object components
 * - Validation for required properties (currently, the object itself can be required)
 * - Integration with existing field components for object properties
 * - Full accessibility support
 *
 * The component reuses existing field components for individual properties,
 * maintaining consistency across the form system while supporting complex nested structures.
 */
export function ObjectField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  components = [],
  renderProperty,
  showCard = true,
  readOnly,
  adapter,
  contractSchema,
}: ObjectFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Get form context for nested field registration
  const formContext = useFormContext();
  const effectiveControl = control || formContext.control;

  // TODO: Consider performance implications for very large/deeply nested objects.
  // For extremely complex objects, virtualization or other rendering strategies might be needed.

  return (
    <Controller
      control={effectiveControl as Control<FieldValues>}
      name={name}
      rules={{
        // TODO: Expand validation capabilities for objects.
        // Current validation only checks if the object itself is required.
        // Future: Allow schema-level validation for individual properties within the object,
        // or a custom validate function that receives the whole object value.
        validate: (value) => {
          // Validate object constraints
          if (
            validation?.required &&
            (!value || typeof value !== 'object' || Array.isArray(value))
          ) {
            return 'This field is required';
          }

          // Additional object validation can be added here (e.g., based on `components` schema)
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

        const content = (
          <>
            {/* Object properties */}
            <div className="space-y-4">
              {components.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No properties defined for this object
                </div>
              ) : (
                components.map((component) => {
                  // Generate field using adapter to get full configuration including elementType for arrays
                  if (!adapter) {
                    throw new Error(
                      `ObjectField: No adapter provided for field generation. Cannot generate field for "${component.name}"`
                    );
                  }

                  const generatedField = adapter.generateDefaultField(component, contractSchema);

                  // Override with object-specific configuration
                  const propertyField: FormFieldType = {
                    ...generatedField, // Include elementType and other adapter-specific properties
                    id: `${id}-${component.name}`,
                    name: `${name}.${component.name}`,
                    label: component.displayName || component.name,
                    // Validation merging precedence:
                    // 1. Spread generatedField.validation (adapter-provided bounds, etc.)
                    // 2. Override 'required' from parent validation if specified
                    // This preserves min/max bounds while allowing parent to control required state
                    validation: {
                      ...generatedField.validation, // Preserve validation from adapter (includes min/max bounds)
                      required: validation?.required, // Override required from parent
                    },
                    placeholder: `Enter ${component.displayName || component.name}`,
                    helperText:
                      component.description ||
                      (generatedField.type === 'number' ? 'Numbers only' : undefined),
                    width: 'full',
                    readOnly,
                    // Pass components for nested objects (tuples within a struct)
                    ...(component.components && {
                      components: component.components,
                    }),
                  };

                  return (
                    <div key={component.name}>
                      {renderProperty ? (
                        renderProperty(propertyField, component.name)
                      ) : (
                        // This fallback is okay, but a more robust solution might attempt to
                        // render a default UI field based on `propertyField.type` if it's a known simple type.
                        <div className="text-sm text-muted-foreground">
                          Property &ldquo;{component.name}&rdquo; requires a render function
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Helper text for the entire object */}
            {helperText && (
              <div id={descriptionId} className="text-muted-foreground text-sm mt-2">
                {helperText}
              </div>
            )}

            {/* Error message for the entire object */}
            <ErrorMessage error={error} id={errorId} />
          </>
        );

        return (
          <div
            className={`flex flex-col gap-2 ${width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3'}`}
            {...accessibilityProps}
            aria-describedby={`${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`}
          >
            {/* Label for the entire object */}
            {label && (
              <Label htmlFor={id}>
                {label} {isRequired && <span className="text-destructive">*</span>}
              </Label>
            )}

            {/* TODO: Conditional rendering of Card based on `showCard` and `components.length`.
                Perhaps don't render a card if there are no components or if showCard is false.
                Currently, an empty card might be rendered if components is empty but showCard is true. */}
            {showCard ? <Card className="p-4">{content}</Card> : content}
          </div>
        );
      }}
    />
  );
}

// Set display name for debugging
ObjectField.displayName = 'ObjectField';
