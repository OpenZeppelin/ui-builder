import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/contracts-ui-builder-utils';

import { mapStellarParameterTypeToFieldType } from './type-mapper';

/**
 * Extracts the inner type from a Stellar Vec type.
 * @param parameterType - The parameter type (e.g., 'Vec<U32>', 'Vec<Address>')
 * @returns The inner type (e.g., 'U32', 'Address') or null if not a Vec type
 */
function extractStellarVecElementType(parameterType: string): string | null {
  // Handle Vec types like Vec<U32>, Vec<Address>, Vec<Bool>
  const vecMatch = parameterType.match(/^Vec<(.+)>$/);
  if (vecMatch) {
    return vecMatch[1];
  }
  return null;
}

/**
 * Get default validation rules for a parameter type.
 * Only includes serializable validation rules - no custom functions.
 */
function getDefaultValidationForType(): FieldValidation {
  return { required: true };
}

/**
 * Generate default field configuration for a Stellar function parameter.
 */
export function generateStellarDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  const fieldType = mapStellarParameterTypeToFieldType(parameter.type) as T;

  // Debug logging for unmapped types
  if (parameter.type === 'unknown') {
    console.warn(`[generateStellarDefaultField] Parameter "${parameter.name}" has type "unknown"`);
  }

  const baseField: FormFieldType<T> = {
    id: `field-${Math.random().toString(36).substring(2, 9)}`,
    name: parameter.name || parameter.type, // Use type if name missing
    label: startCase(parameter.displayName || parameter.name || parameter.type),
    type: fieldType,
    placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    helperText: parameter.description || '',
    defaultValue: getDefaultValueForType(fieldType) as FieldValue<T>,
    validation: getDefaultValidationForType(),
    width: 'full',
  };

  // For array types, provide element type information
  if (fieldType === 'array') {
    const elementType = extractStellarVecElementType(parameter.type);
    if (elementType) {
      const elementFieldType = mapStellarParameterTypeToFieldType(elementType);

      // Add array-specific properties
      const arrayField = {
        ...baseField,
        elementType: elementFieldType,
        elementFieldConfig: {
          type: elementFieldType,
          validation: { required: true },
          placeholder: `Enter ${elementType}`,
        },
      };
      return arrayField;
    }
  }

  // Preserve components for object and array-object types
  if (parameter.components && (fieldType === 'object' || fieldType === 'array-object')) {
    const result = {
      ...baseField,
      components: parameter.components,
    };
    return result;
  }

  return baseField;
}
