# Adding New Field Components

This document outlines the step-by-step process for adding new field components to the Transaction Form Builder system.

## Architecture Overview

The form system follows a layered architecture:

1. **TransactionForm**: Top-level form renderer
2. **DynamicFormField**: Selects appropriate field component based on field type
3. **Field Components**: Type-specific field components (TextField, NumberField, etc.)
4. **BaseField**: Common field structure shared by all field components

## Step 1: Define Field Type

Add your new field type to the `FieldType` union in `src/types/FormTypes.ts`:

```typescript
export type FieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  // ... existing types
  | 'your-new-field-type'; // Add your new field type here
```

## Step 2: Create Field Component

Create a new file named `YourNewField.tsx` in the `components/fields` directory:

```typescript
import { type ForwardedRef, forwardRef, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import { InputComponent } from '../ui'; // Import the UI component you need

import { BaseField, type BaseFieldProps } from './BaseField';
import { getAccessibilityProps } from './utils/accessibility';
// Import other keyboard handlers as needed, for example:
// import { handleEscapeKey, handleNumericKeys, handleToggleKeys } from './utils/accessibility';

/**
 * YourNewField component properties
 */
export interface YourNewFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Custom validation function for your specific value type
   */
  validateCustom?: (value: YourValueType) => boolean | string;

  // Add other field-specific props here
}

/**
 * Your custom input field component.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles field-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - Field-specific validation
 * - Customizable validation through adapter integration
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export const YourNewField = forwardRef(function YourNewField<
  TFieldValues extends FieldValues = FieldValues,
>(
  { validateCustom, ...baseProps }: YourNewFieldProps<TFieldValues>,
  ref: ForwardedRef<HTMLInputElement> // Adjust the ref type as needed
): ReactElement {
  const { setError, clearErrors, formState } = useFormContext();
  const hasError = !!formState.errors[baseProps.name];

  // Determine if the field is required based on validation rules
  const isRequired = !!baseProps.validation?.required;

  return (
    <BaseField
      {...baseProps}
      renderInput={(field, { id }) => (
        <InputComponent
          {...field}
          ref={ref}
          id={id}
          placeholder={baseProps.placeholder}
          data-slot="input"
          // Apply accessibility attributes
          {...getAccessibilityProps({
            id,
            hasError,
            isRequired,
            hasHelperText: !!baseProps.helperText,
          })}
          onChange={(e) => {
            const value = e.target.value; // Adjust based on your input type

            // Call the original onChange from React Hook Form
            if (typeof field.onChange === 'function') {
              field.onChange(value);
            }

            // Run custom validation if provided
            if (validateCustom && value) {
              const validation = validateCustom(value);
              if (validation !== true && typeof validation === 'string') {
                setError(baseProps.name, {
                  type: 'custom',
                  message: validation,
                });
                return; // Stop validation chain if custom validation fails
              }
            }

            // Add field-specific validation logic here

            // If we reach here, all validations passed
            clearErrors(baseProps.name);
          }}
          onBlur={() => {
            if (typeof field.onBlur === 'function') {
              field.onBlur();
            }

            // Optional: Run final validation on blur
          }}
          // Add appropriate keyboard handlers for accessibility
          // Example for text-like inputs:
          // onKeyDown={handleEscapeKey(
          //   (value) => {
          //     if (typeof field.onChange === 'function') {
          //       field.onChange(value);
          //     }
          //   },
          //   field.value
          // )}
        />
      )}
    />
  );
});

// Set displayName manually for better debugging
YourNewField.displayName = 'YourNewField';
```

## Step 3: Export Your Field Component

Add your new field component to the `index.ts` file in the `components/fields` directory:

```typescript
/**
 * Form Field Components
 */

export * from './AddressField';
export * from './BooleanField';
export * from './NumberField';
export * from './TextField';
export * from './YourNewField'; // Add your field export here
// Other field exports will be added as they are created
```

## Step 4: Register Field Component

Update the `fieldComponents` registry in `DynamicFormField.tsx`:

```typescript
const fieldComponents: Record<FieldType, React.ComponentType<BaseFieldProps<FormValues>>> = {
  text: TextField,
  number: NumberField,
  address: AddressField,
  checkbox: BooleanField,
  // ... existing field components
  'your-new-field-type': YourNewField, // Add your new field component here
};
```

## Step 5: Add Field-Specific Validation

Implement any field-specific validation logic in your component. Common patterns include:

1. **Custom validation function**: Use `validateCustom` prop
2. **Built-in validation**: Add specific validation for your field type
3. **Error handling**: Use `setError` and `clearErrors` from `useFormContext`

## Step 6: Ensure Accessibility

Ensure your field component follows accessibility best practices:

1. Use the `getAccessibilityProps` utility to add ARIA attributes:

```typescript
{...getAccessibilityProps({
  id,
  hasError,
  isRequired,
  hasHelperText: !!baseProps.helperText,
})}
```

2. Add appropriate keyboard handlers for your field type:

- For text inputs: Use `handleEscapeKey` to clear the input with Escape key
- For numeric inputs: Use `handleNumericKeys` to increment/decrement with arrow keys
- For toggle inputs: Use `handleToggleKeys` to toggle with Space/Enter keys

Example:

```typescript
// For text fields
onKeyDown={handleEscapeKey(
  (value) => {
    if (typeof field.onChange === 'function') {
      field.onChange(value);
    }
  },
  field.value
)}

// For numeric fields
onKeyDown={(e) => {
  // Handle Escape key
  if (e.key === 'Escape') {
    handleEscapeKey(
      (value) => {
        if (typeof field.onChange === 'function') {
          field.onChange(value === '' ? null : value);
        }
      },
      field.value
    )(e);
    return;
  }

  // Handle arrow keys for increment/decrement
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    handleNumericKeys(
      (newValue) => {
        if (typeof field.onChange === 'function') {
          field.onChange(newValue);
        }
      },
      typeof field.value === 'number' ? field.value : 0,
      step,
      min,
      max
    )(e);
  }
}}

// For boolean/toggle fields
onKeyDown={handleToggleKeys(
  (value) => {
    if (typeof field.onChange === 'function') {
      field.onChange(value);
    }
  },
  !!field.value
)}
```

3. Ensure proper focus management for complex fields

## Step 7: Test Your Field Component

Testing your field component is crucial to ensure it integrates properly with the form system:

1. Test with various validation rules
2. Test error handling and reporting
3. Test keyboard navigation and accessibility
4. Test integration with React Hook Form's control and watch functionality

## Field Component Checklist

- [ ] Extended BaseFieldProps with field-specific props
- [ ] Implemented proper validation logic
- [ ] Forwarded ref correctly
- [ ] Handled onChange and onBlur events
- [ ] Set proper displayName for debugging
- [ ] Exported component in index.ts
- [ ] Registered component in fieldComponents registry
- [ ] Documented component with JSDoc comments
- [ ] Added tests for the component

## Best Practices

1. **Follow existing patterns**: Look at similar field components for guidance
2. **Keep validation close to input**: Implement field-specific validation in the component
3. **Use proper types**: Ensure type safety with TypeScript
4. **Document thoroughly**: Add JSDoc comments to describe your component
5. **Build on BaseField**: Use BaseField for consistent layout and form integration
6. **Keep it focused**: Each field component should only handle one specific field type
7. **Maintain accessibility**: Ensure proper ARIA attributes and keyboard navigation
