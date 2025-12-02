/**
 * Shared utilities for storage classes.
 */

/**
 * Checks if an error is a quota exceeded error.
 * Handles cross-browser differences in error reporting.
 *
 * @param err - The error to check
 * @returns true if the error indicates storage quota was exceeded
 */
export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number; message?: string } | null | undefined;
  return (
    e?.name === 'QuotaExceededError' ||
    e?.code === 22 || // Safari iOS
    (typeof e?.message === 'string' && e.message.toLowerCase().includes('quota'))
  );
}

/**
 * Wraps an async operation with quota error handling.
 * Converts quota errors to a standardized error format with the original as cause.
 *
 * @param tableName - The table name for error message context
 * @param operation - The async operation to execute
 * @returns The result of the operation
 * @throws Error with message `${tableName}/quota-exceeded` if quota is exceeded
 */
export async function withQuotaHandling<T>(
  tableName: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (isQuotaError(err)) {
      const e = new Error(`${tableName}/quota-exceeded`) as Error & { cause?: unknown };
      e.cause = err;
      throw e;
    }
    throw err;
  }
}
