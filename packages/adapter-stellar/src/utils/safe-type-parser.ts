/**
 * Safe type parsing utilities for Stellar generic types.
 *
 * This module provides secure, performant alternatives to regex-based parsing
 * to prevent ReDoS (Regular Expression Denial of Service) attacks when processing
 * Stellar contract parameter types like Vec<T>, Map<K,V>, and Option<T>.
 *
 * Uses iterative parsing instead of vulnerable regex patterns with greedy quantifiers.
 */

/**
 * Configuration constants for safe parsing
 */
const PARSING_LIMITS = {
  /** Maximum depth for nested generic types to prevent stack overflow */
  MAX_NESTING_DEPTH: 10,
  /** Maximum string length for type parsing to prevent DoS */
  MAX_TYPE_STRING_LENGTH: 1000,
} as const;

/**
 * Result type for type extraction operations
 */
type ExtractionResult<T> = T | null;

/**
 * Safely extracts the inner type from a Stellar Vec type.
 *
 * @param parameterType - The parameter type (e.g., 'Vec<U32>', 'Vec<Vec<Address>>')
 * @returns The inner type (e.g., 'U32', 'Vec<Address>') or null if not a Vec type
 *
 * @example
 * ```typescript
 * extractVecElementType('Vec<U32>') // → 'U32'
 * extractVecElementType('Vec<Vec<Address>>') // → 'Vec<Address>'
 * extractVecElementType('U32') // → null
 * ```
 */
export function extractVecElementType(parameterType: string): ExtractionResult<string> {
  if (!isValidTypeString(parameterType) || !parameterType.startsWith('Vec<')) {
    return null;
  }

  return extractGenericInnerType(parameterType, 'Vec');
}

/**
 * Safely extracts the key and value types from a Stellar Map type.
 *
 * @param parameterType - The parameter type (e.g., 'Map<Symbol, Bytes>', 'Map<U32, Vec<Address>>')
 * @returns An object with keyType and valueType, or null if not a Map type
 *
 * @example
 * ```typescript
 * extractMapTypes('Map<U32, Address>') // → { keyType: 'U32', valueType: 'Address' }
 * extractMapTypes('Map<Symbol, Vec<U32>>') // → { keyType: 'Symbol', valueType: 'Vec<U32>' }
 * extractMapTypes('U32') // → null
 * ```
 */
export function extractMapTypes(
  parameterType: string
): ExtractionResult<{ keyType: string; valueType: string }> {
  if (!isValidTypeString(parameterType) || !parameterType.startsWith('Map<')) {
    return null;
  }

  const innerContent = extractGenericInnerType(parameterType, 'Map');
  if (!innerContent) {
    return null;
  }

  // Find the top-level comma that separates key and value types
  const commaIndex = findTopLevelComma(innerContent);
  if (commaIndex === -1) {
    return null;
  }

  const keyType = innerContent.slice(0, commaIndex).trim();
  const valueType = innerContent.slice(commaIndex + 1).trim();

  // Validate both types are non-empty and don't contain invalid characters
  if (!keyType || !valueType || hasInvalidCharacters(keyType) || hasInvalidCharacters(valueType)) {
    return null;
  }

  return { keyType, valueType };
}

/**
 * Safely extracts the inner type from a Stellar Option type.
 *
 * @param parameterType - The parameter type (e.g., 'Option<U32>', 'Option<Vec<Address>>')
 * @returns The inner type or null if not an Option type
 *
 * @example
 * ```typescript
 * extractOptionElementType('Option<U32>') // → 'U32'
 * extractOptionElementType('Option<Vec<Address>>') // → 'Vec<Address>'
 * extractOptionElementType('U32') // → null
 * ```
 */
export function extractOptionElementType(parameterType: string): ExtractionResult<string> {
  if (!isValidTypeString(parameterType) || !parameterType.startsWith('Option<')) {
    return null;
  }

  return extractGenericInnerType(parameterType, 'Option');
}

/**
 * Safely extracts the element types from a Stellar Tuple type.
 *
 * @param parameterType - The parameter type (e.g., 'Tuple<U32, Bool>')
 * @returns Array of element types or null if not a Tuple type
 */
export function extractTupleTypes(parameterType: string): ExtractionResult<string[]> {
  if (!isValidTypeString(parameterType) || !parameterType.startsWith('Tuple<')) {
    return null;
  }

  const innerContent = extractGenericInnerType(parameterType, 'Tuple');
  if (!innerContent) {
    return null;
  }

  const parts = splitTopLevelTypes(innerContent);
  if (parts.length === 0) {
    return null;
  }

  return parts;
}

/**
 * Generic function to extract inner content from generic types.
 *
 * @param parameterType - The full parameter type
 * @param genericName - The generic type name (e.g., 'Vec', 'Map', 'Option')
 * @returns The inner content or null if extraction fails
 */
function extractGenericInnerType(
  parameterType: string,
  genericName: string
): ExtractionResult<string> {
  const prefix = `${genericName}<`;

  if (!parameterType.startsWith(prefix) || !parameterType.endsWith('>')) {
    return null;
  }

  const innerContent = parameterType.slice(prefix.length, -1);

  if (!innerContent || hasInvalidCharacters(innerContent)) {
    return null;
  }

  // Validate that brackets are properly balanced
  if (!isBalancedBrackets(innerContent)) {
    return null;
  }

  return innerContent.trim();
}

/**
 * Finds the first top-level comma in a type string, ignoring commas inside nested brackets.
 *
 * @param content - The content to search in
 * @returns The index of the top-level comma, or -1 if not found
 *
 * @example
 * ```typescript
 * findTopLevelComma('U32, Address') // → 3
 * findTopLevelComma('Vec<U32, U64>, Address') // → 13 (after the first >)
 * ```
 */
function findTopLevelComma(content: string): number {
  let angleLevel = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    switch (char) {
      case '<':
        angleLevel++;
        break;
      case '>':
        angleLevel--;
        if (angleLevel < 0) return -1; // Malformed input
        break;
      case ',':
        if (angleLevel === 0) {
          return i;
        }
        break;
    }
  }

  return -1;
}

/**
 * Checks if brackets are properly balanced in a string and enforces nesting depth limits.
 *
 * @param content - The content to validate
 * @returns True if brackets are balanced and within depth limits, false otherwise
 */
function isBalancedBrackets(content: string): boolean {
  let angleLevel = 0;
  let maxNesting = 0;

  for (const char of content) {
    switch (char) {
      case '<':
        angleLevel++;
        maxNesting = Math.max(maxNesting, angleLevel);
        // Enforce nesting depth limit
        if (maxNesting > PARSING_LIMITS.MAX_NESTING_DEPTH) {
          return false;
        }
        break;
      case '>':
        angleLevel--;
        if (angleLevel < 0) return false;
        break;
    }
  }

  return angleLevel === 0;
}

/**
 * Validates that a type string is safe to process.
 *
 * @param typeString - The type string to validate
 * @returns True if the type string is safe to process
 */
export function isValidTypeString(typeString: string): boolean {
  if (!typeString || typeof typeString !== 'string') {
    return false;
  }

  // Length check to prevent DoS
  if (typeString.length > PARSING_LIMITS.MAX_TYPE_STRING_LENGTH) {
    return false;
  }

  // Check for invalid characters
  if (hasInvalidCharacters(typeString)) {
    return false;
  }

  // Validate bracket balance
  return isBalancedBrackets(typeString);
}

/**
 * Checks if a string contains invalid characters for type names.
 *
 * @param str - The string to check
 * @returns True if the string contains invalid characters
 */
function hasInvalidCharacters(str: string): boolean {
  // No control characters or line breaks
  if (/[\x00-\x1F\x7F\r\n]/.test(str)) {
    return true;
  }

  // Only allow alphanumeric, angle brackets, commas, underscores, and spaces
  // Note: Parentheses are NOT allowed in Stellar type strings
  return !/^[A-Za-z0-9<>,\s_]+$/.test(str);
}

/**
 * Splits a comma-separated list of types while respecting nested generics.
 */
function splitTopLevelTypes(content: string): string[] {
  const types: string[] = [];
  let start = 0;
  let level = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '<') {
      level++;
    } else if (char === '>') {
      level--;
    } else if (char === ',' && level === 0) {
      const segment = content.slice(start, i).trim();
      if (segment) {
        types.push(segment);
      }
      start = i + 1;
    }
  }

  const lastSegment = content.slice(start).trim();
  if (lastSegment) {
    types.push(lastSegment);
  }

  return types;
}
