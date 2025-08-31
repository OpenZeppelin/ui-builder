/**
 * FormSchemaFactory
 *
 * Creates form schemas from contract functions using the adapter pattern.
 * This factory is responsible for generating schemas that can be used to render forms
 * while delegating chain-specific logic to the appropriate adapter.
 */
import { createTransformForFieldType } from '@openzeppelin/contracts-ui-builder-renderer';
import type {
  ContractAdapter,
  ContractSchema,
  FieldValidation,
  FormFieldType,
  FormLayout,
  FormValues,
  FunctionParameter,
  RenderFormSchema,
} from '@openzeppelin/contracts-ui-builder-types';

import { generateFieldsFromFunction } from '../../services/FormGenerator';
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
   * @param adapter The configured ContractAdapter instance for the specific network.
   * @param contractSchema The contract schema containing function definitions.
   * @param functionId The ID of the function to generate a form for.
   * @returns A complete form schema for rendering.
   */
  generateFormSchema(
    adapter: ContractAdapter,
    contractSchema: ContractSchema,
    functionId: string
  ): RenderFormSchema {
    // Find the function in the contract schema
    const functionDefinition = contractSchema.functions.find((fn) => fn.id === functionId);
    if (!functionDefinition) {
      throw new Error(`Function ${functionId} not found in contract schema`);
    }

    // Create the common properties
    const commonProperties = {
      fields: this.generateFields(functionDefinition.inputs, adapter, contractSchema),
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
   * @param builderConfig The BuilderFormConfig created in the builder app
   * @param formTitle The title of the form
   * @param formDescription Optional description for the form
   * @returns A complete RenderFormSchema for rendering
   */
  builderConfigToRenderSchema(
    builderConfig: BuilderFormConfig,
    formTitle: string,
    formDescription?: string
  ): RenderFormSchema {
    const processedFields: FormFieldType[] = builderConfig.fields.map((field) => {
      const outputField: FormFieldType = {
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        helperText: field.helperText,
        defaultValue: field.defaultValue,
        validation:
          field.validation && Object.keys(field.validation).length > 0
            ? field.validation
            : ({} as FieldValidation),
        options: field.options,
        width: field.width,
        transforms: field.transforms,
        visibleWhen: field.visibleWhen,
        originalParameterType: field.originalParameterType,
        isHidden: field.isHidden,
        isHardcoded: field.isHardcoded,
        hardcodedValue: field.hardcodedValue,
        readOnly: field.readOnly,
        components: field.components,
        elementType: field.elementType,
        elementFieldConfig: field.elementFieldConfig,
        enumMetadata: field.enumMetadata,
      };

      if (field.isHardcoded && !field.isHidden && outputField.defaultValue === undefined) {
        outputField.defaultValue = field.hardcodedValue;
      }

      return outputField;
    });

    const defaultValuesForRHF: FormValues = {};
    processedFields.forEach((field) => {
      if (field.isHardcoded && field.hardcodedValue !== undefined) {
        defaultValuesForRHF[field.name] = field.hardcodedValue;
      } else if (field.defaultValue !== undefined) {
        defaultValuesForRHF[field.name] = field.defaultValue;
      }
    });

    const {
      executionConfig: _executionConfig,
      fields: _fields,
      // exclude uiKitConfig from the schema, we don't need it for the renderer.
      // The config is added to the object dynamically for use during export,
      // but should not be part of the final schema passed to the renderer.
      uiKitConfig: _uiKitConfig,
      ...restOfBuilderConfig
    } = builderConfig;

    return {
      ...restOfBuilderConfig,
      id: `form-${builderConfig.functionId}`,
      title: formTitle,
      description: formDescription || builderConfig.description || '',
      fields: processedFields,
      submitButton: {
        text: `Execute ${formTitle}`,
        loadingText: 'Processing...',
        variant: 'primary' as const,
      },
      defaultValues: Object.keys(defaultValuesForRHF).length > 0 ? defaultValuesForRHF : undefined,
      contractAddress: builderConfig.contractAddress,
      functionId: builderConfig.functionId,
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
  private generateFields(
    inputs: FunctionParameter[],
    adapter: ContractAdapter,
    contractSchema?: ContractSchema
  ): FormFieldType[] {
    // Use generateFieldsFromFunction to properly handle complex types
    const functionDetails = {
      inputs,
      // These fields are not used by generateFieldsFromFunction
      id: '',
      name: '',
      displayName: '',
      type: 'function' as const,
      outputs: [],
      modifiesState: false,
      stateMutability: 'view' as const,
    };

    const fields = generateFieldsFromFunction(adapter, functionDetails, contractSchema);

    // Enhance fields with transforms
    return fields.map((field) => ({
      ...field,
      transforms: createTransformForFieldType(field.type, adapter),
    }));
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
