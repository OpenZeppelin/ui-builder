/**
 * Type definitions for code templates
 *
 * These types define the parameters that can be passed to template functions.
 */

/**
 * Base interface for all template parameters
 * @remarks This is intentionally typed as a record instead of an empty interface
 * to silence TypeScript warnings about missing properties.
 * For now it's intentionally empty, but it's here to be extended by specific template types if needed.
 */
export type BaseTemplateParams = Record<string, unknown>;

/**
 * Parameters for the form component template
 */
export interface FormComponentTemplateParams extends BaseTemplateParams {
  /**
   * The class name of the adapter to use (e.g., 'EvmAdapter')
   */
  adapterClassName: string;

  /**
   * The adapter package name
   */
  adapterPackageName: string;

  /**
   * The function ID (e.g., 'transferTokens')
   */
  functionId: string;

  /**
   * The form configuration as a JSON string
   */
  formConfigJSON: string;

  /**
   * The contract schema as a JSON string
   */
  contractSchemaJSON: string;

  /**
   * The network config import name
   */
  networkConfigImportName: string;

  /**
   * The execution configuration as a JSON string or 'undefined'.
   * This is intended for future use by the generated form to handle different execution methods.
   */
  executionConfigJSON: string;

  /**
   * Optional flag to include debug mode
   */
  includeDebugMode?: boolean;
}

/**
 * Parameters for the app component template
 */
export interface AppComponentTemplateParams extends BaseTemplateParams {
  /**
   * The function ID (e.g., 'transferTokens')
   */
  functionId: string;

  /**
   * HTML-escaped function ID safe for JSX text nodes
   */
  functionIdEscaped?: string;

  /**
   * The current year for copyright notices
   */
  currentYear: number;
}

/**
 * Parameters for the main.tsx template
 */
export interface MainTemplateParams extends BaseTemplateParams {
  /**
   * The class name of the adapter to use (e.g., 'EvmAdapter')
   */
  adapterClassName: string;

  /**
   * The adapter package name
   */
  adapterPackageName: string;
}
