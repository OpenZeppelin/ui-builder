/**
 * NOTE ON TYPE ARCHITECTURE
 *
 * This file contains the authoritative type definitions for the form renderer.
 * As part of the ongoing monorepo architecture refinement, we've defined these types
 * within the form-renderer package, but there may still be some duplication with
 * core/src/types/FormTypes.ts that needs to be addressed.
 *
 * TODO: Ensure complete consistency between packages by:
 * 1. Validating that core properly imports types from form-renderer
 * 2. Removing any remaining duplicate type definitions
 * 3. Documenting the final decision on type architecture
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
}

/**
 * Props for the TransactionFormRenderer component
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
