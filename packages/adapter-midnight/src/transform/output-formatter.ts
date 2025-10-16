import type { ContractFunction } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Formats the decoded result of a Midnight view function call into a user-friendly string.
 *
 * @param decodedValue The decoded value (can be primitive, array, object, BigInt).
 * @param functionDetails The contract function details.
 * @returns A string representation suitable for display.
 */
export function formatMidnightFunctionResult(
  decodedValue: unknown,
  functionDetails: ContractFunction
): string {
  if (!functionDetails.outputs || !Array.isArray(functionDetails.outputs)) {
    logger.warn(
      'formatMidnightFunctionResult',
      `Output definition missing or invalid for function ${functionDetails.name}.`
    );
    return '[Error: Output definition missing]';
  }

  try {
    // Handle null/undefined values
    if (decodedValue === null || decodedValue === undefined) {
      return '(null)';
    }

    // Format based on type
    if (typeof decodedValue === 'bigint') {
      return decodedValue.toString();
    } else if (
      typeof decodedValue === 'string' ||
      typeof decodedValue === 'number' ||
      typeof decodedValue === 'boolean'
    ) {
      return String(decodedValue); // No quotes for primitives
    } else {
      // For complex objects/arrays, use JSON.stringify with BigInt support
      return JSON.stringify(
        decodedValue,
        (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
    }
  } catch (error) {
    const errorMessage = `Error formatting result for ${functionDetails.name}: ${(error as Error).message}`;
    logger.error('formatMidnightFunctionResult', errorMessage, {
      functionName: functionDetails.name,
      decodedValue,
      error,
    });
    return `[${errorMessage}]`;
  }
}
