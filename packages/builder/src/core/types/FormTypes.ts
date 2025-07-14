/**
 * Form Type Definitions for the Builder Package
 *
 * NOTE: This file contains only types specific to the builder package.
 * Common form types are imported directly from the renderer package
 * when needed, rather than being re-exported here.
 * If you see that the types must be used in multiple packages, please consider
 * adding them to the @openzeppelin/contracts-ui-builder-types package instead.
 */
// Import using the package name from dependencies
import type {
  CommonFormProperties,
  ExecutionConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

/**
 * Configuration input used during form creation and editing in the builder
 * This is specific to the builder package and extends CommonFormProperties from renderer
 */
export interface BuilderFormConfig extends CommonFormProperties {
  /**
   * ID of the contract function this form is for
   */
  functionId: string;

  /**
   * The deployed contract address for this form (required for export and execution)
   */
  contractAddress: string;

  /**
   * Custom title for the form
   */
  title?: string;

  /**
   * Custom description for the form
   */
  description?: string;

  /**
   * The execution configuration for the form
   */
  executionConfig?: ExecutionConfig;

  /**
   * The UI kit configuration for the form
   */
  uiKitConfig?: UiKitConfiguration;
}

export interface CustomizationStep {
  formConfig: BuilderFormConfig;
}
