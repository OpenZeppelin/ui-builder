import type Dexie from 'dexie';
import type { Table } from 'dexie';

import { createCrudHook, type CrudRepository } from './createCrudHook';
import { createJsonFileIO } from './createJsonFileIO';
import { createLiveQueryHook } from './createLiveQueryHook';

type OnError = (title: string, err: unknown) => void;

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
        { filePrefix: config.fileIO.filePrefix, onError: config.onError }
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
