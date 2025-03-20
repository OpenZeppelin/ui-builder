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
 * Props for the TextField component
 */
export interface TextFieldProps<TFieldValues extends FieldValues = FieldValues> {
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
 * TextField component specifically designed for React Hook Form integration.
 * This component is not meant to be used as a standalone input.
 * It requires the React Hook Form control and properly named field path.
 */
export function TextField<TFieldValues extends FieldValues = FieldValues>(
  props: TextFieldProps<TFieldValues> & { ref?: ForwardedRef<HTMLInputElement> }
): ReactElement {
  const { id, label, placeholder, helperText, control, name, width = 'full', ref } = props;

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
              placeholder={placeholder}
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
              className="border-input h-10 rounded-md px-4 py-2"
              ref={ref}
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
TextField.displayName = 'TextField';
