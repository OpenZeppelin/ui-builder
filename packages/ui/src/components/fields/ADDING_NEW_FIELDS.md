# Adding New Field Components

This document outlines the step-by-step process for adding new field components to the Contracts UI Builder system.

## Architecture Overview

The form system follows a layered architecture:

1. **TransactionForm**: Top-level renderer
2. **DynamicFormField**: Selects appropriate field component based on field type
3. **Field Components**: Type-specific field components (TextField, NumberField, etc.)
4. **UI Components**: Radix UI based components
5. **BaseField**: Common field structure shared by all field components

## Key Design Principles

1. **Use Radix UI Primitives**: All form components should be built with Radix UI primitives for accessibility and consistency
2. **Consistent Form Patterns**: Follow existing field component patterns for consistency (Renumbered)
3. **Accessibility First**: Ensure all components are fully accessible with proper ARIA attributes (Renumbered)

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

## Step 2: Create UI Component (If Needed)

If your field requires a new UI component not already available, create it first using Radix UI primitives:

```typescript
// packages/renderer/src/components/ui/your-component.tsx

import * as React from 'react';
import * as YourPrimitive from '@radix-ui/react-your-primitive';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

const YourComponent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof YourPrimitive.Root>
>(({ className, ...props }, ref) => (
  <YourPrimitive.Root
    ref={ref}
    className={cn(className)} // Only use className for external customization
    {...props}
  />
));
YourComponent.displayName = YourPrimitive.Root.displayName;

export { YourComponent };
```

## Step 3: Create Field Component

Create a new file named `YourNewField.tsx` in the `components/fields` directory:

```typescript
import React from 'react';
import { FieldValues, Controller, FieldPath } from 'react-hook-form';
import { BaseFieldProps } from './BaseField';
import { YourComponent } from '../ui/your-component';
import { Label } from '../ui/label';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

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
 */
export function YourNewField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder,
  helperText,
  control,
  name,
  width = 'full',
  validation,
  validateCustom,
}: YourNewFieldProps<TFieldValues>): React.ReactElement {
  const isRequired = !!validation?.required;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  // Determine width values
  const widthPercentage = width === 'full' ? '100%' : width === 'half' ? '50%' : '33.333%';
  const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3';

  return (
    <div className={cn('flex flex-col gap-2', widthClass)} style={{ width: widthPercentage }}>
      {label && (
        <Label htmlFor={id}>
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        rules={{
          validate: (value) => {
            // Handle required validation explicitly
            if (value === undefined || value === null || value === '') {
              return validation?.required ? 'This field is required' : true;
            }

            // Run custom validation if provided
            if (validateCustom && value) {
              const validation = validateCustom(value);
              if (validation !== true && typeof validation === 'string') {
                return validation;
              }
            }

            return true;
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const hasError = !!error;

          // Get accessibility attributes
          const accessibilityAttrs = {
            'aria-invalid': hasError,
            'aria-required': isRequired,
            'aria-describedby': `${helperText ? descriptionId : ''} ${hasError ? errorId : ''}`.trim(),
          };

          return (
            <>
              <YourComponent
                id={id}
                {...field}
                {...accessibilityAttrs}
              />

              {/* Display helper text */}
              {helperText && (
                <div id={descriptionId}>
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              {error && (
                <div id={errorId}>
                  {error.message}
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
}

// Set displayName manually for better debugging
YourNewField.displayName = 'YourNewField';
```

## Step 4: Export Your Field Component

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

## Step 5: Register Field Component

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

## Step 6: Accessibility Guidelines

Ensure your field component follows accessibility best practices:

1. **Use proper ARIA attributes**: Always include aria-invalid, aria-required, and aria-describedby
2. **Connect labels with inputs**: Use htmlFor attribute on labels matched with id on inputs
3. **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
4. **Focus management**: Properly handle focus states with focus indicators
5. **Screen reader support**: Ensure all content is accessible to screen readers

## Step 7: Test Your Field Component

Testing your field component is crucial to ensure it integrates properly with the form system:

1. **Test with Storybook**: Create stories for all field states (default, error, disabled, etc.)
2. **Test with various validation rules**: Ensure validation works correctly
3. **Test error handling and reporting**: Verify error messages display correctly
4. **Test keyboard navigation and accessibility**: Ensure the field is accessible
5. **Test integration with React Hook Form**: Verify form state updates correctly

## Field Component Checklist

- [ ] Extended BaseFieldProps with field-specific props
- [ ] Implemented proper validation logic
- [ ] Set proper displayName for debugging
- [ ] Exported component in index.ts
- [ ] Registered component in fieldComponents registry
- [ ] Added Storybook stories for the component
- [ ] Ensured full accessibility compliance

## Example: Creating a SelectField

Here's an example of creating a SelectField:

1. Create the UI component (e.g., using Radix UI):

   ```tsx
   // packages/renderer/src/components/ui/select.tsx
   import * as SelectPrimitive from '@radix-ui/react-select';

   import * as React from 'react';

   import { cn } from '@openzeppelin/contracts-ui-builder-utils';

   // packages/renderer/src/components/ui/select.tsx

   const Select = SelectPrimitive.Root;

   const SelectTrigger = React.forwardRef<
     HTMLButtonElement,
     React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
   >(({ className, children, ...props }, ref) => (
     <SelectPrimitive.Trigger ref={ref} className={cn(className)} {...props}>
       {children}
     </SelectPrimitive.Trigger>
   ));

   const SelectContent = React.forwardRef<
     React.ElementRef<typeof SelectPrimitive.Content>,
     React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
   >(({ className, children, position = 'popper', ...props }, ref) => (
     <SelectPrimitive.Portal>
       <SelectPrimitive.Content ref={ref} className={cn(className)} position={position} {...props}>
         {children}
       </SelectPrimitive.Content>
     </SelectPrimitive.Portal>
   ));

   // ... other Select components

   export { Select, SelectTrigger, SelectContent /* ...etc */ };
   ```

2. Create the field component incorporating the UI component:

   ```tsx
   // packages/renderer/src/components/fields/SelectField.tsx
   import React from 'react';
   import { Controller, FieldValues } from 'react-hook-form';

   import { cn } from '@openzeppelin/contracts-ui-builder-utils';

   import { Label } from '../ui/label';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

   import { BaseFieldProps } from './BaseField';

   export interface SelectOption {
     value: string;
     label: string;
     disabled?: boolean;
   }

   export interface SelectFieldProps<TFieldValues extends FieldValues = FieldValues>
     extends BaseFieldProps<TFieldValues> {
     options?: SelectOption[];
     validateSelect?: (value: string) => boolean | string;
   }

   export function SelectField<TFieldValues extends FieldValues = FieldValues>({
     id,
     label,
     placeholder = 'Select an option',
     helperText,
     control,
     name,
     width = 'full',
     validation,
     options = [],
     validateSelect,
   }: SelectFieldProps<TFieldValues>): React.ReactElement {
     // Implementation using the Select components...
     // Styles are applied via Tailwind during the package build process.
     // ...
   }
   ```
