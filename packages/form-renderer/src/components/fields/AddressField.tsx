import { type ForwardedRef, type ReactElement } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '../ui';

/**
 * Props for the AddressField component
 */
export interface AddressFieldProps<TFieldValues extends FieldValues = FieldValues> {
  /**
   * Unique identifier for the field
   */
  id: string;

  /**
   * Label text to display
   */
  label: string;

  /**
   * Placeholder text when empty
   */
  placeholder?: string;

  /**
   * Helper text to display below the field
   */
  helperText?: string;

  /**
   * Field width for layout
   */
  width?: 'full' | 'half' | 'third';

  /**
   * Form control from React Hook Form
   */
  control: Control<TFieldValues>;

  /**
   * Field name in the form
   */
  name: FieldPath<TFieldValues>;

  /**
   * Optional custom validation function for address format
   */
  validateAddress?: (address: string) => boolean;
}

// Helper function to get width classes
function getWidthClasses(width: 'full' | 'half' | 'third'): string {
  switch (width) {
    case 'half':
      return 'w-full md:w-1/2';
    case 'third':
      return 'w-full md:w-1/3';
    case 'full':
    default:
      return 'w-full';
  }
}

/**
 * AddressField component specifically designed for blockchain addresses.
 * This component is not meant to be used as a standalone input.
 * It requires the React Hook Form control and properly named field path.
 */
export function AddressField<TFieldValues extends FieldValues = FieldValues>(
  props: AddressFieldProps<TFieldValues> & { ref?: ForwardedRef<HTMLInputElement> }
): ReactElement {
  const {
    id,
    label,
    placeholder,
    helperText,
    control,
    name,
    width = 'full',
    validateAddress,
    ref,
  } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={getWidthClasses(width)}>
          <FormLabel htmlFor={id}>{label}</FormLabel>
          <FormControl>
            <Input
              id={id}
              placeholder={placeholder || '0x...'}
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
              className="border-input h-10 rounded-md px-4 py-2 font-mono"
              ref={ref}
              // Add pattern for basic hex address validation
              pattern={!validateAddress ? '^0x[a-fA-F0-9]{40}$' : undefined}
              onChange={(e) => {
                // Custom validation can go here if needed
                field.onChange(e.target.value);
              }}
            />
          </FormControl>
          {helperText && <FormDescription>{helperText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Set displayName properly
AddressField.displayName = 'AddressField';
