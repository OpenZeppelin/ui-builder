import Dexie, { IndexableType, Table } from 'dexie';

import { generateId, logger } from '@openzeppelin/ui-builder-utils';

import { withQuotaHandling } from './utils';

/**
 * Base record type for entity storage.
 * All entities have auto-generated IDs and managed timestamps.
 */
export interface BaseRecord {
  /** Auto-generated unique identifier */
  id: string;
  /** Timestamp when the record was created */
  createdAt: Date;
  /** Timestamp when the record was last updated */
  updatedAt: Date;
}

/**
 * Configuration options for EntityStorage.
 */
export interface EntityStorageOptions {
  /**
   * Maximum size in bytes for a single record when serialized.
   * Default: 10MB. Set higher for records containing large data like source code.
   */
  maxRecordSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<EntityStorageOptions> = {
  maxRecordSizeBytes: 10 * 1024 * 1024, // 10MB default
};

/**
 * Abstract base class for entity storage using IndexedDB via Dexie.
 *
 * Use this class for storing collections of entities/records where each
 * record has an auto-generated `id` and managed timestamps.
 *
 * For key-value storage (settings, preferences), use `KeyValueStorage` instead.
 *
 * @example
 * ```typescript
 * import { EntityStorage, createDexieDatabase } from '@openzeppelin/ui-builder-storage';
 *
 * interface UserRecord extends BaseRecord {
 *   name: string;
 *   email: string;
 * }
 *
 * const db = createDexieDatabase('MyApp', [{
 *   version: 1,
 *   stores: { users: '++id, email, createdAt, updatedAt' }
 * }]);
 *
 * class UserStorage extends EntityStorage<UserRecord> {
 *   constructor() {
 *     super(db, 'users');
 *   }
 *
 *   async findByEmail(email: string): Promise<UserRecord | undefined> {
 *     const results = await this.findByIndex('email', email);
 *     return results[0];
 *   }
 * }
 * ```
 *
 * @typeParam T - The record type (must extend BaseRecord)
 */
export abstract class EntityStorage<T extends BaseRecord> {
  protected table: Table<T>;
  protected options: Required<EntityStorageOptions>;

  constructor(
    protected db: Dexie,
    protected tableName: string,
    options?: EntityStorageOptions
  ) {
    this.table = db.table(tableName);
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Hook to auto-generate timestamps on creation
    this.table.hook('creating', function (_primKey, obj, _trans) {
      obj.id = obj.id || generateId();
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    // Hook to update timestamp on modification
    this.table.hook('updating', function (modifications, _primKey, _obj, _trans) {
      return { ...modifications, updatedAt: new Date() };
    });
  }

  /**
   * Validates a record before storage.
   * Override in subclasses for custom validation.
   *
   * @param record - The record to validate
   * @throws Error if validation fails
   */
  protected validateRecord(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Check serialized size
    try {
      const serialized = JSON.stringify(record);
      if (serialized.length > this.options.maxRecordSizeBytes) {
        throw new Error(`${this.tableName}/record-too-large`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('record-too-large')) {
        throw err;
      }
      throw new Error(`${this.tableName}/record-not-serializable`);
    }
  }

  /**
   * Saves a new record to storage.
   *
   * @param record - The record data (without id, createdAt, updatedAt)
   * @returns The generated ID of the saved record
   * @throws Error if validation fails or quota is exceeded
   */
  async save(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateRecord(record);

    return await withQuotaHandling(this.tableName, async () => {
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
    });
  }

  /**
   * Updates an existing record.
   *
   * @param id - The record ID to update
   * @param updates - Partial record with fields to update
   * @throws Error if record not found, validation fails, or quota is exceeded
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    return await withQuotaHandling(this.tableName, async () => {
      // Fetch existing record to validate merged size
      const existing = await this.table.get(id);
      if (!existing) {
        throw new Error(`No record found with id: ${id}`);
      }

      // Remove fields that shouldn't be updated
      const { id: _, createdAt: _createdAt, ...validUpdates } = updates;

      // Validate merged record size
      const {
        id: _existingId,
        createdAt: _existingCreatedAt,
        updatedAt: _existingUpdatedAt,
        ...existingData
      } = existing;
      const mergedData = { ...existingData, ...validUpdates };
      this.validateRecord(mergedData as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);

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
    });
  }

  /**
   * Deletes a record by ID.
   *
   * @param id - The record ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.table.delete(id);
    logger.info(`${this.tableName} deleted`, `ID: ${id}`);
  }

  /**
   * Gets a record by ID.
   *
   * @param id - The record ID to retrieve
   * @returns The record, or undefined if not found
   */
  async get(id: string): Promise<T | undefined> {
    return await this.table.get(id);
  }

  /**
   * Gets all records, ordered by updatedAt descending (most recent first).
   *
   * @returns Array of all records
   */
  async getAll(): Promise<T[]> {
    return await this.table.orderBy('updatedAt').reverse().toArray();
  }

  /**
   * Clears all records from the table.
   */
  async clear(): Promise<void> {
    await this.table.clear();
    logger.info(`${this.tableName} storage cleared`, 'All records removed');
  }

  /**
   * Checks if a record exists by ID.
   *
   * @param id - The record ID to check
   * @returns true if the record exists
   */
  async has(id: string): Promise<boolean> {
    const record = await this.table.get(id);
    return record !== undefined;
  }

  /**
   * Gets the count of records in the table.
   *
   * @returns The number of records
   */
  async count(): Promise<number> {
    return await this.table.count();
  }

  /**
   * Bulk add records to the table.
   * Note: Bulk operations do not trigger 'creating' hooks, so timestamps must be set manually.
   *
   * @param records - Array of complete records to add
   * @returns Array of generated IDs
   * @throws Error if any record exceeds size limit or quota is exceeded
   */
  async bulkAdd(records: T[]): Promise<string[]> {
    // Validate all records first
    for (const record of records) {
      const { id: _, createdAt: _createdAt, updatedAt: _updatedAt, ...recordData } = record;
      this.validateRecord(recordData as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
    }

    return await withQuotaHandling(this.tableName, async () => {
      const keys = await this.table.bulkAdd(records, { allKeys: true });
      logger.info(`${this.tableName} bulk add`, `Count: ${keys.length}`);
      return keys as string[];
    });
  }

  /**
   * Bulk put (upsert) records to the table.
   * Note: Bulk operations do not trigger hooks, so timestamps must be set manually.
   *
   * @param records - Array of complete records to upsert
   * @throws Error if any record exceeds size limit or quota is exceeded
   */
  async bulkPut(records: T[]): Promise<void> {
    // Validate all records first
    for (const record of records) {
      const { id: _, createdAt: _createdAt, updatedAt: _updatedAt, ...recordData } = record;
      this.validateRecord(recordData as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
    }

    return await withQuotaHandling(this.tableName, async () => {
      await this.table.bulkPut(records);
      logger.info(`${this.tableName} bulk put`, `Count: ${records.length}`);
    });
  }

  /**
   * Bulk delete records by IDs.
   *
   * @param ids - Array of record IDs to delete
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await this.table.bulkDelete(ids);
    logger.info(`${this.tableName} bulk delete`, `Count: ${ids.length}`);
  }

  /**
   * Find records by an indexed field.
   *
   * @param index - The index name (must be defined in the Dexie schema)
   * @param value - The value to search for
   * @returns Array of matching records
   */
  async findByIndex(index: string, value: IndexableType): Promise<T[]> {
    const results = await this.table.where(index).equals(value).toArray();
    logger.info(`${this.tableName} findByIndex`, `Index: ${index}, Count: ${results.length}`);
    return results;
  }
}
