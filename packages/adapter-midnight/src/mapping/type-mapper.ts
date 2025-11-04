import type { FieldType } from '@openzeppelin/ui-builder-types';

import {
  isArrayType,
  isBytesType,
  isMapType,
  isMaybeType,
  isUintType,
  isVectorType,
} from '../utils/type-helpers';

/**
 * Midnight Type Mapper
 *
 * Maps Midnight-specific types to UI Builder field types for form generation.
 *
 * IMPORTANT NOTES ON COMPACT LANGUAGE LIMITATIONS:
 *
 * While this adapter supports Map<K,V> and Struct types for parsing/formatting,
 * the Compact language has significant limitations that prevent their practical use:
 *
 * 1. Map<K,V>: Cannot be returned from export circuits due to lack of indexed iteration
 *    - Workaround: Use Vector<N, [K, V]> (array of tuples) instead
 *
 * 2. Struct: Construction fails in export circuits with "invalid context" error
 *    - Workaround: Use tuples [T1, T2, ...] instead of custom structs
 *
 * 3. Nested Tuples: [[T1,T2],[T3,T4]] rejected by Compact compiler
 *    - Workaround: Flatten to single-level tuples [T1, T2, T3, T4]
 *
 * For full details on Compact limitations, see:
 * - packages/adapter-midnight/TYPE-COVERAGE.md (section: "Limited Support")
 */

// --- Helpers --------------------------------------------------------------- //

function isPrimitive(type: string): 'bigint' | 'number' | 'boolean' | 'string' | null {
  const t = type.toLowerCase();
  if (t === 'bigint') return 'bigint';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'string') return 'string';
  return null;
}

function isOpaque(type: string): boolean {
  return /^Opaque<.+>$/i.test(type) || /^opaque<.+>$/i.test(type);
}

function looksLikeCustomType(type: string): boolean {
  // Heuristic: non-primitive, non-generic, starts with uppercase → custom type (enum/struct)
  if (
    isPrimitive(type) ||
    isArrayType(type).isArray ||
    isMaybeType(type).isMaybe ||
    isMapType(type).isMap
  ) {
    return false;
  }
  return !!type && type[0] === type[0].toUpperCase();
}

/**
 * Map a Midnight-specific parameter type to a default form field type.
 * Supports primitives, Uint8Array bytes, Array<T>, Maybe<T>, Map<K,V>, opaque, and custom types.
 */
export function mapMidnightParameterTypeToFieldType(parameterType: string): FieldType {
  // Maybe<T>: use inner type's default field
  const maybe = isMaybeType(parameterType);
  if (maybe.isMaybe && maybe.innerType) {
    return mapMidnightParameterTypeToFieldType(maybe.innerType);
  }

  // Array<T>: default to array; array-object will be chosen in field generation when element type is object-like
  const arr = isArrayType(parameterType);
  if (arr.isArray) {
    return 'array';
  }

  // Vector<N, T>
  const vec = isVectorType(parameterType);
  if (vec.isVector) {
    return 'array';
  }

  // Map<K,V>
  // NOTE: Map type is supported by the adapter for parsing/formatting, but Compact language
  // does not support practical Map usage in circuits (cannot iterate with indices, cannot
  // construct/return Maps from export circuits). Use Vector<N, [K, V]> instead.
  // See: TYPE-COVERAGE.md "Limited Support" section
  if (isMapType(parameterType).isMap) {
    return 'map' as FieldType;
  }

  // Primitives
  const prim = isPrimitive(parameterType);
  if (prim === 'bigint') return 'bigint';
  if (prim === 'number') return 'number';
  if (prim === 'boolean') return 'checkbox';
  if (prim === 'string') return 'text';

  // Bytes
  if (isBytesType(parameterType)) return 'bytes';

  // Uint<...> → number
  if (isUintType(parameterType)) return 'number';

  // Opaque<T>
  if (isOpaque(parameterType)) return 'text';

  // Custom types (enum/struct). Default to object in generation step; here prefer text to be conservative.
  if (looksLikeCustomType(parameterType)) {
    return 'text';
  }

  // Fallback
  return 'text';
}

/**
 * Get field types compatible with a specific parameter type.
 * Returns a prioritized list (first is the recommended default) and viable alternatives.
 */
export function getMidnightCompatibleFieldTypes(parameterType: string): FieldType[] {
  // Maybe<T> → same as inner
  const maybe = isMaybeType(parameterType);
  if (maybe.isMaybe && maybe.innerType) {
    return getMidnightCompatibleFieldTypes(maybe.innerType);
  }

  // Array<T>
  const arr = isArrayType(parameterType);
  if (arr.isArray) {
    // Allow both array and array-object as UI choices, plus fallbacks
    return ['array', 'array-object', 'textarea', 'text'];
  }

  // Map<K,V>
  // NOTE: Map type is supported by the adapter, but Compact language limitations prevent
  // practical Map usage in circuits. See Map<K,V> comment in mapMidnightParameterTypeToFieldType.
  if (isMapType(parameterType).isMap) {
    return ['map', 'textarea', 'text'];
  }

  // Primitives
  const prim = isPrimitive(parameterType);
  if (prim === 'bigint') return ['bigint', 'number', 'amount', 'text'];
  if (prim === 'number') return ['number', 'amount', 'text'];
  if (prim === 'boolean') return ['checkbox', 'select', 'radio', 'text'];
  if (prim === 'string') return ['text', 'textarea', 'email', 'password'];

  // Bytes
  if (isBytesType(parameterType)) return ['bytes', 'textarea', 'text'];

  // Opaque<T>
  if (isOpaque(parameterType)) return ['text', 'textarea'];

  // Custom types (enum/struct) → allow enum/object fallbacks plus text-based
  // NOTE: Struct types are supported by the adapter for parsing, but Compact language does not
  // support struct construction in export circuits (fails with "invalid context for reference to
  // struct name"). Use tuples [T1, T2] instead. Enums work fine.
  // See: TYPE-COVERAGE.md "Limited Support" section
  if (looksLikeCustomType(parameterType)) {
    return ['enum', 'object', 'textarea', 'text'];
  }

  // Fallback
  return ['text'];
}
