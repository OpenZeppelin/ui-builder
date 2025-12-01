import Dexie, { IndexableType, Table } from 'dexie';

import { generateId, logger } from '@openzeppelin/ui-builder-utils';

export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class DexieStorage<T extends BaseRecord> {
  protected table: Table<T>;

  constructor(
    protected db: Dexie,
    protected tableName: string
  ) {
    this.table = db.table(tableName);

    // Hook to auto-generate timestamps on creation
    this.table.hook('creating', function (_primKey, obj, _trans) {
      // 'this' context is the table
      obj.id = obj.id || generateId();
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    // Hook to update timestamp on modification
    this.table.hook('updating', function (modifications, _primKey, _obj, _trans) {
      // 'this' context is the table
      return { ...modifications, updatedAt: new Date() };
    });
  }

  async save(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = generateId();
      const fullRecord = {
        ...record,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;

      await this.table.add(fullRecord);
      logger.info(`${this.tableName} saved`, `ID: ${id}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to save ${this.tableName}`, errorMessage);
      throw new Error(`Failed to save ${this.tableName}`);
    }
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    try {
      // Remove fields that shouldn't be updated
      const { id: _, createdAt: _createdAt, ...validUpdates } = updates;

      // The updating hook will add updatedAt automatically
      // Note: We use 'any' type assertion here because Dexie's TypeScript definitions
      // for the update method have complex type constraints that don't play well with
      // our generic type T and the destructured Partial<T>. The type system expects
      // a more specific UpdateSpec<T> type, but creating it in a generic way that
      // satisfies TypeScript is problematic. Casting to 'any' is a pragmatic
      // workaround for this limitation.
      // For more context, see the Dexie roadmap for v5.0, which mentions plans for
      // improved type-safe declarations: https://dexie.org/roadmap/dexie5.0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await this.table.update(id, validUpdates as any);

      if (result === 0) {
        throw new Error(`No record found with id: ${id}`);
      }

      logger.info(`${this.tableName} updated`, `ID: ${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update ${this.tableName}`, errorMessage);
      throw new Error(`Failed to update ${this.tableName}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.table.delete(id);
      logger.info(`${this.tableName} deleted`, `ID: ${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete ${this.tableName}`, errorMessage);
      throw new Error(`Failed to delete ${this.tableName}`);
    }
  }

  async get(id: string): Promise<T | undefined> {
    try {
      return await this.table.get(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get ${this.tableName}`, errorMessage);
      throw new Error(`Failed to retrieve ${this.tableName}`);
    }
  }

  async getAll(): Promise<T[]> {
    try {
      return await this.table.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get all ${this.tableName}`, errorMessage);
      throw new Error(`Failed to retrieve ${this.tableName} records`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.table.clear();
      logger.info(`${this.tableName} storage cleared`, 'All records removed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to clear ${this.tableName}`, errorMessage);
      throw new Error(`Failed to clear ${this.tableName} records`);
    }
  }

  /**
   * Bulk add records to the table.
   * Note: Bulk operations do not trigger 'creating' hooks, so timestamps must be set manually.
   */
  async bulkAdd(records: T[]): Promise<string[]> {
    try {
      const keys = await this.table.bulkAdd(records, { allKeys: true });
      logger.info(`${this.tableName} bulk add`, `Count: ${keys.length}`);
      return keys as string[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to bulk add ${this.tableName}`, errorMessage);
      throw new Error(`Failed to bulk add ${this.tableName} records`);
    }
  }

  /**
   * Bulk put (upsert) records to the table.
   * Note: Bulk operations do not trigger hooks, so timestamps must be set manually.
   */
  async bulkPut(records: T[]): Promise<void> {
    try {
      await this.table.bulkPut(records);
      logger.info(`${this.tableName} bulk put`, `Count: ${records.length}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to bulk put ${this.tableName}`, errorMessage);
      throw new Error(`Failed to bulk put ${this.tableName} records`);
    }
  }

  /**
   * Bulk delete records by IDs.
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await this.table.bulkDelete(ids);
      logger.info(`${this.tableName} bulk delete`, `Count: ${ids.length}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to bulk delete ${this.tableName}`, errorMessage);
      throw new Error(`Failed to bulk delete ${this.tableName} records`);
    }
  }

  /**
   * Find records by an indexed field.
   * @param index - The index name (must be defined in the Dexie schema)
   * @param value - The value to search for
   * @returns Array of matching records
   */
  async findByIndex(index: string, value: IndexableType): Promise<T[]> {
    try {
      const results = await this.table.where(index).equals(value).toArray();
      logger.info(`${this.tableName} findByIndex`, `Index: ${index}, Count: ${results.length}`);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to findByIndex ${this.tableName}`, errorMessage);
      throw new Error(`Failed to query ${this.tableName} by index ${index}`);
    }
  }
}
