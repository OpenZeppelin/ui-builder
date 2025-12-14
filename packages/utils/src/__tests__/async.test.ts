/**
 * Unit tests for async utility functions
 *
 * Tests controlled concurrency for parallel operations
 */
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CONCURRENCY_LIMIT,
  promiseAllSettledWithLimit,
  promiseAllWithLimit,
} from '../async';

describe('Concurrency-Limited Execution', () => {
  describe('promiseAllWithLimit', () => {
    it('should execute all tasks and return results in order', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

      const results = await promiseAllWithLimit(tasks, 2);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should return empty array for empty tasks', async () => {
      const results = await promiseAllWithLimit([], 2);

      expect(results).toEqual([]);
    });

    it('should respect concurrency limit', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = (value: number) => async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);

        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 10));

        concurrentCount--;
        return value;
      };

      const tasks = [
        createTask(1),
        createTask(2),
        createTask(3),
        createTask(4),
        createTask(5),
        createTask(6),
      ];

      const results = await promiseAllWithLimit(tasks, 2);

      expect(results).toEqual([1, 2, 3, 4, 5, 6]);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should use Promise.all when limit >= task count', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];

      const results = await promiseAllWithLimit(tasks, 10);

      expect(results).toEqual([1, 2]);
    });

    it('should propagate errors immediately (fail fast)', async () => {
      const error = new Error('Task failed');
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(error),
        () => Promise.resolve(3),
      ];

      await expect(promiseAllWithLimit(tasks, 2)).rejects.toThrow('Task failed');
    });

    it('should use DEFAULT_CONCURRENCY_LIMIT when no limit specified', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = (value: number) => async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((resolve) => setTimeout(resolve, 5));
        concurrentCount--;
        return value;
      };

      // Create more tasks than the default limit
      const tasks = Array.from({ length: 20 }, (_, i) => createTask(i));

      const results = await promiseAllWithLimit(tasks);

      expect(results).toHaveLength(20);
      expect(maxConcurrent).toBeLessThanOrEqual(DEFAULT_CONCURRENCY_LIMIT);
    });

    it('should maintain result order regardless of completion order', async () => {
      const tasks = [
        () => new Promise<number>((resolve) => setTimeout(() => resolve(1), 30)), // Slowest
        () => new Promise<number>((resolve) => setTimeout(() => resolve(2), 10)), // Fastest
        () => new Promise<number>((resolve) => setTimeout(() => resolve(3), 20)), // Medium
      ];

      const results = await promiseAllWithLimit(tasks, 3);

      // Results should be in original order, not completion order
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle tasks that throw synchronously', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => {
          throw new Error('Sync error');
        },
        () => Promise.resolve(3),
      ];

      await expect(promiseAllWithLimit(tasks as (() => Promise<number>)[], 2)).rejects.toThrow(
        'Sync error'
      );
    });
  });

  describe('promiseAllSettledWithLimit', () => {
    it('should execute all tasks and return settled results in order', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

      const results = await promiseAllSettledWithLimit(tasks, 2);

      expect(results).toEqual([
        { status: 'fulfilled', value: 1 },
        { status: 'fulfilled', value: 2 },
        { status: 'fulfilled', value: 3 },
      ]);
    });

    it('should return empty array for empty tasks', async () => {
      const results = await promiseAllSettledWithLimit([], 2);

      expect(results).toEqual([]);
    });

    it('should not fail fast on errors', async () => {
      const error = new Error('Task failed');
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(error),
        () => Promise.resolve(3),
      ];

      const results = await promiseAllSettledWithLimit(tasks, 2);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
      expect(results[1]).toEqual({ status: 'rejected', reason: error });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
    });

    it('should respect concurrency limit', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = (value: number) => async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrentCount--;
        return value;
      };

      const tasks = [
        createTask(1),
        createTask(2),
        createTask(3),
        createTask(4),
        createTask(5),
        createTask(6),
      ];

      const results = await promiseAllSettledWithLimit(tasks, 2);

      expect(results).toHaveLength(6);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should use Promise.allSettled when limit >= task count', async () => {
      const error = new Error('Task failed');
      const tasks = [() => Promise.resolve(1), () => Promise.reject(error)];

      const results = await promiseAllSettledWithLimit(tasks, 10);

      expect(results).toEqual([
        { status: 'fulfilled', value: 1 },
        { status: 'rejected', reason: error },
      ]);
    });

    it('should handle all tasks failing', async () => {
      const errors = [new Error('Error 1'), new Error('Error 2'), new Error('Error 3')];

      const tasks = errors.map((e) => () => Promise.reject(e));

      const results = await promiseAllSettledWithLimit(tasks, 2);

      expect(results).toEqual([
        { status: 'rejected', reason: errors[0] },
        { status: 'rejected', reason: errors[1] },
        { status: 'rejected', reason: errors[2] },
      ]);
    });

    it('should maintain result order regardless of completion order', async () => {
      const tasks = [
        () => new Promise<number>((resolve) => setTimeout(() => resolve(1), 30)),
        () => new Promise<number>((resolve) => setTimeout(() => resolve(2), 10)),
        () => new Promise<number>((_, reject) => setTimeout(() => reject(new Error('fail')), 20)),
      ];

      const results = await promiseAllSettledWithLimit(tasks, 3);

      expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
      expect(results[1]).toEqual({ status: 'fulfilled', value: 2 });
      expect(results[2].status).toBe('rejected');
    });
  });

  describe('DEFAULT_CONCURRENCY_LIMIT', () => {
    it('should be a positive number', () => {
      expect(DEFAULT_CONCURRENCY_LIMIT).toBeGreaterThan(0);
    });

    it('should be 10 (reasonable default for RPC endpoints)', () => {
      expect(DEFAULT_CONCURRENCY_LIMIT).toBe(10);
    });
  });
});
