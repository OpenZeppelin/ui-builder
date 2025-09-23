/**
 * Form Generator Service
 *
 * Generates form configurations based on contract functions.
 * Uses chain-specific adapters for field type mapping and other chain-specific details.
 */
import { startCase } from 'lodash';

import { createTransformForFieldType } from '@openzeppelin/ui-builder-renderer';
import {
  CommonFormProperties,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  FieldType,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { generateId } from '@openzeppelin/ui-builder-utils';

import type { BuilderFormConfig } from '../core/types/FormTypes';

/**
 * Generates a default form configuration for a contract function
 *
 * This function creates a complete form configuration including field generation,
 * transform application, and common form properties setup. It handles complex types
 * like enums, arrays, and objects through the adapter's field generation capabilities.
 *
 * @param adapter The blockchain adapter to use for field generation and type mapping
 * @param contractSchema The contract schema containing chain type, function details, and metadata (e.g., specEntries for Stellar)
 * @param functionId The ID of the function to generate a form for
 * @returns A complete form configuration object with enhanced fields and transforms
 */
export function generateFormConfig(
  adapter: ContractAdapter,
  contractSchema: ContractSchema,
  functionId: string
): BuilderFormConfig {
  // Find the function details in the schema
  const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
  if (!functionDetails) {
    throw new Error(`Function ${functionId} not found in contract schema`);
  }

  // Generate fields using the adapter
  const rawFields = generateFieldsFromFunction(adapter, functionDetails, contractSchema);

  // Enhance fields with transforms (same as FormSchemaFactory)
  const fields = rawFields.map((field) => ({
    ...field,
    transforms: createTransformForFieldType(field.type, adapter),
  }));

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
 * This function processes each function parameter and generates appropriate form fields.
 * It handles complex types (arrays, tuples, enums) through specialized logic and delegates
 * to the adapter for chain-specific field generation. Each field is enhanced with the
 * original parameter type for reference during form processing.
 *
 * @param adapter The blockchain adapter to use for field generation and type mapping
 * @param functionDetails The contract function details containing input parameters
 * @param contractSchema Optional contract schema for additional context (e.g., enum metadata from specEntries)
 * @returns An array of form fields with enhanced metadata and original parameter type information
 */
export function generateFieldsFromFunction(
  adapter: ContractAdapter,
  functionDetails: ContractFunction,
  contractSchema?: ContractSchema
): FormFieldType[] {
  return functionDetails.inputs.map((input) => {
    // Check if this is a complex type that needs special handling
    if (isComplexType(input.type)) {
      return {
        ...handleComplexTypeField(adapter, input, contractSchema),
        originalParameterType: input.type,
      };
    }

    // Use adapter to generate the field with appropriate defaults for the chain
    const field = adapter.generateDefaultField(input, contractSchema);

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
 * This function specializes in handling complex blockchain parameter types such as:
 * - Arrays of objects/tuples (e.g., tuple[])
 * - Simple arrays (e.g., uint256[])
 * - Objects/Tuples (e.g., tuple)
 *
 * It delegates to the adapter for base field generation and then enhances the field
 * with appropriate UI components and metadata for complex type rendering.
 *
 * @param adapter The blockchain adapter to use for base field generation
 * @param parameter The complex parameter to generate a field for
 * @param contractSchema Optional contract schema for additional context
 * @returns A form field appropriate for the complex type with enhanced UI metadata
 */
function handleComplexTypeField(
  adapter: ContractAdapter,
  parameter: FunctionParameter,
  contractSchema?: ContractSchema
): FormFieldType {
  const baseField = adapter.generateDefaultField(parameter, contractSchema);

  // Arrays of objects/tuples
  if (parameter.type.match(/^tuple\[\d*\]$/)) {
    const result = {
      ...baseField,
      type: 'array-object' as FieldType,
      helperText: `${baseField.helperText || ''} Add items to the array.`.trim(),
      placeholder: undefined, // Not applicable for array-object
      validation: {
        ...baseField.validation,
      },
      // Pass the component information for nested structure
      components: parameter.components,
    };

    return result;
  }

  // Simple arrays - check if it's an array of simple types
  if (parameter.type.includes('[')) {
    const baseType = getBaseType(parameter.type);
    const elementType = adapter.generateDefaultField(
      {
        ...parameter,
        type: baseType,
        name: 'element',
      },
      contractSchema
    ).type;

    return {
      ...baseField,
      type: 'array',
      helperText: `${baseField.helperText || ''} Add ${baseType} values to the array.`.trim(),
      placeholder: undefined, // Not applicable for array
      validation: {
        ...baseField.validation,
      },
      // Pass element type information
      elementType,
    };
  }

  // Objects/Tuples - use object field for better UX
  if (parameter.type.startsWith('tuple')) {
    return {
      ...baseField,
      type: 'object',
      helperText: `${baseField.helperText || ''} Fill in the object properties.`.trim(),
      placeholder: undefined, // Not applicable for object
      validation: {
        ...baseField.validation,
      },
      // Pass the component information for nested structure
      components: parameter.components,
    };
  }

  // Map types - enhance with key-value type information
  if (parameter.type === 'Map' || parameter.type.startsWith('Map<')) {
    const enhancedField: FormFieldType = {
      ...baseField,
      helperText: `${baseField.helperText || ''} Add key-value pairs to the map.`.trim(),
      placeholder: undefined, // Not applicable for map
      validation: {
        ...baseField.validation,
      },
    };

    // Extract key and value types from Map<K, V> if available
    const mapMatch = parameter.type.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
      const keyType = mapMatch[1].trim();
      const valueType = mapMatch[2].trim();

      // Add type information for the MapField component
      enhancedField.mapMetadata = {
        keyType,
        valueType,
        keyFieldConfig: {
          type: adapter.mapParameterTypeToFieldType(keyType),
          validation: { required: true },
        },
        valueFieldConfig: {
          type: adapter.mapParameterTypeToFieldType(valueType),
          validation: { required: true },
        },
      };
    }

    return enhancedField;
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

  // Check for Map types (e.g., Map<String, Bytes>, Map)
  if (parameterType === 'Map' || parameterType.startsWith('Map<')) {
    return true;
  }

  return false;
}

/**
 * Updates an existing form configuration with new values
 *
 * This function merges partial updates into an existing form configuration while
 * preserving the structure and applying proper defaults. It handles special cases
 * like title preservation (including empty strings) and theme merging.
 *
 * @param existingConfig The existing form configuration to update
 * @param updates Partial updates to apply (fields, title, theme, etc.)
 * @returns The updated form configuration with merged properties and preserved structure
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
