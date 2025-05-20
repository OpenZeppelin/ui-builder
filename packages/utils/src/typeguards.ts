/**
 * Type guard to check if a value is a non-null object (Record<string, unknown>).
 * Useful for safely accessing properties on an 'unknown' type after this check.
 * @param value - The value to check.
 * @returns True if the value is a non-null object, false otherwise.
 */
export function isRecordWithProperties(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Add other type guards here in the future if needed.
