/**
 * Form Type Definitions for the Core Package
 *
 * NOTE: This file contains only types specific to the core package.
 * Common form types are imported directly from the form-renderer package
 * when needed, rather than being re-exported here.
 */

// Import using the package name from dependencies
import type { CommonFormProperties } from '@openzeppelin/transaction-form-renderer';

/**
 * Configuration input used during form creation and editing in the builder
 * This is specific to the core package and extends CommonFormProperties from form-renderer
 */
export interface BuilderFormConfig extends CommonFormProperties {
  /**
   * ID of the contract function this form is for
   */
  functionId: string;
}
