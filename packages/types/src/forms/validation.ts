import { FieldCondition } from './fields';

/**
 * Validation rules for form fields
 */
export interface FieldValidation {
  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Minimum value for number fields
   */
  min?: number;

  /**
   * Maximum value for number fields
   */
  max?: number;

  /**
   * Minimum length for text fields
   */
  minLength?: number;

  /**
   * Maximum length for text fields
   */
  maxLength?: number;

  /**
   * Regular expression pattern for text validation
   */
  pattern?: string | RegExp;

  /**
   * Validation rules that depend on other fields
   */
  conditions?: FieldCondition[];
}
