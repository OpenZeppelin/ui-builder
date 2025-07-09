/**
 * Utility to add delay between operations
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes queries in batches with rate limiting to prevent API overload
 * @param queries - Array of query functions that return promises
 * @param batchSize - Number of queries to execute in parallel per batch (default: 2)
 * @param delayMs - Delay in milliseconds between batches (default: 100)
 * @returns Promise that resolves to an array of results from all queries
 */
export async function rateLimitedQueries<T>(
  queries: (() => Promise<T>)[],
  batchSize: number = 2,
  delayMs: number = 100
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((query) => query()));
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < queries.length) {
      await delay(delayMs);
    }
  }

  return results;
}
