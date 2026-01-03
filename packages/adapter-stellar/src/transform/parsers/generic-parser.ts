import { isMapEntryArray } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

const SYSTEM_LOG_TAG = 'GenericParser';

/**
 * Parses a generic type string and extracts the base type and parameters
 * @param typeString - Type like "Vec<U32>", "Map<U32,Address>", "Option<Vec<U32>>"
 * @returns Object with baseType and parameters, or null if not generic
 */
export function parseGenericType(typeString: string): {
  baseType: string;
  parameters: string[];
} | null {
  const match = typeString.match(/^(\w+)<(.*)>$/);
  if (!match) return null;

  const baseType = match[1];
  const paramString = match[2];

  // Handle nested generics by counting angle brackets
  const parameters: string[] = [];
  let current = '';
  let depth = 0;
  let i = 0;

  while (i < paramString.length) {
    const char = paramString[i];

    if (char === '<') {
      depth++;
      current += char;
    } else if (char === '>') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      parameters.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  if (current.trim()) {
    parameters.push(current.trim());
  }

  return { baseType, parameters };
}

/**
 * Parses generic types like Vec<T>, Map<K,V>, and Option<T>.
 *
 * @param value - The input value from the form
 * @param parameterType - The generic parameter type (e.g., 'Vec<U32>', 'Map<Symbol,Bytes>')
 * @param parseInnerValue - Function to recursively parse inner values
 * @returns The parsed value suitable for further processing
 */
export function parseGeneric(
  value: unknown,
  parameterType: string,
  parseInnerValue: (val: unknown, type: string) => unknown
): unknown {
  try {
    const genericInfo = parseGenericType(parameterType);
    if (!genericInfo) {
      return null; // Not a generic type
    }

    const { baseType, parameters } = genericInfo;

    switch (baseType) {
      case 'Vec': {
        // Handle Vec<T> types
        if (!Array.isArray(value)) {
          throw new Error(`Array expected for Vec type ${parameterType}, got ${typeof value}`);
        }

        const innerType = parameters[0];
        if (!innerType) {
          throw new Error(`Could not parse Vec inner type: ${parameterType}`);
        }

        return value.map((item) => parseInnerValue(item, innerType));
      }

      case 'Map': {
        // Handle Map<K,V> types
        if (!isMapEntryArray(value)) {
          throw new Error(`Array of MapEntry objects expected for Map type, got ${typeof value}`);
        }

        if (parameters.length < 2) {
          throw new Error(`Could not parse Map types: ${parameterType}`);
        }

        const mapKeyType = parameters[0];
        const mapValueType = parameters[1];

        // Convert MapEntry array to Stellar SDK expected format
        return value.map((entry) => ({
          0: {
            value: entry.key,
            type: mapKeyType,
          },
          1: {
            value: entry.value,
            type: mapValueType,
          },
        }));
      }

      case 'Option': {
        // Handle Option<T> types - empty string should be treated as null
        if (value === null || value === undefined || value === '') {
          return null;
        }

        const innerType = parameters[0];
        if (!innerType) {
          throw new Error(`Could not parse Option inner type: ${parameterType}`);
        }

        return parseInnerValue(value, innerType);
      }

      case 'Result': {
        // Handle Result<T,E> types (basic support)
        if (parameters.length < 2) {
          throw new Error(`Could not parse Result types: ${parameterType}`);
        }

        // Result types typically come as {ok: value} or {err: error}
        if (typeof value === 'object' && value !== null) {
          const resultObj = value as Record<string, unknown>;
          if ('ok' in resultObj) {
            return {
              ok: parseInnerValue(resultObj.ok, parameters[0]),
            };
          } else if ('err' in resultObj) {
            return {
              err: parseInnerValue(resultObj.err, parameters[1]),
            };
          }
        }

        return value; // Pass through if not in expected format
      }

      default:
        // Unknown generic type
        logger.warn(SYSTEM_LOG_TAG, `Unknown generic type: ${baseType}`);
        return null;
    }
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, `Failed to parse generic type ${parameterType}:`, error);
    throw error;
  }
}

/**
 * Checks if the given parameter type is a generic type that can be handled by this parser.
 *
 * @param parameterType - The Stellar parameter type
 * @returns True if this is a generic type
 */
export function isGenericType(parameterType: string): boolean {
  const genericInfo = parseGenericType(parameterType);
  return genericInfo !== null && ['Vec', 'Map', 'Option', 'Result'].includes(genericInfo.baseType);
}
