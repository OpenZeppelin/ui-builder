import { startCase } from 'lodash';

import type {
  ContractSchema,
  FieldType,
  FieldValidation,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { enhanceNumericValidation, type NumericBoundsMap } from '@openzeppelin/ui-builder-utils';

import { isUintType, isVectorType } from '../utils/type-helpers';
import { mapMidnightParameterTypeToFieldType } from './type-mapper';

// --- Helpers --------------------------------------------------------------- //
function isArrayType(type: string): { isArray: boolean; elementType?: string } {
  const match = type.match(/^Array<\s*(.+)\s*>$/);
  if (match) return { isArray: true, elementType: match[1] };
  return { isArray: false };
}

function isMaybeType(type: string): { isMaybe: boolean; innerType?: string } {
  const match = type.match(/^Maybe<\s*(.+)\s*>$/i);
  if (match) return { isMaybe: true, innerType: match[1] };
  return { isMaybe: false };
}

function isInlineObjectLiteral(type: string): boolean {
  const trimmed = type.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

function parseObjectLiteralComponents(type: string): FunctionParameter[] {
  const inner = type.trim().replace(/^\{/, '').replace(/\}$/, '');
  const components: FunctionParameter[] = [];
  let current = '';
  let braceDepth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '{' || ch === '[' || ch === '(') braceDepth++;
    if (ch === '}' || ch === ']' || ch === ')') braceDepth--;
    if (ch === ';' && braceDepth === 0) {
      const part = current.trim();
      if (part) {
        const cleaned = part.replace(/^readonly\s+/, '');
        const idx = cleaned.indexOf(':');
        if (idx > -1) {
          const name = cleaned.substring(0, idx).trim().replace(/\?$/, '');
          const t = cleaned.substring(idx + 1).trim();
          if (name) components.push({ name, type: t });
        }
      }
      current = '';
    } else {
      current += ch;
    }
  }
  const tail = current.trim();
  if (tail) {
    const cleaned = tail.replace(/^readonly\s+/, '');
    const idx = cleaned.indexOf(':');
    if (idx > -1) {
      const name = cleaned.substring(0, idx).trim().replace(/\?$/, '');
      const t = cleaned.substring(idx + 1).trim();
      if (name) components.push({ name, type: t });
    }
  }
  return components;
}

/**
 * Extracts numeric bounds from Midnight Uint type strings (e.g., 'Uint<0..255>').
 * Returns bounds map for use with enhanceNumericValidation.
 */
function extractUintBounds(type: string): NumericBoundsMap | null {
  if (!isUintType(type)) {
    return null;
  }

  // Match Uint<0..MAX> pattern
  const match = type.match(/^Uint<\s*0\s*\.\.\s*(\d+)\s*>$/i);
  if (!match) {
    return null;
  }

  const max = Number.parseInt(match[1], 10);
  if (Number.isNaN(max)) {
    return null;
  }

  // Return a bounds map keyed by the exact type string
  return {
    [type]: { min: 0, max },
  };
}

/**
 * Get default validation rules for a parameter.
 */
function getDefaultValidation(required = true): FieldValidation {
  return { required };
}

/**
 * Generate default field configuration for a Midnight function parameter.
 * Handles arrays, inline object literals, and Maybe<T> optionality.
 *
 * NOTE: The Midnight compiler's `.d.ts` output loses Vector<N, T> type information,
 * converting it to simple `T[]` notation. This means we cannot automatically enforce
 * fixed-size array validation from the schema alone. Users must either:
 * 1. Manually set validation.min/max in the UI Builder's field editor, or
 * 2. Provide Vector metadata separately (if available from the .compact source)
 */
export function generateMidnightDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter,
  contractSchema?: ContractSchema
): FormFieldType<T> {
  const originalType = parameter.type || 'string';
  const maybe = isMaybeType(originalType);
  const baseType = maybe.isMaybe && maybe.innerType ? maybe.innerType : originalType;

  const arrayInfo = isArrayType(baseType);
  const vectorInfo = isVectorType(baseType);

  // Check for Vector metadata in schema (if provided separately)
  const vectorMetadata = (
    contractSchema?.metadata as
      | { vectorTypes?: Record<string, { size: number; elementType: string }> }
      | undefined
  )?.vectorTypes;
  const vectorMeta = vectorMetadata?.[parameter.name];

  // Base field mapping
  let fieldType = mapMidnightParameterTypeToFieldType(baseType) as T;

  // Enum detection via schema metadata
  const enumsMeta = (
    contractSchema?.metadata as
      | { enums?: Record<string, Array<{ name: string; value?: number }>> }
      | undefined
  )?.enums;
  if (enumsMeta && enumsMeta[baseType]) {
    fieldType = 'enum' as T;
  }

  // Extract numeric bounds for Uint types
  const uintBounds = extractUintBounds(baseType);
  const midnightBounds: NumericBoundsMap = uintBounds || {};

  // Build base validation
  let baseValidation = getDefaultValidation(!maybe.isMaybe);
  baseValidation = enhanceNumericValidation(baseValidation, baseType, midnightBounds);

  const fieldBase: FormFieldType<T> = {
    id: `${parameter.name}`,
    name: parameter.name || 'param',
    label: parameter.displayName || startCase(parameter.name || 'param'),
    type: fieldType,
    validation: baseValidation,
  } as FormFieldType<T>;

  // Attach enum metadata if available
  if ((fieldType as unknown as string) === 'enum' && enumsMeta && enumsMeta[baseType]) {
    const variantsRaw = enumsMeta[baseType];
    const enumMetadata = {
      name: baseType,
      variants: variantsRaw.map((v) => ({
        name: v.name,
        type: 'integer' as const,
        value: v.value,
      })),
      isUnitOnly: variantsRaw.every((v) => typeof v.value === 'number'),
    };
    return {
      ...fieldBase,
      enumMetadata,
    } as FormFieldType<T>;
  }

  // Inline object literal (non-array)
  if (!arrayInfo.isArray && isInlineObjectLiteral(baseType)) {
    const components = parseObjectLiteralComponents(baseType);
    return {
      ...fieldBase,
      type: 'object' as T,
      components,
    } as FormFieldType<T>;
  }

  // Array<T> and Vector<N, T>
  if (arrayInfo.isArray || vectorInfo.isVector) {
    const elementType = arrayInfo.elementType || vectorInfo.elementType || 'string';
    if (isInlineObjectLiteral(elementType)) {
      const components = parseObjectLiteralComponents(elementType);
      return {
        ...fieldBase,
        type: 'array-object' as T,
        components,
      } as FormFieldType<T>;
    }

    // Simple arrays of primitives
    const elementFieldType =
      enumsMeta && enumsMeta[elementType]
        ? ('enum' as FieldType)
        : (mapMidnightParameterTypeToFieldType(elementType) as FieldType);

    // Extract numeric bounds for array element Uint types
    const elementUintBounds = extractUintBounds(elementType);
    const elementBounds: NumericBoundsMap = elementUintBounds || {};

    // Build element validation with bounds
    let elementValidation = getDefaultValidation(true);
    elementValidation = enhanceNumericValidation(elementValidation, elementType, elementBounds);

    const baseArrayField: FormFieldType<T> = {
      ...fieldBase,
      type: 'array' as T,
      elementType: elementFieldType,
      // For Vector<N, T> enforce minimum number of items to N
      // Try to get size from: 1) schema metadata, 2) vectorInfo (if Vector in type string)
      validation: {
        ...fieldBase.validation,
        ...((vectorInfo.isVector && vectorInfo.size) || vectorMeta?.size
          ? {
              min: vectorInfo.size || vectorMeta?.size,
              max: vectorInfo.size || vectorMeta?.size,
            }
          : {}),
      },
      elementFieldConfig: {
        type: elementFieldType,
        validation: elementValidation,
      },
    } as FormFieldType<T>;

    if (elementFieldType === ('enum' as FieldType) && enumsMeta && enumsMeta[elementType]) {
      const variantsRaw = enumsMeta[elementType];
      const enumMetadata = {
        name: elementType,
        variants: variantsRaw.map((v) => ({
          name: v.name,
          type: 'integer' as const,
          value: v.value,
        })),
        isUnitOnly: variantsRaw.every((v) => typeof v.value === 'number'),
      };
      return {
        ...baseArrayField,
        elementFieldConfig: {
          ...baseArrayField.elementFieldConfig,
          enumMetadata,
        },
      } as FormFieldType<T>;
    }

    return baseArrayField;
  }

  return fieldBase;
}
