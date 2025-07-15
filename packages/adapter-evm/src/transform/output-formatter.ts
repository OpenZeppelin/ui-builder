import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';

import { stringifyWithBigInt } from '../utils';

/**
 * Formats the decoded result of an EVM view function call into a user-friendly string.
 *
 * @param decodedValue The decoded value (can be primitive, array, object, BigInt).
 * @param functionDetails The ABI details of the function called.
 * @returns A string representation suitable for display.
 */
export function formatEvmFunctionResult(
  decodedValue: unknown,
  functionDetails: ContractFunction
): string {
  if (!functionDetails.outputs || !Array.isArray(functionDetails.outputs)) {
    console.warn(
      `formatEvmFunctionResult: Output ABI definition missing or invalid for function ${functionDetails.name}.`
    );
    return '[Error: Output ABI definition missing]';
  }

  try {
    let valueToFormat: unknown;
    // Handle potential array wrapping for single returns from viem
    if (Array.isArray(decodedValue)) {
      if (decodedValue.length === 1) {
        valueToFormat = decodedValue[0]; // Single output, format the inner value
      } else {
        // Multiple outputs, format the whole array as JSON
        valueToFormat = decodedValue;
      }
    } else {
      // Not an array, could be a single value (like from a struct return) or undefined
      valueToFormat = decodedValue;
    }

    // Format based on type
    if (typeof valueToFormat === 'bigint') {
      return valueToFormat.toString();
    } else if (
      typeof valueToFormat === 'string' ||
      typeof valueToFormat === 'number' ||
      typeof valueToFormat === 'boolean'
    ) {
      return String(valueToFormat);
    } else if (valueToFormat === null || valueToFormat === undefined) {
      return '(null)'; // Represent null/undefined clearly
    } else {
      // Handles arrays with multiple elements or objects (structs) by stringifying
      return stringifyWithBigInt(valueToFormat, 2); // Pretty print with 2 spaces
    }
  } catch (error) {
    const errorMessage = `Error formatting result for ${functionDetails.name}: ${(error as Error).message}`;
    console.error(`formatEvmFunctionResult Error: ${errorMessage}`, {
      functionName: functionDetails.name,
      decodedValue,
      error,
    });
    return `[${errorMessage}]`;
  }
}
