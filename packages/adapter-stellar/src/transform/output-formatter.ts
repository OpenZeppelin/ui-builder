import { scValToNative, xdr } from '@stellar/stellar-sdk';

import type { ContractFunction } from '@openzeppelin/ui-types';
import { bytesToHex, logger } from '@openzeppelin/ui-utils';

import { isSerializableObject, stringifyWithBigInt } from '../utils';

/**
 * Formats the result of a Stellar view function call into a user-friendly string.
 *
 * @param result The result value (can be ScVal, native JS value, or other types).
 * @param functionDetails The contract function details.
 * @returns A string representation suitable for display.
 */
export function formatStellarFunctionResult(
  result: unknown,
  functionDetails: ContractFunction
): string {
  if (!functionDetails.outputs || !Array.isArray(functionDetails.outputs)) {
    logger.warn(
      'formatStellarFunctionResult',
      `Output definition missing or invalid for function ${functionDetails.name}.`
    );
    return '[Error: Output definition missing]';
  }

  try {
    let valueToFormat: unknown;

    // Handle null/undefined values
    if (result === null || result === undefined) {
      return '(null)';
    }

    // Check if result is an ScVal and convert to native JS value
    if (isScVal(result)) {
      try {
        // Special handling for void ScVal
        const scVal = result as xdr.ScVal;
        if (scVal.switch().name === 'scvVoid') {
          return '(void)';
        }
        valueToFormat = scValToNative(scVal);

        // Convert Buffer to Uint8Array for cross-platform compatibility
        // scValToNative may return Buffer objects in some environments
        if (
          valueToFormat &&
          typeof valueToFormat === 'object' &&
          'constructor' in valueToFormat &&
          valueToFormat.constructor?.name === 'Buffer'
        ) {
          valueToFormat = new Uint8Array(valueToFormat as ArrayLike<number>);
        }
      } catch (error) {
        logger.error('formatStellarFunctionResult', 'Failed to convert ScVal to native', {
          functionName: functionDetails.name,
          error,
        });
        return '[Error: Failed to decode ScVal]';
      }
    } else {
      valueToFormat = result;
    }

    // Format based on type
    if (typeof valueToFormat === 'bigint') {
      return valueToFormat.toString();
    } else if (typeof valueToFormat === 'string') {
      return valueToFormat;
    } else if (typeof valueToFormat === 'number') {
      return valueToFormat.toString();
    } else if (typeof valueToFormat === 'boolean') {
      return String(valueToFormat);
    } else if (valueToFormat instanceof Uint8Array) {
      // Handle byte arrays - convert to hex string
      return bytesToHex(valueToFormat, true);
    } else if (Array.isArray(valueToFormat)) {
      // Handle arrays/vectors
      if (valueToFormat.length === 0) {
        return '[]';
      }
      // Use compact formatting for simple arrays, pretty formatting for complex ones
      if (
        valueToFormat.every(
          (item) =>
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean' ||
            typeof item === 'bigint'
        )
      ) {
        return stringifyWithBigInt(valueToFormat); // No spacing for simple arrays
      }
      return stringifyWithBigInt(valueToFormat, 2);
    } else if (isSerializableObject(valueToFormat)) {
      // Handle objects/maps/structs
      if (Object.keys(valueToFormat as object).length === 0) {
        return '{}';
      }
      return stringifyWithBigInt(valueToFormat, 2);
    } else if (valueToFormat === null || valueToFormat === undefined) {
      return '(null)';
    } else {
      // Handle any other type by stringifying
      return stringifyWithBigInt(valueToFormat, 2);
    }
  } catch (error) {
    const errorMessage = `Error formatting result for ${functionDetails.name}: ${(error as Error).message}`;
    logger.error('formatStellarFunctionResult', errorMessage, {
      functionName: functionDetails.name,
      result,
      error,
    });
    return `[${errorMessage}]`;
  }
}

/**
 * Type guard to check if a value is an ScVal
 */
function isScVal(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  try {
    // Use instanceof check for robust type detection
    return typeof xdr !== 'undefined' && xdr.ScVal && value instanceof xdr.ScVal;
  } catch {
    return false;
  }
}
