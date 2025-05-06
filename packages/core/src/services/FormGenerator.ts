/**
 * Form Generator Service
 *
 * Generates form configurations based on contract functions.
 * Uses chain-specific adapters for field type mapping and other chain-specific details.
 */
import { startCase } from 'lodash';

import { generateId } from '@openzeppelin/transaction-form-renderer';
import {
  CommonFormProperties,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  FieldType,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

import { getAdapter } from '../core/adapterRegistry';
import type { BuilderFormConfig } from '../core/types/FormTypes';

/**
 * Generates a default form configuration for a contract function
 *
 * @param contractSchema The contract schema containing chain type and function details
 * @param functionId The ID of the function to generate a form for
 * @returns A form configuration object
 */
export function generateFormConfig(
  contractSchema: ContractSchema,
  functionId: string
): BuilderFormConfig {
  // Find the function details in the schema
  const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
  if (!functionDetails) {
    throw new Error(`Function ${functionId} not found in contract schema`);
  }

  // Get the appropriate adapter for the selected chain
  const adapter = getAdapter(contractSchema.ecosystem);

  // Generate fields using the adapter
  const fields = generateFieldsFromFunction(adapter, functionDetails);

  // Create the common form properties
  const commonProperties: CommonFormProperties = {
    fields,
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    theme: {},
  };

  // Return the complete form configuration
  return {
    ...commonProperties,
    functionId,
    title: `${functionDetails.displayName} Form`,
    description:
      functionDetails.description ||
      `Form for interacting with the ${functionDetails.displayName} function.`,
    contractAddress: contractSchema.address || '',
  };
}

/**
 * Generates form fields for a contract function using the appropriate adapter
 *
 * @param adapter The blockchain adapter to use for field generation
 * @param functionDetails The contract function details
 * @returns An array of form fields
 */
export function generateFieldsFromFunction(
  adapter: ContractAdapter,
  functionDetails: ContractFunction
): FormFieldType[] {
  return functionDetails.inputs.map((input) => {
    // Check if this is a complex type that needs special handling
    if (isComplexType(input.type)) {
      return {
        ...handleComplexTypeField(adapter, input),
        originalParameterType: input.type,
      };
    }

    // Use adapter to generate the field with appropriate defaults for the chain
    const field = adapter.generateDefaultField(input);

    // Add the original parameter type
    return {
      ...field,
      originalParameterType: input.type,
    };
  });
}

/**
 * Handle generation of form fields for complex parameter types
 *
 * @param adapter The blockchain adapter to use
 * @param parameter The complex parameter to generate a field for
 * @returns A form field appropriate for the complex type
 */
function handleComplexTypeField(
  adapter: ContractAdapter,
  parameter: FunctionParameter
): FormFieldType {
  const baseField = adapter.generateDefaultField(parameter);

  // Arrays - We default to using a textarea where the user can input a JSON array
  if (parameter.type.includes('[')) {
    return {
      ...baseField,
      type: 'textarea',
      helperText: `${baseField.helperText || ''} Enter as a JSON array.`.trim(),
      placeholder: `Enter array of ${getBaseType(parameter.type)}`,
      validation: {
        ...baseField.validation,
        pattern: '^\\[.*\\]$', // Basic pattern to validate JSON array format
      },
    };
  }

  // Tuples - We use a textarea where the user can input a JSON object
  if (parameter.type.startsWith('tuple')) {
    return {
      ...baseField,
      type: 'textarea',
      helperText: `${baseField.helperText || ''} Enter as a JSON object.`.trim(),
      placeholder: 'Enter object values as JSON',
      validation: {
        ...baseField.validation,
        pattern: '^\\{.*\\}$', // Basic pattern to validate JSON object format
      },
    };
  }

  // Default case - just return the adapter's default field
  return baseField;
}

/**
 * Extract the base type from a complex type
 *
 * @param parameterType The parameter type string (e.g., "uint256[]")
 * @returns The base type without array brackets (e.g., "uint256")
 */
function getBaseType(parameterType: string): string {
  // Remove array brackets
  return parameterType.replace(/\[\d*\]/g, '');
}

/**
 * Fallback field generation in case the adapter fails
 *
 * @param functionDetails The contract function details
 * @param contractAddress The contract address
 * @returns An array of basic form fields
 */
export function generateFallbackFields(
  functionDetails: ContractFunction,
  contractAddress: string = ''
): FormFieldType[] {
  return functionDetails.inputs.map((input) => {
    let fieldType: FieldType = 'text';
    let placeholder = `Enter ${input.displayName || input.name || input.type}`;
    let helperText = '';

    // Try to provide some reasonable defaults based on the parameter name and type
    if (input.type.includes('address')) {
      fieldType = 'blockchain-address';
      placeholder = 'Enter blockchain address';
    } else if (input.type.includes('int') || input.type.includes('uint')) {
      fieldType = 'number';
      placeholder = 'Enter number value';
    } else if (input.type === 'bool') {
      fieldType = 'checkbox';
      placeholder = 'Check if true';
    } else if (input.type.includes('[]')) {
      fieldType = 'textarea';
      placeholder = 'Enter as JSON array';
      helperText = 'Enter values as a JSON array';
    } else if (input.type.includes('tuple')) {
      fieldType = 'textarea';
      placeholder = 'Enter as JSON object';
      helperText = 'Enter values as a JSON object';
    }

    return {
      id: generateId(),
      name: input.name || input.type,
      label: startCase(input.displayName || input.name || input.type),
      type: fieldType,
      placeholder,
      helperText,
      defaultValue: fieldType === 'checkbox' ? false : '',
      validation: {
        required: true,
      },
      width: 'full',
      originalParameterType: input.type,
      contractAddress,
    };
  });
}

/**
 * Determines if a parameter is a complex type (array, tuple, etc.)
 *
 * @param parameterType The blockchain parameter type string
 * @returns True if the parameter is a complex type
 */
export function isComplexType(parameterType: string): boolean {
  // Check for array types (e.g., uint256[])
  if (parameterType.includes('[')) {
    return true;
  }

  // Check for tuple types
  if (parameterType.startsWith('tuple')) {
    return true;
  }

  return false;
}

/**
 * Updates an existing form configuration with new values
 *
 * @param existingConfig The existing form configuration
 * @param updates Partial updates to apply
 * @returns The updated form configuration
 */
export function updateFormConfig(
  existingConfig: BuilderFormConfig,
  updates: Partial<BuilderFormConfig>
): BuilderFormConfig {
  // Create updated common properties
  const updatedCommonProperties: CommonFormProperties = {
    fields: updates.fields || existingConfig.fields,
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    theme: {
      ...existingConfig.theme,
      ...(updates.theme || {}),
    },
  };

  // Create a copy of the updates, properly handling the title
  const processedUpdates = { ...updates };

  // Special handling for title - only if it exists in updates
  // This ensures empty strings are preserved and not replaced with defaults
  if ('title' in updates) {
    processedUpdates.title = updates.title;
  }

  // Return complete updated configuration
  return {
    ...existingConfig,
    ...processedUpdates,
    ...updatedCommonProperties,
    contractAddress: updates.contractAddress || existingConfig.contractAddress,
  };
}
