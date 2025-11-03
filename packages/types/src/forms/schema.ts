import { FormValues } from './fields';
import { FormFieldType } from './form-field';
import { FormLayout, SubmitButtonConfig } from './layout';

/**
 * Common properties shared between different form schema types
 */
export interface CommonFormProperties {
  /**
   * Form fields
   */
  fields: FormFieldType[];

  /**
   * Layout configuration
   */
  layout: FormLayout;

  /**
   * Validation behavior (fixed values)
   */
  validation: {
    mode: 'onChange';
    showErrors: 'inline';
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
   * Function ID for the contract function this form represents.
   * Note: Also stored at top-level in ContractUIRecord for database indexing/queries.
   */
  functionId?: string;

  /**
   * The deployed contract address for this form.
   * Required for widgets like ContractStateWidget and for transaction execution.
   * Note: Also stored at top-level in ContractUIRecord for database indexing/queries.
   */
  contractAddress: string;

  /**
   * Runtime-only secret values keyed by adapter binding key.
   * These are populated from runtimeSecret fields at execution time.
   * Not persisted; for fields like organizer keys that should only exist at runtime.
   * Example: { organizerSecret: '0xabcd...' }
   */
  runtimeSecrets?: Record<string, string>;
}
