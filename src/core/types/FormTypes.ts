import type { ContractAdapter } from '../../adapters';

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

/**
 * Maps field types to their expected value types
 */
export type FieldValue<T extends FieldType> = T extends
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'address'
  ? string
  : T extends 'number' | 'amount'
    ? number
    : T extends 'checkbox'
      ? boolean
      : T extends 'date'
        ? Date
        : T extends 'select' | 'radio'
          ? string
          : unknown;

/**
 * Shared condition interface for both validation and visibility rules
 */
export interface FieldCondition {
  /**
   * The field ID this condition depends on
   */
  field: string;

  /**
   * The value to compare against
   */
  value?: unknown;

  /**
   * The comparison operator to use
   */
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'matches';

  /**
   * Error message to display when validation fails
   */
  message?: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;

  /**
   * Validation rules that depend on other fields
   */
  conditions?: FieldCondition[];
}

/**
 * Form field definition with validation, display, and transformation options
 */
export interface FormField<T extends FieldType = FieldType> {
  /**
   * Unique identifier for the field
   */
  id: string;

  /**
   * Parameter name used when submitting to the blockchain
   */
  name: string;

  /**
   * Human-readable label shown in the form
   */
  label: string;

  /**
   * Type of form field to render
   */
  type: T;

  /**
   * Placeholder text shown when empty
   */
  placeholder?: string;

  /**
   * Help text displayed below the field
   */
  helperText?: string;

  /**
   * Default value for the field
   */
  defaultValue?: FieldValue<T>;

  /**
   * Validation rules for the field
   */
  validation: FieldValidation;

  /**
   * Options for select, radio, checkbox fields
   */
  options?: { label: string; value: string }[];

  /**
   * Field width for layout
   */
  width?: 'full' | 'half' | 'third';

  /**
   * Transform functions for data conversion between UI and blockchain
   */
  transforms?: FieldTransforms<FieldValue<T>>;

  /**
   * Conditions for conditional rendering of the field
   * @deprecated Use visibleWhen for improved type safety
   */
  dependsOn?: {
    field: string;
    value: unknown;
    operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  };

  /**
   * Conditions that determine when this field should be visible
   */
  visibleWhen?: FieldCondition | FieldCondition[];
}

/**
 * Common properties shared between builder configuration and render schema
 */
export interface CommonFormProperties {
  /**
   * Form fields
   */
  fields: FormField[];

  /**
   * Layout configuration
   */
  layout: FormLayout;

  /**
   * Validation behavior
   */
  validation: {
    mode: 'onChange' | 'onBlur' | 'onSubmit';
    showErrors: 'inline' | 'summary' | 'both';
  };

  /**
   * Theme configuration
   */
  theme?: {
    primaryColor?: string;
    borderRadius?: string;
    // Other theme options
  };
}

/**
 * Configuration input used during form creation and editing in the builder
 */
export interface BuilderFormConfig extends CommonFormProperties {
  /**
   * ID of the contract function this form is for
   */
  functionId: string;
}

/**
 * Transform function interface for converting between UI and blockchain data formats
 */
export interface FieldTransforms<T = unknown> {
  /**
   * Function to transform data from blockchain format to UI format
   * Used when displaying values in the form
   */
  input?: (value: T) => unknown;

  /**
   * Function to transform data from UI format to blockchain format
   * Used when submitting the form
   */
  output?: (value: unknown) => T;
}

/**
 * Layout configuration for form rendering
 */
export interface FormLayout {
  /**
   * Number of columns in the layout grid
   */
  columns: number;

  /**
   * Spacing between form elements
   */
  spacing: 'compact' | 'normal' | 'relaxed';

  /**
   * Position of field labels
   */
  labelPosition: 'top' | 'left' | 'hidden';

  /**
   * Sections for organizing fields
   */
  sections?: {
    id: string;
    title: string;
    description?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    fields: string[]; // Field IDs in this section
  }[];
}

/**
 * Submit button configuration
 */
export interface SubmitButtonConfig {
  /**
   * Text displayed on the button
   */
  text: string;

  /**
   * Text displayed while submitting
   */
  loadingText: string;

  /**
   * Custom button style
   */
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * Complete schema for form rendering and submission
 */
export interface RenderFormSchema extends CommonFormProperties {
  /**
   * Unique identifier for the form, typically derived from the function ID
   */
  id: string;

  /**
   * Human-readable title for the form
   */
  title: string;

  /**
   * Description explaining the form's purpose
   */
  description?: string;

  /**
   * Submit button configuration
   */
  submitButton: SubmitButtonConfig;

  /**
   * Optional metadata for the form
   */
  metadata?: Record<string, unknown>;
}

/**
 * Props for the form renderer component
 */
export interface TransactionFormRendererProps {
  /**
   * The form schema to render
   */
  formSchema: RenderFormSchema;

  /**
   * The adapter for the form's chain
   */
  adapter: ContractAdapter;

  /**
   * Optional callback when form is submitted
   */
  onSubmit?: (data: unknown) => Promise<unknown>;

  /**
   * Whether the form is in preview mode
   */
  previewMode?: boolean;
}
