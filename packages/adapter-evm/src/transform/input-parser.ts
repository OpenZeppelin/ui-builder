import { getAddress, isAddress } from 'viem';

import type { FunctionParameter } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * Recursively parses a raw input value based on its expected ABI type definition.
 *
 * @param param The ABI parameter definition ({ name, type, components?, ... })
 * @param rawValue The raw value obtained from the form input or hardcoded config.
 * @param isRecursive Internal flag to indicate if the call is nested.
 * @returns The parsed and typed value suitable for ABI encoding.
 * @throws {Error} If parsing or type validation fails.
 */
export function parseEvmInput(
  param: FunctionParameter,
  rawValue: unknown,
  isRecursive = false
): unknown {
  const { type, name } = param;
  const baseType = type.replace(/\[\d*\]$/, ''); // Remove array indicators like `[]` or `[2]`
  const isArray = type.endsWith(']');

  try {
    // --- Handle Arrays --- //
    if (isArray) {
      // Only expect string at the top level, recursive calls get arrays directly
      let parsedArray: unknown[];
      if (!isRecursive) {
        if (typeof rawValue !== 'string') {
          throw new Error('Array input must be a JSON string representation.');
        }
        try {
          parsedArray = JSON.parse(rawValue);
        } catch (e) {
          throw new Error(`Invalid JSON for array: ${(e as Error).message}`);
        }
      } else {
        // If recursive, rawValue should already be an array
        if (!Array.isArray(rawValue)) {
          throw new Error('Internal error: Expected array in recursive call.');
        }
        parsedArray = rawValue;
      }

      if (!Array.isArray(parsedArray)) {
        // Double check after parsing/assignment
        throw new Error('Parsed JSON is not an array.');
      }

      // Recursively parse each element
      const itemAbiParam = { ...param, type: baseType }; // Create a dummy param for the base type
      return parsedArray.map((item) => parseEvmInput(itemAbiParam, item, true)); // Pass isRecursive=true
    }

    // --- Handle Tuples --- //
    if (baseType === 'tuple') {
      if (!param.components) {
        throw new Error(`ABI definition missing 'components' for tuple parameter '${name}'.`);
      }
      // Only expect string at the top level, recursive calls get objects directly
      let parsedObject: Record<string, unknown>;
      if (!isRecursive) {
        if (typeof rawValue !== 'string') {
          throw new Error('Tuple input must be a JSON string representation of an object.');
        }
        try {
          parsedObject = JSON.parse(rawValue);
        } catch (e) {
          throw new Error(`Invalid JSON for tuple: ${(e as Error).message}`);
        }
      } else {
        // If recursive, rawValue should already be an object
        if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
          throw new Error('Internal error: Expected object in recursive tuple call.');
        }
        parsedObject = rawValue as Record<string, unknown>; // Cast needed
      }

      if (
        typeof parsedObject !== 'object' ||
        parsedObject === null ||
        Array.isArray(parsedObject)
      ) {
        // Double check
        throw new Error('Parsed JSON is not an object for tuple.');
      }

      // Recursively parse each component
      const resultObject: Record<string, unknown> = {};
      for (const component of param.components) {
        if (!(component.name in parsedObject)) {
          throw new Error(`Missing component '${component.name}' in tuple JSON.`);
        }
        resultObject[component.name] = parseEvmInput(
          component,
          parsedObject[component.name],
          true // Pass isRecursive=true
        );
      }
      // Check for extra, unexpected keys in the provided JSON object
      if (Object.keys(parsedObject).length !== param.components.length) {
        const expectedKeys = param.components.map((c) => c.name).join(', ');
        const actualKeys = Object.keys(parsedObject).join(', ');
        throw new Error(
          `Tuple object has incorrect number of keys. Expected ${param.components.length} (${expectedKeys}), but got ${Object.keys(parsedObject).length} (${actualKeys}).`
        );
      }
      return resultObject;
    }

    // --- Handle Bytes --- //
    if (baseType.startsWith('bytes')) {
      if (typeof rawValue !== 'string') {
        throw new Error('Bytes input must be a string.');
      }
      if (!/^0x([0-9a-fA-F]{2})*$/.test(rawValue)) {
        throw new Error(
          `Invalid hex string format for ${type}: must start with 0x and contain only hex characters.`
        );
      }
      // Check byte length for fixed-size bytes? (e.g., bytes32)
      const fixedSizeMatch = baseType.match(/^bytes(\d+)$/);
      if (fixedSizeMatch) {
        const expectedBytes = parseInt(fixedSizeMatch[1], 10);
        const actualBytes = (rawValue.length - 2) / 2;
        if (actualBytes !== expectedBytes) {
          throw new Error(
            `Invalid length for ${type}: expected ${expectedBytes} bytes (${expectedBytes * 2} hex chars), got ${actualBytes} bytes.`
          );
        }
      }
      return rawValue as `0x${string}`; // Already validated, cast to viem type
    }

    // --- Handle Simple Types --- //
    if (baseType.startsWith('uint') || baseType.startsWith('int')) {
      if (rawValue === '' || rawValue === null || rawValue === undefined)
        throw new Error('Numeric value cannot be empty.');
      try {
        // Use BigInt for all integer types
        return BigInt(rawValue as string | number | bigint);
      } catch {
        throw new Error(`Invalid numeric value: '${rawValue}'.`);
      }
    } else if (baseType === 'address') {
      if (typeof rawValue !== 'string' || !rawValue)
        throw new Error('Address value must be a non-empty string.');
      if (!isAddress(rawValue)) throw new Error(`Invalid address format: '${rawValue}'.`);
      return getAddress(rawValue); // Return checksummed address
    } else if (baseType === 'bool') {
      if (typeof rawValue === 'boolean') return rawValue;
      if (typeof rawValue === 'string') {
        const lowerVal = rawValue.toLowerCase().trim();
        if (lowerVal === 'true') return true;
        if (lowerVal === 'false') return false;
      }
      // Try simple truthy/falsy conversion as fallback
      return Boolean(rawValue);
    } else if (baseType === 'string') {
      // Ensure it's treated as a string
      return String(rawValue);
    }

    // --- Fallback for unknown types --- //
    logger.warn('parseEvmInput', `Unknown EVM parameter type encountered: '${type}'. Using raw value.`);
    return rawValue;
  } catch (error) {
    // Add parameter context to the error message
    throw new Error(
      `Failed to parse value for parameter '${name || '(unnamed)'}' (type '${type}'): ${(error as Error).message}`
    );
  }
}
