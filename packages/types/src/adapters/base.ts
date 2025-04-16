import type { FunctionParameter } from '../contracts';
import type { FieldType, FormFieldType } from '../forms';

/**
 * Minimal adapter interface for the form renderer and contract interaction
 *
 * This is the base interface that all chain-specific adapters must implement.
 * It defines the core functionality needed for form rendering and contract interaction.
 */
export interface ContractAdapter {
  /**
   * Format transaction data for the specific chain,
   * considering submitted inputs and field configurations.
   *
   * @param functionId - The ID of the function being called
   * @param submittedInputs - The data submitted from the rendered form fields
   * @param allFieldsConfig - The configuration for all fields
   * @returns The formatted data payload for the blockchain transaction
   */
  formatTransactionData(
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown;

  /**
   * Validate a blockchain address for this chain
   *
   * @param address - The address to validate
   * @returns Whether the address is valid for this chain
   */
  isValidAddress(address: string): boolean;

  /**
   * Get field types compatible with a specific parameter type
   *
   * @param parameterType - The blockchain parameter type
   * @returns Array of compatible field types
   */
  getCompatibleFieldTypes(parameterType: string): FieldType[];

  /**
   * Generate default field configuration for a function parameter
   *
   * @param parameter - The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField(parameter: FunctionParameter): FormFieldType;
}
