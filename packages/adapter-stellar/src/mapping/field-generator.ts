import { xdr } from '@stellar/stellar-sdk';
import { startCase } from 'lodash';

import type {
  ContractSchema,
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType, logger } from '@openzeppelin/contracts-ui-builder-utils';

import { isLikelyEnumType } from '../utils/type-detection';
import { extractEnumVariants, isEnumType, type EnumMetadata } from './enum-metadata';
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
 * Extracts the key and value types from a Stellar Map type.
 * @param parameterType - The parameter type (e.g., 'Map<Symbol, Bytes>', 'Map<U32, Address>')
 * @returns An object with keyType and valueType, or null if not a Map type
 */
function extractStellarMapTypes(
  parameterType: string
): { keyType: string; valueType: string } | null {
  // Handle Map types like Map<Symbol, Bytes>, Map<U32, Address>
  const mapMatch = parameterType.match(/^Map<([^,]+),\s*([^>]+)>$/);
  if (mapMatch) {
    return {
      keyType: mapMatch[1].trim(),
      valueType: mapMatch[2].trim(),
    };
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
  parameter: FunctionParameter,
  contractSchema?: ContractSchema
): FormFieldType<T> {
  // Extract spec entries from contract schema metadata if available
  const specEntries = contractSchema?.metadata?.specEntries as xdr.ScSpecEntry[] | undefined;
  const fieldType = mapStellarParameterTypeToFieldType(parameter.type) as T;

  // Debug logging for unmapped types
  if (parameter.type === 'unknown') {
    logger.warn(
      'adapter-stellar',
      `[generateStellarDefaultField] Parameter "${parameter.name}" has type "unknown"`
    );
  }

  let enumMetadata: EnumMetadata | null = null;
  let finalFieldType = fieldType;
  let options: { label: string; value: string }[] | undefined;

  // Check if this parameter is an enum type and extract metadata
  if (isLikelyEnumType(parameter.type)) {
    if (specEntries && isEnumType(specEntries, parameter.type)) {
      // We have spec entries, extract full metadata
      enumMetadata = extractEnumVariants(specEntries, parameter.type);
      if (enumMetadata) {
        if (enumMetadata.isUnitOnly) {
          // Unit-only enums can use select/radio with options
          finalFieldType = 'select' as T;
          options = enumMetadata.variants.map((variant) => ({
            label: variant.name,
            value: variant.type === 'integer' ? variant.value!.toString() : variant.name,
          }));
        } else {
          // Tagged enums with payloads use the composite enum field
          finalFieldType = 'enum' as T;
        }
      }
    } else {
      // No spec entries available, but type looks like enum - use enum field as fallback
      finalFieldType = 'enum' as T;
      // Create minimal enum metadata for fallback
      enumMetadata = {
        name: parameter.type,
        variants: [], // Empty variants will trigger fallback UI
        isUnitOnly: false,
      };
    }
  }

  const baseField: FormFieldType<T> = {
    id: `field-${Math.random().toString(36).substring(2, 9)}`,
    name: parameter.name || parameter.type, // Use type if name missing
    label: startCase(parameter.displayName || parameter.name || parameter.type),
    type: finalFieldType,
    placeholder: enumMetadata
      ? `Select ${parameter.displayName || parameter.name || parameter.type}`
      : `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    helperText: parameter.description || '',
    defaultValue: getDefaultValueForType(finalFieldType) as FieldValue<T>,
    validation: getDefaultValidationForType(),
    width: 'full',
    options,
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

  // For map types, provide key and value type information
  if (fieldType === ('map' as FieldType)) {
    const mapTypes = extractStellarMapTypes(parameter.type);
    if (mapTypes) {
      const keyFieldType = mapStellarParameterTypeToFieldType(mapTypes.keyType);
      const valueFieldType = mapStellarParameterTypeToFieldType(mapTypes.valueType);

      // Add map-specific properties
      const mapField = {
        ...baseField,
        mapMetadata: {
          keyType: keyFieldType,
          valueType: valueFieldType,
          keyFieldConfig: {
            type: keyFieldType,
            validation: { required: true },
            placeholder: `Enter ${mapTypes.keyType}`,
            originalParameterType: mapTypes.keyType,
          },
          valueFieldConfig: {
            type: valueFieldType,
            validation: { required: true },
            placeholder: `Enter ${mapTypes.valueType}`,
            originalParameterType: mapTypes.valueType,
          },
        },
        validation: {
          ...getDefaultValidationForType(),
          min: 0,
          // No max limit - users can add as many map entries as needed
        },
      };
      return mapField;
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

  // Add enum metadata if available
  if (enumMetadata) {
    const result = {
      ...baseField,
      enumMetadata,
    };
    return result;
  }

  return baseField;
}
