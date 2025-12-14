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

// ============================================================================
// Concurrency-Limited Execution
// ============================================================================
//
// These utilities provide controlled parallel execution with a concurrency limit.
//
// WHY USE THESE INSTEAD OF `rateLimitedBatch`?
//
// `rateLimitedBatch` processes operations in fixed-size batches with delays between
// batches. This is good for strict rate limiting but can leave capacity unused:
//   - Batch 1: [op1, op2] → wait for both → delay → Batch 2: [op3, op4] → ...
//   - If op1 finishes quickly, its slot sits idle until the entire batch completes.
//
// `promiseAllWithLimit` uses a worker pool approach with a sliding window:
//   - Maintains N concurrent operations at all times (where N = limit)
//   - As soon as one operation completes, the next one starts immediately
//   - No artificial delays between operations
//   - Maximizes throughput while respecting the concurrency limit
//
// USE CASES:
// - `rateLimitedBatch`: When you need enforced pauses (e.g., API rate limits with
//   explicit wait requirements, or when you want predictable batch timing)
// - `promiseAllWithLimit`: When you want maximum throughput without overwhelming
//   the target service (e.g., RPC endpoints, database connections)
//
// ============================================================================

/**
 * Default concurrency limit for parallel operations.
 * Set to a reasonable value that balances performance and service limits.
 */
export const DEFAULT_CONCURRENCY_LIMIT = 10;

/**
 * Execute an array of promise-returning functions with a concurrency limit.
 *
 * Uses a worker pool approach that maintains up to `limit` concurrent operations.
 * As soon as one operation completes, the next one starts immediately, maximizing
 * throughput while respecting the concurrency limit.
 *
 * Results are returned in the same order as the input tasks, regardless of
 * completion order.
 *
 * @param tasks Array of functions that return promises
 * @param limit Maximum number of concurrent executions (default: 10)
 * @returns Promise resolving to array of results in same order as input tasks
 *
 * @example
 * ```typescript
 * // Fetch 100 role members with max 10 concurrent RPC requests
 * const tasks = memberIndices.map((index) => () => getRoleMember(contract, role, index));
 * const members = await promiseAllWithLimit(tasks, 10);
 * ```
 */
export async function promiseAllWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = DEFAULT_CONCURRENCY_LIMIT
): Promise<T[]> {
  if (tasks.length === 0) {
    return [];
  }

  // If limit is greater than or equal to task count, just use Promise.all
  if (limit >= tasks.length) {
    return Promise.all(tasks.map((task) => task()));
  }

  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  // Worker function that processes tasks from the queue
  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      const task = tasks[index];
      results[index] = await task();
    }
  }

  // Create worker promises up to the concurrency limit
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());

  await Promise.all(workers);

  return results;
}

/**
 * Execute an array of promise-returning functions with a concurrency limit,
 * settling all promises (similar to Promise.allSettled but with concurrency control).
 *
 * Unlike promiseAllWithLimit, this function does not fail fast on errors.
 * All tasks will be executed regardless of individual failures.
 *
 * @param tasks Array of functions that return promises
 * @param limit Maximum number of concurrent executions (default: 10)
 * @returns Promise resolving to array of settled results in same order as input tasks
 *
 * @example
 * ```typescript
 * const tasks = items.map((item) => () => fetchItem(item.id));
 * const results = await promiseAllSettledWithLimit(tasks, 10);
 *
 * for (const result of results) {
 *   if (result.status === 'fulfilled') {
 *     console.log('Success:', result.value);
 *   } else {
 *     console.log('Failed:', result.reason);
 *   }
 * }
 * ```
 */
export async function promiseAllSettledWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = DEFAULT_CONCURRENCY_LIMIT
): Promise<PromiseSettledResult<T>[]> {
  if (tasks.length === 0) {
    return [];
  }

  // If limit is greater than or equal to task count, just use Promise.allSettled
  if (limit >= tasks.length) {
    return Promise.allSettled(tasks.map((task) => task()));
  }

  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let currentIndex = 0;

  // Worker function that processes tasks from the queue
  async function worker(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      const task = tasks[index];
      try {
        const value = await task();
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  // Create worker promises up to the concurrency limit
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());

  await Promise.all(workers);

  return results;
}
