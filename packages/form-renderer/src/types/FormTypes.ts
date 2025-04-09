/**
 * NOTE ON TYPE ARCHITECTURE
 *
 * This file is the single source of truth for form-related type definitions.
 * The architecture decision is:
 *
 * 1. Types live in form-renderer package (this file)
 * 2. Core package imports types from form-renderer using the package name
 *    `@openzeppelin/transaction-form-renderer`.
 * 3. This enables proper composition while avoiding duplication
 *
 * This approach allows the form-renderer to be a standalone package that can be
 * published and consumed by external projects, while also being used internally
 * by the core package.
 */

/**
 * Form Renderer Type Definitions
 *
 * These types define the shape of form schemas, fields, and related structures
 * for the form renderer package. These are the authoritative types that should
 * be used by both the form-renderer and core packages.
 */

/**
 * Minimal adapter interface for the form renderer
 */
export interface ContractAdapter {
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown;
  isValidAddress(address: string): boolean;
  getCompatibleFieldTypes(parameterType: string): FieldType[];
}

/**
 * Type representing form values in a submission or form state
 */
export type FormValues = Record<string, unknown>;

/**
 * Type for React Hook Form error objects
 */
export type FormError =
  | string
  | {
      message?: string;
      type?: string;
      [key: string]: unknown;
    };

/**
 * Field types supported by the form renderer
 */
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
  | 'blockchain-address' // Blockchain address with validation
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
  | 'blockchain-address'
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

/**
 * Validation rules for form fields
 */
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
   * Conditions that determine when this field should be visible
   */
  visibleWhen?: FieldCondition | FieldCondition[];

  /**
   * Original blockchain parameter type
   * Used to determine compatible field types and for data transformation
   */
  originalParameterType?: string;

  /**
   * Whether this field should be hidden from the rendered form UI
   * @default false
   */
  isHidden?: boolean;

  /**
   * Whether this field's value is fixed and not user-editable
   * If true and isHidden is false, the field might be rendered as read-only
   * @default false
   */
  isHardcoded?: boolean;

  /**
   * The fixed value to use if isHardcoded is true
   * The type should ideally correspond to FieldValue<T>, but using any for initial flexibility
   */
  hardcodedValue?: FieldValue<T>;

  /**
   * Whether the field should be displayed as read-only in the UI.
   * Typically used when isHardcoded is true but isHidden is false.
   * @default false
   */
  isReadOnly?: boolean;
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
 * Common properties shared between different form schema types
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
 * Complete form schema used for rendering
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

  /**
   * Default values for form fields
   */
  defaultValues?: FormValues;

  /**
   * Function ID for the contract function this form represents
   */
  functionId?: string;
}

/**
 * Props for the TransactionForm component
 */
export interface TransactionFormProps {
  /**
   * The form schema to render
   */
  schema: RenderFormSchema;

  /**
   * The adapter for the form's chain
   */
  adapter: ContractAdapter;

  /**
   * Optional callback when form is submitted
   */
  onSubmit?: (data: FormData) => void;

  /**
   * Whether the form is in preview mode
   */
  previewMode?: boolean;
}
