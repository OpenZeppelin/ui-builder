import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-types';
import {
  enhanceNumericValidation,
  getDefaultValueForType,
  type NumericBoundsMap,
} from '@openzeppelin/ui-utils';

import { mapEvmParamTypeToFieldType } from './type-mapper';

/**
 * Extracts the inner type from an EVM array type.
 * @param parameterType - The parameter type (e.g., 'uint32[]', 'address[]')
 * @returns The inner type (e.g., 'uint32', 'address') or null if not an array type
 */
function extractArrayElementType(parameterType: string): string | null {
  // Handle array types like uint32[], address[], bytes32[]
  const arrayMatch = parameterType.match(/^(.+)\[\d*\]$/);
  if (arrayMatch) {
    return arrayMatch[1];
  }
  return null;
}

/**
 * Get default validation rules for a parameter.
 * Field-specific validation is handled by the field components themselves.
 */
function getDefaultValidation(): FieldValidation {
  return { required: true };
}

/**
 * EVM numeric type bounds.
 * Maps EVM type names to their min/max value constraints.
 * Note: uint64, uint128, uint256, int64, int128, int256 exceed JavaScript's Number.MAX_SAFE_INTEGER
 * and are handled via BigInt fields, so bounds are not applied here.
 */
const EVM_NUMERIC_BOUNDS: NumericBoundsMap = {
  uint: { min: 0 },
  uint8: { min: 0, max: 255 },
  uint16: { min: 0, max: 65_535 },
  uint32: { min: 0, max: 4_294_967_295 },
  int: {},
  int8: { min: -128, max: 127 },
  int16: { min: -32_768, max: 32_767 },
  int32: { min: -2_147_483_648, max: 2_147_483_647 },
};

/**
 * Generate default field configuration for an EVM function parameter.
 */
export function generateEvmDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  const fieldType = mapEvmParamTypeToFieldType(parameter.type) as T;

  const baseField: FormFieldType<T> = {
    id: `field-${Math.random().toString(36).substring(2, 9)}`,
    name: parameter.name || parameter.type, // Use type if name missing
    label: startCase(parameter.displayName || parameter.name || parameter.type),
    type: fieldType,
    placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    helperText: parameter.description || '',
    defaultValue: getDefaultValueForType(fieldType) as FieldValue<T>,
    validation: enhanceNumericValidation(
      getDefaultValidation(),
      parameter.type,
      EVM_NUMERIC_BOUNDS
    ),
    width: 'full',
  };

  // For array types, provide element type information
  if (fieldType === 'array') {
    const elementType = extractArrayElementType(parameter.type);
    if (elementType) {
      const elementFieldType = mapEvmParamTypeToFieldType(elementType);

      // Add array-specific properties
      const arrayField = {
        ...baseField,
        elementType: elementFieldType,
        elementFieldConfig: {
          type: elementFieldType,
          validation: enhanceNumericValidation(
            getDefaultValidation(),
            elementType,
            EVM_NUMERIC_BOUNDS
          ),
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
