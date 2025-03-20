import { type ForwardedRef, type ReactElement, type ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { getWidthClasses } from '../../components/fields/utils';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui';

/**
 * Base props shared by all field components
 */
export interface BaseFieldProps<TFieldValues extends FieldValues = FieldValues> {
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

/**
 * BaseField component to provide a consistent layout for form fields
 */
export function BaseField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  helperText,
  control,
  name,
  width = 'full',
  renderInput,
}: BaseFieldProps<TFieldValues> & {
  renderInput: (
    field: Record<string, unknown>,
    props: { id: string; ref?: ForwardedRef<HTMLElement> }
  ) => ReactNode;
  ref?: ForwardedRef<HTMLElement>;
}): ReactElement {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={getWidthClasses(width)}>
          <FormLabel htmlFor={id}>{label}</FormLabel>
          <FormControl>{renderInput(field, { id })}</FormControl>
          {helperText && <FormDescription>{helperText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Set displayName properly
BaseField.displayName = 'BaseField';
