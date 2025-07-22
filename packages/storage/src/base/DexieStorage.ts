import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
      obj.id = obj.id || uuidv4();
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
      const id = uuidv4();
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
}
