import type Dexie from 'dexie';
import type { Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

export function createLiveQueryHook<T>(
  db: Dexie,
  tableName: string,
  query?: (table: Table<T, string>) => Promise<T[]>
) {
  return function useTable(): T[] | undefined {
    return useLiveQuery(() => {
      const table = db.table<T, string>(tableName);
      if (query) return query(table);
      return table.toArray();
    });
  };
}
