import React from 'react';
import { Control, useWatch } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import {
  FieldCondition,
  FormFieldType,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';

import { fieldComponents } from './fieldRegistry';

// Import the shared registry

/**
 * Props for the DynamicFormField component
 */
interface DynamicFormFieldProps {
  /**
   * The field configuration to render
   */
  field: FormFieldType;

  /**
   * The React Hook Form control
   */
  control: Control<FormValues>;

  /**
   * The adapter for chain-specific validation and formatting
   */
  adapter: ContractAdapter;

  /**
   * The field error message, if any (Kept for potential direct use, though RHF handles it)
   */
  error?: string;
}

/**
 * Evaluates whether a field should be rendered based on its visibility conditions
 */
function useShouldRenderField(field: FormFieldType, control: Control<FormValues>): boolean {
  // Use React Hook Form's useWatch to get the values of form fields
  // This will reactively update when form values change
  const formValues = useWatch({ control });

  // If the field is explicitly hidden, don't render it
  if (field.isHidden) {
    return false;
  }

  // If there are no visible conditions, always render
  if (!field.visibleWhen) {
    return true;
  }

  // Convert single condition to array for consistent processing
  const conditions: FieldCondition[] = Array.isArray(field.visibleWhen)
    ? field.visibleWhen
    : [field.visibleWhen];

  // Check if all conditions are met
  return conditions.every((condition) => {
    const dependentValue = formValues[condition.field];

    switch (condition.operator) {
      case 'equals':
        return dependentValue === condition.value;
      case 'notEquals':
        return dependentValue !== condition.value;
      case 'contains':
        return String(dependentValue).includes(String(condition.value || ''));
      case 'greaterThan':
        return Number(dependentValue) > Number(condition.value || 0);
      case 'lessThan':
        return Number(dependentValue) < Number(condition.value || 0);
      case 'matches':
        if (typeof condition.value === 'string') {
          const regex = new RegExp(condition.value);
          return regex.test(String(dependentValue || ''));
        }
        return false;
      default:
        return true;
    }
  });
}

/**
 * Dynamic Form Field Component
 *
 * Renders the appropriate field component based on the field type defined in the form schema.
 * This component is part of the app rendering system architecture where:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. The schemas are rendered using the TransactionForm component
 * 3. TransactionForm uses DynamicFormField to render appropriate field components based on the schema
 *
 * The field components (TextField, NumberField, AddressField, etc.) are specifically designed
 * for React Hook Form integration and should not be used as standalone components.
 *
 * @returns The rendered form field component or null if the field should not be visible
 */
export function DynamicFormField({
  field,
  control,
  adapter,
}: DynamicFormFieldProps): React.ReactElement | null {
  // Check if the field should be rendered based on visibility conditions
  const shouldRender = useShouldRenderField(field, control);
  if (!shouldRender) {
    return null;
  }

  // Get the appropriate component for this field type from the registry
  const FieldComponent = fieldComponents[field.type];

  // If no component is registered for this field type, log a warning and return null
  if (!FieldComponent) {
    console.warn(`DynamicFormField: No component registered for field type: ${field.type}`);
    return null;
  }

  // Get field-specific props based on type
  const fieldSpecificProps = getFieldSpecificProps(field);

  // Add render functions for complex fields
  const enhancedProps = {
    ...fieldSpecificProps,
    // For array fields, provide a render function for elements
    ...(field.type === 'array' && {
      renderElement: (elementField: FormFieldType, index: number): React.ReactElement => (
        <DynamicFormField
          key={`${field.id}-element-${index}`}
          field={{
            ...elementField,
            // Inherit isReadOnly from parent field
            isReadOnly: elementField.isReadOnly ?? field.isReadOnly,
          }}
          control={control}
          adapter={adapter}
        />
      ),
    }),
    // For object fields, provide a render function for properties
    ...(field.type === 'object' && {
      renderProperty: (propertyField: FormFieldType, propertyName: string): React.ReactElement => (
        <DynamicFormField
          key={`${field.id}-property-${propertyName}`}
          field={{
            ...propertyField,
            // Inherit isReadOnly from parent field
            isReadOnly: propertyField.isReadOnly ?? field.isReadOnly,
          }}
          control={control}
          adapter={adapter}
        />
      ),
    }),
    // For array-object fields, provide a render function for properties
    ...(field.type === 'array-object' && {
      renderProperty: (
        propertyField: FormFieldType,
        itemIndex: number,
        propertyName: string
      ): React.ReactElement => (
        <DynamicFormField
          key={`${field.id}-item-${itemIndex}-property-${propertyName}`}
          field={{
            ...propertyField,
            // Inherit isReadOnly from parent field
            isReadOnly: propertyField.isReadOnly ?? field.isReadOnly,
          }}
          control={control}
          adapter={adapter}
        />
      ),
    }),
  };

  // Pass all necessary props directly to the field component
  // Each specific field component knows how to handle its own props based on field type
  return (
    <FieldComponent
      id={field.id}
      label={field.label}
      placeholder={field.placeholder}
      helperText={field.helperText}
      width={field.width}
      validation={field.validation}
      control={control as unknown as Control<FormValues>}
      name={field.name}
      adapter={adapter}
      isReadOnly={field.isReadOnly}
      {...enhancedProps}
    />
  );
}

/**
 * Extract field-specific props based on field type
 */
function getFieldSpecificProps(field: FormFieldType): Record<string, unknown> {
  switch (field.type) {
    case 'number':
      // Extract number-specific props from validation
      return {
        min: field.validation?.min,
        max: field.validation?.max,
        step: field.options?.find((opt) => opt.label === 'step')?.value,
      };
    case 'array':
      // Extract array-specific props
      return {
        elementType: field.elementType || 'text',
        minItems: field.validation?.min,
        maxItems: field.validation?.max,
        elementFieldConfig: field.elementFieldConfig,
      };
    case 'object':
      // Extract object-specific props
      return {
        components: field.components || [],
        showCard: true,
      };
    case 'array-object':
      // Extract array-object-specific props
      const components = field.components || [];

      return {
        components,
        minItems: field.validation?.min,
        maxItems: field.validation?.max,
        collapsible: true,
        defaultCollapsed: false,
      };
    case 'blockchain-address':
      // Add address-specific props
      return {};
    case 'checkbox':
      // Add checkbox-specific props
      return {};
    default:
      return {};
  }
}
