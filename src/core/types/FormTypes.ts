export type FieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'date'
  | 'email'
  | 'password'
  | 'address' // Blockchain address with validation
  | 'amount' // Token amount with decimals handling
  | 'hidden';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string; // Custom validation function as string (for exporting)
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  validation: FieldValidation;
  options?: { label: string; value: string }[]; // For select, radio, checkbox
  width?: 'full' | 'half' | 'third'; // For layout
}

export interface FormConfig {
  functionId: string;
  fields: FormField[];
  layout: {
    columns: number;
    spacing: 'compact' | 'normal' | 'relaxed';
    labelPosition: 'top' | 'left' | 'hidden';
  };
  theme: {
    primaryColor?: string;
    borderRadius?: string;
    // Other theme options
  };
  validation: {
    mode: 'onChange' | 'onBlur' | 'onSubmit';
    showErrors: 'inline' | 'summary' | 'both';
  };
}

// For compatibility with existing implementation
export interface FormMethod {
  id: string;
  name: string;
  displayName: string;
  inputs: { name: string; type: string; displayName: string }[];
  selected: boolean;
}
