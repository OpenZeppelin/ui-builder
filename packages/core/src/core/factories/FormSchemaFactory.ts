/**
 * FormSchemaFactory
 *
 * Creates form schemas from contract functions using the adapter pattern.
 * This factory is responsible for generating schemas that can be used to render forms
 * while delegating chain-specific logic to the appropriate adapter.
 */

import {
  FormFieldType,
  FormLayout,
  RenderFormSchema,
} from '@openzeppelin/transaction-form-renderer';

import { createTransformForFieldType } from '@form-renderer/utils/formUtils';

import { getContractAdapter } from '../../adapters';
import { BuilderFormConfig } from '../types/FormTypes';
import { humanizeString } from '../utils/utils';

import type { ContractAdapter } from '../../adapters';
import type { ChainType, ContractSchema, FunctionParameter } from '../types/ContractSchema';

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
        variant: 'primary' as const,
      },
    };
  }

  /**
   * Converts a BuilderFormConfig to a RenderFormSchema
   * This is useful for previewing a form in the builder
   *
   * @param builderConfig The BuilderFormConfig created in the form builder
   * @param functionName The name of the function (for title and button text)
   * @param functionDescription Optional description for the form
   * @returns A complete RenderFormSchema for rendering
   */
  builderConfigToRenderSchema(
    builderConfig: BuilderFormConfig,
    functionName: string,
    functionDescription?: string
  ): RenderFormSchema {
    return {
      ...builderConfig,
      id: `form-${builderConfig.functionId}`,
      title: this.humanizeString(functionName),
      description: functionDescription || '',
      submitButton: {
        text: `Execute ${functionName}`,
        loadingText: 'Processing...',
        variant: 'primary' as const,
      },
      defaultValues: {},
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
  private generateFields(inputs: FunctionParameter[], adapter: ContractAdapter): FormFieldType[] {
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
