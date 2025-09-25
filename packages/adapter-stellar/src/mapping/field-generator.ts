import { xdr } from '@stellar/stellar-sdk';
import { startCase } from 'lodash';

import type {
  ContractSchema,
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { getDefaultValueForType, logger } from '@openzeppelin/ui-builder-utils';

import { extractMapTypes, extractVecElementType } from '../utils/safe-type-parser';
import { isBytesNType, isLikelyEnumType } from '../utils/type-detection';
import { extractEnumVariants, isEnumType, type EnumMetadata } from './enum-metadata';
import { extractStructFields, isStructType } from './struct-fields';
import { mapStellarParameterTypeToFieldType } from './type-mapper';

/**
 * Get default validation rules for a parameter type.
 * Only includes serializable validation rules - no custom functions.
 */
function getDefaultValidationForType(): FieldValidation {
  return { required: true };
}

/**
 * Generate default form configuration for a Stellar function parameter. Supports:
 * - WASM artifacts: parameters arrive with baked-in enum metadata and struct components.
 * - SAC runtime specs: metadata is fetched on demand, so we reconstruct the same shape from
 *   `metadata.specEntries` to keep the UI identical across contract types.
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
  // WASM artifacts still include `components` on struct inputs because we bake them during
  // the build step. SAC contracts fetch their spec at runtime, so struct parameters show up
  // without that data. Cache whatever the SAC spec gives us so the final field mirrors the
  // WASM experience.
  let structComponents: FunctionParameter[] | null = null;
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

  // Same story here: WASM schemas already embed struct components, but SAC schemas only
  // expose them inside the downloaded spec. Pull them out up front so the UI sees the
  // same shape regardless of how the metadata was sourced.
  if (specEntries && isStructType(specEntries, parameter.type)) {
    const structFields = extractStructFields(specEntries, parameter.type);
    if (structFields && structFields.length > 0) {
      structComponents = structFields;
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

  // Propagate max byte length for BytesN types so the UI can enforce it
  if (isBytesNType(parameter.type)) {
    const sizeMatch = parameter.type.match(/^BytesN<(\d+)>$/);
    const maxBytes = sizeMatch ? Number.parseInt(sizeMatch[1], 10) : undefined;

    if (!Number.isNaN(maxBytes) && Number.isFinite(maxBytes)) {
      baseField.metadata = {
        ...(baseField.metadata ?? {}),
        maxBytes,
      };
    }
  }

  // For array types, provide element type information
  if (fieldType === 'array') {
    const elementType = extractVecElementType(parameter.type);
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
    const mapTypes = extractMapTypes(parameter.type);
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
  if (fieldType === 'object' || fieldType === 'array-object') {
    const componentsToUse = parameter.components || structComponents;
    if (componentsToUse) {
      // Prefer the baked-in WASM components, otherwise fall back to the SAC-derived
      // components we cached above.
      const result = {
        ...baseField,
        components: componentsToUse,
      };
      return result;
    }
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
