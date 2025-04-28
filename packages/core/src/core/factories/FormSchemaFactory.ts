/**
 * FormSchemaFactory
 *
 * Creates form schemas from contract functions using the adapter pattern.
 * This factory is responsible for generating schemas that can be used to render forms
 * while delegating chain-specific logic to the appropriate adapter.
 */
import { createTransformForFieldType } from '@openzeppelin/transaction-form-renderer';
import type { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import type {
  ChainType,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';
import {
  FormFieldType,
  FormLayout,
  FormValues,
  RenderFormSchema,
} from '@openzeppelin/transaction-form-types/forms';

import { getAdapter } from '../adapterRegistry';
import { BuilderFormConfig } from '../types/FormTypes';
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
    const adapter = getAdapter(chainType);

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

    // Ensure contract address is present
    if (!contractSchema.address) {
      throw new Error('Contract schema is missing required address field');
    }

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
      contractAddress: contractSchema.address,
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
    // Filter fields and map properties for the RenderFormSchema
    const renderFields = builderConfig.fields
      .filter((field) => !field.isHidden) // Filter out hidden fields
      .map((field) => {
        const { validation, isHardcoded, hardcodedValue, ...restOfField } = field;
        const outputField: Partial<FormFieldType> = { ...restOfField }; // Start with rest

        // Include validation only if it exists and has keys
        if (validation && Object.keys(validation).length > 0) {
          outputField.validation = validation;
        }

        // Handle hardcoded fields that are NOT hidden
        if (isHardcoded) {
          outputField.defaultValue = hardcodedValue; // Set defaultValue
          // isReadOnly is copied via restOfField
        }

        return outputField as FormFieldType; // Cast to final type
      });

    // Create defaultValues object for RHF from hardcoded fields
    const defaultValues: FormValues = {};
    builderConfig.fields.forEach((field) => {
      if (field.isHardcoded && field.hardcodedValue !== undefined) {
        // Use the field's name (parameter name) as the key
        defaultValues[field.name] = field.hardcodedValue;
      }
    });

    // Explicitly exclude executionConfig when spreading builderConfig
    const { executionConfig: _executionConfig, ...restOfBuilderConfig } = builderConfig;

    return {
      ...restOfBuilderConfig, // Spread the rest of the config
      id: `form-${builderConfig.functionId}`,
      title: functionName,
      description: functionDescription || '',
      fields: renderFields,
      submitButton: {
        text: `Execute ${functionName}`,
        loadingText: 'Processing...',
        variant: 'primary' as const,
      },
      defaultValues: defaultValues,
      contractAddress: builderConfig.contractAddress,
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
        // Store the original parameter type for compatibility checks
        originalParameterType: input.type,
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
