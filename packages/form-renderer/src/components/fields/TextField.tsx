import { forwardRef } from 'react';

/**
 * TEMPORARY PLACEHOLDER IMPLEMENTATION
 *
 * This is a simplified version of what will be needed for the actual component.
 * The final implementation should:
 * 1. Integrate with React Hook Form
 * 2. Match the styling and behavior of the application's UI components
 * 3. Support all the validation and error display patterns of the main app
 */
interface TextFieldProps {
  /**
   * Unique identifier for the field
   */
  id: string;

  /**
   * Label text to display
   */
  label: string;

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
   * Placeholder text when empty
   */
  placeholder?: string;

  /**
   * Helper text to display below the field
   */
  helperText?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Field width for layout
   */
  width?: 'full' | 'half' | 'third';
}

/**
 * Text Field Component
 *
 * Renders a text input field with label, validation, and error handling
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { id, label, value = '', onChange, onBlur, placeholder, helperText, error, width = 'full' },
    ref
  ) => {
    const widthClasses = {
      full: 'w-full',
      half: 'w-1/2',
      third: 'w-1/3',
    };

    return (
      <div className={`form-field mb-4 ${widthClasses[width]}`}>
        <label htmlFor={id} className="mb-1 block text-sm font-medium">
          {label}
        </label>

        <input
          id={id}
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} `}
        />

        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}

        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

// Add display name to the component
TextField.displayName = 'TextField';
