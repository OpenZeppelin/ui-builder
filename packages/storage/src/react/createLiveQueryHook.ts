import type Dexie from 'dexie';
import type { Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Creates a React hook for live queries on a Dexie table that automatically updates when data changes.
 *
 * @template T The type of records in the table
 * @param db The Dexie database instance
 * @param tableName The name of the table to query
 * @param query Optional custom query function. If omitted, returns all records from the table.
 * @returns A hook that returns the query results or undefined while loading
 */
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
