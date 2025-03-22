# Adding New Field Components

This document outlines the step-by-step process for adding new field components to the Transaction Form Builder system.

## Architecture Overview

The form system follows a layered architecture:

1. **TransactionForm**: Top-level form renderer
2. **DynamicFormField**: Selects appropriate field component based on field type
3. **Field Components**: Type-specific field components (TextField, NumberField, etc.)
4. **UI Components**: Radix UI based components styled via `@styles/global.css`
5. **BaseField**: Common field structure shared by all field components

## Key Design Principles

1. **Use Radix UI Primitives**: All form components should be built with Radix UI primitives for accessibility and consistency
2. **Global CSS Styling**: Use data-slot attributes and the `@styles/global.css` for styling instead of inline styles
3. **Consistent Form Patterns**: Follow existing field component patterns for consistency
4. **Accessibility First**: Ensure all components are fully accessible with proper ARIA attributes

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
// packages/form-renderer/src/components/ui/your-component.tsx
'use client';

import * as React from 'react';
import * as YourPrimitive from '@radix-ui/react-your-primitive';

const YourComponent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof YourPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <YourPrimitive.Root
    ref={ref}
    data-slot="your-component" // Use data-slot for styling in global.css
    className={className}
    {...props}
  >
    {children}
  </YourPrimitive.Root>
));
YourComponent.displayName = YourPrimitive.Root.displayName;

export { YourComponent };
```

Then add the styling in `packages/styles/global.css`:

```css
/* In the @components layer */
[data-slot='your-component'] {
  @apply /* your tailwind styles */;
}
```

## Step 3: Create Field Component

Create a new file named `YourNewField.tsx` in the `components/fields` directory:

```typescript
import React from 'react';
import { FieldValues, Controller, FieldPath } from 'react-hook-form';
import { BaseFieldProps } from './BaseField';
import { YourComponent } from '../ui/your-component';
import { Label } from '../ui/label';
import { cn } from '../../utils/cn';

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

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        width === 'full' ? 'w-full' : width === 'half' ? 'w-full md:w-1/2' : 'w-full md:w-1/3'
      )}
    >
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
                <div id={descriptionId} data-slot="form-description">
                  {helperText}
                </div>
              )}

              {/* Display error message */}
              {error && (
                <div id={errorId} data-slot="form-message">
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

## Step 6: Styling Guidelines

Always follow these styling guidelines:

1. **Use data-slot attributes**: All component styling should be controlled via data-slot attributes in global.css

   ```tsx
   <Component data-slot="component-name" />
   ```

2. **Never use inline styles**: Avoid adding inline styles directly to components with className

   ```tsx
   // ❌ Incorrect
   <Component className="border bg-white rounded-md p-2" />

   // ✅ Correct
   <Component data-slot="component-name" />
   ```

3. **Only pass className for customization**: Use className prop only for external customization of components

   ```tsx
   <Component data-slot="component-name" className={className} />
   ```

4. **Define styles in global.css**: Add component styles to the components layer in `packages/styles/global.css`
   ```css
   @layer components {
     [data-slot='component-name'] {
       @apply border-input bg-background /* etc. */ rounded-md;
     }
   }
   ```

## Step 7: Accessibility Guidelines

Ensure your field component follows accessibility best practices:

1. **Use proper ARIA attributes**: Always include aria-invalid, aria-required, and aria-describedby
2. **Connect labels with inputs**: Use htmlFor attribute on labels matched with id on inputs
3. **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
4. **Focus management**: Properly handle focus states with focus indicators
5. **Screen reader support**: Ensure all content is accessible to screen readers

## Step 8: Test Your Field Component

Testing your field component is crucial to ensure it integrates properly with the form system:

1. **Test with Storybook**: Create stories for all field states (default, error, disabled, etc.)
2. **Test with various validation rules**: Ensure validation works correctly
3. **Test error handling and reporting**: Verify error messages display correctly
4. **Test keyboard navigation and accessibility**: Ensure the field is accessible
5. **Test integration with React Hook Form**: Verify form state updates correctly

## Field Component Checklist

- [ ] Built UI component using Radix UI primitives (if needed)
- [ ] Added styling via data-slot attributes in global.css
- [ ] Extended BaseFieldProps with field-specific props
- [ ] Implemented proper validation logic
- [ ] Set proper displayName for debugging
- [ ] Exported component in index.ts
- [ ] Registered component in fieldComponents registry
- [ ] Added Storybook stories for the component
- [ ] Ensured full accessibility compliance

## Example: Creating a SelectField

Here's an example of creating a SelectField:

1. Create the UI component with Radix UI:

   ```tsx
   // packages/form-renderer/src/components/ui/select.tsx
   'use client';

   import * as React from 'react';
   import * as SelectPrimitive from '@radix-ui/react-select';
   import { cn } from '../../utils/cn';

   const Select = SelectPrimitive.Root;

   const SelectTrigger = React.forwardRef<
     HTMLButtonElement,
     React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
   >(({ className, children, ...props }, ref) => (
     <SelectPrimitive.Trigger ref={ref} data-slot="select-trigger" className={className} {...props}>
       {children}
     </SelectPrimitive.Trigger>
   ));

   // ...other Select components

   export { Select, SelectTrigger /* ...etc */ };
   ```

2. Add styles to global.css:

   ```css
   [data-slot='select-trigger'] {
     @apply border-input bg-background ring-offset-background flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm;
   }

   [data-slot='select-content'] {
     @apply bg-popover text-popover-foreground relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md;
   }
   ```

3. Create the field component:

   ```tsx
   // packages/form-renderer/src/components/fields/SelectField.tsx
   import React from 'react';
   import { FieldValues, Controller } from 'react-hook-form';
   import { BaseFieldProps } from './BaseField';
   import { Label } from '../ui/label';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
     // Implementation details...
   }
   ```
