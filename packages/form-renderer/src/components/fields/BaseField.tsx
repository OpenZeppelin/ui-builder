import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { type ForwardedRef, type ReactElement, type ReactNode } from 'react';

import { type FieldValidation } from '../../types/FormTypes';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui';

import { getWidthClasses } from './utils/layout';

/**
 * Base props shared by all field components
 *
 * @template TFieldValues The field values type from React Hook Form
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
   * Validation rules for the field
   */
  validation?: FieldValidation;

  /**
   * Form control from React Hook Form
   */
  control: Control<TFieldValues>;

  /**
   * Field name in the form
   */
  name: FieldPath<TFieldValues>;

  /**
   * Whether the field should be displayed as read-only/disabled.
   * @default false
   */
  isReadOnly?: boolean;
}

/**
 * BaseField component to provide a consistent layout for form fields
 *
 * @important This component is the foundation of the form rendering architecture and should
 * ONLY be used by field-specific components within the system, not as a standalone component.
 *
 * Architecture role:
 * 1. Provides a consistent layout structure for all field types
 * 2. Handles integration with React Hook Form through the FormField component
 * 3. Manages common rendering aspects like labels, error messages, and help text
 * 4. Delegates actual input rendering to field-specific components via renderInput
 *
 * Field component hierarchy:
 * - TransactionForm (top-level form renderer)
 *   - DynamicFormField (field type selector)
 *     - Specific field components (TextField, NumberField, etc.)
 *       - BaseField (common field structure - this component)
 *         - Actual input element rendered by renderInput
 *
 * This component should only be extended by field-specific components like
 * TextField, NumberField, and AddressField - it is not meant for direct use in forms.
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
          {helperText && <FormDescription id={`${id}-description`}>{helperText}</FormDescription>}
          <FormMessage id={`${id}-error`} />
        </FormItem>
      )}
    />
  );
}

// Set displayName properly
BaseField.displayName = 'BaseField';
