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
 * Your custom input field component specifically designed for React Hook Form integration.
 *
 * @important This component is part of the form rendering system architecture and should
 * ONLY be used within the DynamicFormField → TransactionForm system, not as a standalone component.
 */
export const YourNewField = forwardRef(function YourNewField<
  TFieldValues extends FieldValues = FieldValues,
>(
  { validateCustom, ...baseProps }: YourNewFieldProps<TFieldValues>,
  ref: ForwardedRef<HTMLInputElement> // Adjust the ref type as needed
): ReactElement {
  const { setError, clearErrors } = useFormContext();

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
          }}
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

## Step 6: Test Your Field Component

Create tests for your new field component to ensure it works correctly:

1. Test rendering with different props
2. Test validation logic
3. Test integration with form context
4. Test error handling

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
