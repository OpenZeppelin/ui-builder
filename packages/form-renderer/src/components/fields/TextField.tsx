import type { Control, FieldValues } from 'react-hook-form';

import { forwardRef } from 'react';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '../ui';
// Import Label directly for standalone use
import { Label } from '../ui/label';

/**
 * Base props for the TextField component
 */
interface TextFieldBaseProps {
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
   * Field name (for form accessibility)
   * This is optional to allow compatibility with FieldComponentProps
   * but will be required for certain use cases
   */
  name?: string;
}

/**
 * Props for standalone TextField usage
 */
interface StandaloneTextFieldProps extends TextFieldBaseProps {
  /**
   * Current field value
   */
  value?: string;

  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;

  /**
   * Callback when field loses focus
   */
  onBlur?: () => void;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Field name is required for standalone usage
   */
  name: string;

  /**
   * Indicates this is NOT a React Hook Form field
   */
  control?: undefined;
}

/**
 * Props for React Hook Form TextField usage
 */
interface FormTextFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends TextFieldBaseProps {
  /**
   * Form control from React Hook Form
   */
  control: Control<TFieldValues>;

  /**
   * Field name in the form (required for React Hook Form)
   */
  name: string;
}

/**
 * Combined props type for TextField component
 */
type TextFieldProps = StandaloneTextFieldProps | FormTextFieldProps<FieldValues>;

/**
 * Text Field Component
 *
 * Renders a text input field with label, validation, and error handling
 * using shadcn/ui form components and React Hook Form integration
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  const { id, label, placeholder, helperText, width = 'full' } = props;

  // If used with React Hook Form via control prop
  if ('control' in props && props.control) {
    return (
      <FormField
        control={props.control}
        name={props.name}
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

  // For standalone use without React Hook Form
  const { value, onChange, onBlur, error, name } = props as StandaloneTextFieldProps;

  if (!name) {
    console.warn('TextField: name prop is required for standalone usage');
  }

  return (
    <div className={`form-field mb-4 ${getWidthClasses(width)}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        ref={ref}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        name={name}
        placeholder={placeholder}
        className={`h-10 rounded-md px-4 py-2 ${error ? 'border-destructive' : 'border-input'}`}
      />
      {helperText && !error && <p className="text-muted-foreground text-sm">{helperText}</p>}
      {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
    </div>
  );
});

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

// Add display name to the component
TextField.displayName = 'TextField';
