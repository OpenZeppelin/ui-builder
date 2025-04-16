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
