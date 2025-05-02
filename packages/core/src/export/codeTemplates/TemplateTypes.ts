/**
 * Type definitions for code templates
 *
 * These types define the parameters that can be passed to template functions.
 */
import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

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
   * The blockchain type (e.g., 'evm', 'solana')
   */
  chainType: ChainType;

  /**
   * The function ID (e.g., 'transferTokens')
   */
  functionId: string;

  /**
   * The form configuration as a JSON string
   */
  formConfigJSON: string;

  /**
   * The original FormFieldType[] config as a JSON string
   */
  allFieldsConfigJSON: string;

  /**
   * The execution configuration as a JSON string or 'undefined'
   */
  executionConfigJSON: string;

  /**
   * Optional flag to include debug mode
   */
  includeDebugMode?: boolean;

  /**
   * The contract schema as a JSON string
   */
  contractSchemaJSON: string;
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
