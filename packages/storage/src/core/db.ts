import Dexie, { Transaction } from 'dexie';

export interface DbVersion {
  version: number;
  stores: Record<string, string>;
  upgrade?: (trans: Transaction) => void | Promise<void>;
}

/**
 * Creates a configured Dexie database instance with versioned stores.
 *
 * @param name - Database name (e.g., 'UIBuilder', 'RoleManager')
 * @param versions - Array of version definitions with stores and optional upgrade functions
 * @returns Configured Dexie database instance
 *
 * @example
 * ```ts
 * const db = createDexieDatabase('MyApp', [
 *   {
 *     version: 1,
 *     stores: { items: '++id, name, createdAt' }
 *   },
 *   {
 *     version: 2,
 *     stores: { items: '++id, name, createdAt, updatedAt' },
 *     upgrade: async (trans) => {
 *       // Migration logic - access db via trans.db if needed
 *     }
 *   }
 * ]);
 * ```
 */
export function createDexieDatabase(name: string, versions: DbVersion[]): Dexie {
  const db = new Dexie(name);

  for (const version of versions) {
    const versionDef = db.version(version.version).stores(version.stores);
    if (version.upgrade) {
      versionDef.upgrade(version.upgrade);
    }
  }

  return db;
}
