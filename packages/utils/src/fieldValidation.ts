import type { FieldValidation } from '@openzeppelin/ui-builder-types';

/**
 * Numeric type bounds configuration.
 * Each adapter provides its own bounds map based on chain-specific type names.
 */
export type NumericBoundsMap = Record<string, { min?: number; max?: number }>;

/**
 * Enhances field validation with numeric bounds based on parameter type.
 * Only applies bounds if they are not already set in the validation object.
 *
 * @param validation - Existing validation rules (may be undefined)
 * @param parameterType - The blockchain parameter type (e.g., 'uint32', 'U32', 'Uint<0..255>')
 * @param boundsMap - Chain-specific map of type names to min/max bounds
 * @returns Enhanced validation object with numeric bounds applied
 *
 * @example
 * ```typescript
 * const stellarBounds = { U32: { min: 0, max: 4_294_967_295 } };
 * const validation = enhanceNumericValidation(undefined, 'U32', stellarBounds);
 * // Returns: { min: 0, max: 4_294_967_295 }
 * ```
 */
export function enhanceNumericValidation(
  validation: FieldValidation | undefined,
  parameterType: string,
  boundsMap: NumericBoundsMap
): FieldValidation {
  const result: FieldValidation = { ...(validation ?? {}) };
  const bounds = boundsMap[parameterType];

  if (!bounds) {
    return result;
  }

  // Only apply bounds if they're not already set
  if (bounds.min !== undefined && result.min === undefined) {
    result.min = bounds.min;
  }

  if (bounds.max !== undefined && result.max === undefined) {
    result.max = bounds.max;
  }

  return result;
}
