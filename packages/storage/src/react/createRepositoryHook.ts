import type Dexie from 'dexie';
import type { Table } from 'dexie';

import { createCrudHook, type CrudRepository } from './createCrudHook';
import { createJsonFileIO } from './createJsonFileIO';
import { createLiveQueryHook } from './createLiveQueryHook';

type OnError = (title: string, err: unknown) => void;

/**
 * Creates a comprehensive React hook that combines live queries, CRUD operations, file I/O,
 * and custom repository methods into a single, easy-to-use interface.
 *
 * This is the main factory function for creating repository hooks in your application.
 * It combines multiple lower-level hook factories to provide a complete data management solution.
 *
 * @template T The type of records in the repository
 * @template Extra Additional methods provided by the repository beyond basic CRUD
 * @param config Configuration object
 * @param config.db The Dexie database instance
 * @param config.tableName The name of the table to query
 * @param config.query Optional custom query function for the live query hook
 * @param config.repo The repository instance providing CRUD and custom methods
 * @param config.onError Optional error handler for all operations
 * @param config.fileIO Optional file I/O configuration for import/export
 * @param config.expose Optional function to expose custom repository methods in the hook
 * @returns A hook that provides records, loading state, CRUD operations, file I/O, and custom methods
 *
 * @example
 * ```typescript
 * const useMyData = createRepositoryHook({
 *   db: myDatabase,
 *   tableName: 'myTable',
 *   repo: myRepository,
 *   onError: (title, error) => toast.error(title),
 *   fileIO: {
 *     exportJson: (ids) => myRepository.export(ids),
 *     importJson: (json) => myRepository.import(json),
 *     filePrefix: 'my-data'
 *   },
 *   expose: (repo) => ({ customMethod: repo.customMethod })
 * });
 * ```
 */
export function createRepositoryHook<T, Extra extends object = object>(config: {
  db: Dexie;
  tableName: string;
  query?: (table: Table<T, string>) => Promise<T[]>;
  repo: CrudRepository<T> & Extra;
  onError?: OnError;
  fileIO?: {
    exportJson: (ids?: string[]) => Promise<string>;
    importJson: (json: string) => Promise<string[]>;
    filePrefix: string;
    shouldExport?: (parsed: unknown) => boolean;
  };
  expose?: (repo: CrudRepository<T> & Extra) => Record<string, unknown>;
}) {
  const useList = createLiveQueryHook<T>(config.db, config.tableName, config.query);
  const useCrud = createCrudHook<T>(config.repo, { onError: config.onError });

  const file = config.fileIO
    ? createJsonFileIO(
        {
          exportJson: config.fileIO.exportJson,
          importJson: config.fileIO.importJson,
        },
        {
          filePrefix: config.fileIO.filePrefix,
          onError: config.onError,
          shouldExport: config.fileIO.shouldExport,
        }
      )
    : undefined;

  const exposed = config.expose ? config.expose(config.repo) : {};

  return function useRepository() {
    const records = useList();
    const isLoading = records === undefined;
    const { save, update, remove, clear } = useCrud();

    return {
      records,
      isLoading,
      save,
      update,
      remove,
      clear,
      ...(file ? { exportAsFile: file.exportAsFile, importFromFile: file.importFromFile } : {}),
      ...exposed,
    } as const;
  };
}
