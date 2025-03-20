/**
 * FormSchemaFactory
 *
 * Creates form schemas from contract functions using the adapter pattern.
 * This factory is responsible for generating schemas that can be used to render forms
 * while delegating chain-specific logic to the appropriate adapter.
 */

import type {
  FormField,
  FormLayout,
  RenderFormSchema,
} from '@openzeppelin/transaction-form-renderer';

import type { ContractAdapter } from '../../adapters';
import { getContractAdapter } from '../../adapters';
import type { ChainType, ContractSchema, FunctionParameter } from '../types/ContractSchema';
// Uncomment when needed: import { BuilderFormConfig } from '../types/FormTypes';
import { createTransformForFieldType } from '../utils/transforms';
import { humanizeString } from '../utils/utils';

/**
 * Factory class for generating form schemas from contract functions
 */
export class FormSchemaFactory {
  /**
   * Creates a complete form schema from a contract function
   * using the appropriate adapter for field mapping and validation
   *
   * @param contractSchema The contract schema containing function definitions
   * @param functionId The ID of the function to generate a form for
   * @param chainType The blockchain type (used to get the adapter)
   * @returns A complete form schema for rendering
   */
  generateFormSchema(
    contractSchema: ContractSchema,
    functionId: string,
    chainType: ChainType
  ): RenderFormSchema {
    // Find the function in the contract schema
    const functionDefinition = contractSchema.functions.find((fn) => fn.id === functionId);
    if (!functionDefinition) {
      throw new Error(`Function ${functionId} not found in contract schema`);
    }

    // Get the appropriate adapter for the chain type
    const adapter = getContractAdapter(chainType);

    // Create the common properties
    const commonProperties = {
      fields: this.generateFields(functionDefinition.inputs, adapter),
      layout: this.generateDefaultLayout(),
      validation: {
        mode: 'onChange' as const,
        showErrors: 'inline' as const,
      },
      theme: {},
    };

    // Return the complete render schema
    return {
      ...commonProperties,
      id: `form-${functionId}`,
      title: this.humanizeString(functionDefinition.displayName || functionDefinition.name),
      description: functionDefinition.description || '',
      submitButton: {
        text: `Execute ${functionDefinition.displayName || functionDefinition.name}`,
        loadingText: 'Processing...',
      },
    };
  }

  /**
   * Generates form fields using the adapter's default field generation
   * and enhances them with transform functions
   *
   * @param inputs The function input parameters
   * @param adapter The blockchain adapter to use
   * @returns An array of form fields with transforms
   */
  private generateFields(inputs: FunctionParameter[], adapter: ContractAdapter): FormField[] {
    return inputs.map((input) => {
      // Get the field type
      const fieldType = adapter.mapParameterTypeToFieldType(input.type);

      // Use the adapter's default field generation
      const field = adapter.generateDefaultField(input);

      // Enhance the field with transforms and ensure correct type
      return {
        ...field,
        type: fieldType, // Ensure the type is set correctly
        // Add transforms using the utility function
        transforms: createTransformForFieldType(fieldType, input.type, adapter),
      };
    });
  }

  /**
   * Generate a default layout configuration
   *
   * @returns A default form layout
   */
  private generateDefaultLayout(): FormLayout {
    return {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    };
  }

  /**
   * Convert a camelCase or snake_case string to a human-readable format
   *
   * @param str The string to humanize
   * @returns A human-readable string
   */
  private humanizeString(str: string): string {
    return humanizeString(str);
  }
}

// Export a singleton instance for convenience
export const formSchemaFactory = new FormSchemaFactory();
