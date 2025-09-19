/**
 * Utility to add delay between operations
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes operations in batches with rate limiting to prevent API overload
 * @param operations - Array of functions that return promises
 * @param batchSize - Number of operations to execute in parallel per batch (default: 2)
 * @param delayMs - Delay in milliseconds between batches (default: 100)
 * @returns Promise that resolves to an array of results from all operations
 */
export async function rateLimitedBatch<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 2,
  delayMs: number = 100
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((operation) => operation()));
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < operations.length) {
      await delay(delayMs);
    }
  }

  return results;
}

/**
 * Wraps a promise with a timeout. Rejects with a descriptive Error after timeoutMs.
 *
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param label Optional label to include in the timeout error message
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label?: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label ?? 'operation'} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
