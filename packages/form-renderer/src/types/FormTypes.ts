/**
 * Form Types
 *
 * TEMPORARY PLACEHOLDER TYPES
 * These will be replaced with the actual types from the main project.
 * In the final implementation, this package will contain the authoritative
 * type definitions that will be imported by the core package.
 */

// Define a minimal adapter interface for the form renderer
export interface ContractAdapter {
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown;
  isValidAddress(address: string): boolean;
}

// Placeholder type definitions - will be replaced with actual types
export interface RenderFormSchema {
  id: string;
  title: string;
  fields: FormField[];
  description?: string;
  submitButton: SubmitButtonConfig;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'textarea'
  | 'address'
  | 'amount';

export interface FormField<T extends FieldType = FieldType> {
  id: string;
  name: string;
  label: string;
  type: T;
  placeholder?: string;
  helperText?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface SubmitButtonConfig {
  text: string;
  loadingText: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface TransactionFormRendererProps {
  formSchema: RenderFormSchema;
  adapter: ContractAdapter;
  onSubmit?: (data: unknown) => Promise<unknown>;
  previewMode?: boolean;
}
