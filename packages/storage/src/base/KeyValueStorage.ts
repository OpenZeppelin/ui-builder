import Dexie, { Table } from 'dexie';

import { logger } from '@openzeppelin/ui-builder-utils';

import { withQuotaHandling } from './utils';

/**
 * Base record type for key-value storage.
 * Uses `key` as the primary identifier instead of `id`.
 */
export interface KeyValueRecord<V = unknown> {
  /** The unique key (primary key) */
  key: string;
  /** The stored value */
  value: V;
  /** Timestamp when the record was first created */
  createdAt: Date;
  /** Timestamp when the record was last updated */
  updatedAt: Date;
}

/**
 * Configuration options for KeyValueStorage.
 */
export interface KeyValueStorageOptions {
  /** Maximum length for keys (default: 128) */
  maxKeyLength?: number;
  /** Maximum size in bytes for serialized values (default: 1MB) */
  maxValueSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<KeyValueStorageOptions> = {
  maxKeyLength: 128,
  maxValueSizeBytes: 1024 * 1024, // 1MB
};

/**
 * Abstract base class for key-value storage using IndexedDB via Dexie.
 *
 * Unlike `DexieStorage<T>` which uses auto-generated `id` fields,
 * this class is designed for key-value stores where the `key` field
 * is the primary key (schema: `&key`).
 *
 * @example
 * ```typescript
 * // Define your database
 * const db = createDexieDatabase('MyApp', [{
 *   version: 1,
 *   stores: { settings: '&key' }
 * }]);
 *
 * // Create a storage class
 * class SettingsStorage extends KeyValueStorage<string> {
 *   constructor() {
 *     super(db, 'settings');
 *   }
 * }
 *
 * // Use it
 * const settings = new SettingsStorage();
 * await settings.set('theme', 'dark');
 * const theme = await settings.get('theme'); // 'dark'
 * ```
 *
 * @typeParam V - The type of values stored (default: unknown)
 */
export abstract class KeyValueStorage<V = unknown> {
  protected table: Table<KeyValueRecord<V>, string>;
  protected options: Required<KeyValueStorageOptions>;

  constructor(
    protected db: Dexie,
    protected tableName: string,
    options?: KeyValueStorageOptions
  ) {
    this.table = db.table(tableName);
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validates and normalizes a key.
   * @throws Error if key is invalid
   */
  protected validateKey(key: string): string {
    if (typeof key !== 'string') {
      throw new Error(`${this.tableName}/invalid-key`);
    }

    const trimmed = key.trim();

    if (trimmed.length === 0) {
      throw new Error(`${this.tableName}/invalid-key`);
    }

    if (trimmed.length > this.options.maxKeyLength) {
      throw new Error(`${this.tableName}/key-too-long`);
    }

    return trimmed;
  }

  /**
   * Validates a value before storage.
   * @throws Error if value is invalid or too large
   */
  protected validateValue(value: V): void {
    // undefined is not allowed (use delete instead)
    if (value === undefined) {
      throw new Error(`${this.tableName}/invalid-value`);
    }

    // Check serialized size for objects/arrays
    if (value !== null && typeof value === 'object') {
      try {
        const serialized = JSON.stringify(value);
        if (serialized.length > this.options.maxValueSizeBytes) {
          throw new Error(`${this.tableName}/value-too-large`);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('value-too-large')) {
          throw err;
        }
        throw new Error(`${this.tableName}/value-not-serializable`);
      }
    }
  }

  /**
   * Sets a value for a key. Creates the entry if it doesn't exist,
   * or updates it if it does (upsert semantics).
   *
   * @param key - The key (will be trimmed)
   * @param value - The value to store
   * @throws Error if key or value is invalid, or quota is exceeded
   */
  async set(key: string, value: V): Promise<void> {
    const normalizedKey = this.validateKey(key);
    this.validateValue(value);

    await withQuotaHandling(this.tableName, async () => {
      const now = new Date();
      const existing = await this.table.get(normalizedKey);

      const record: KeyValueRecord<V> = {
        key: normalizedKey,
        value,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await this.table.put(record);
      logger.info(`${this.tableName} set`, `Key: ${normalizedKey}`);
    });
  }

  /**
   * Gets a value by key.
   *
   * @param key - The key to look up
   * @returns The value, or undefined if not found
   */
  async get(key: string): Promise<V | undefined>;
  /**
   * Gets a value by key with type casting.
   *
   * @typeParam T - The expected type of the value
   * @param key - The key to look up
   * @returns The value cast to type T, or undefined if not found
   */
  async get<T extends V>(key: string): Promise<T | undefined>;
  async get<T extends V = V>(key: string): Promise<T | undefined> {
    const normalizedKey = this.validateKey(key);
    const record = await this.table.get(normalizedKey);
    return record?.value as T | undefined;
  }

  /**
   * Gets a value with a default fallback.
   *
   * @param key - The key to look up
   * @param defaultValue - Value to return if key doesn't exist
   * @returns The stored value or the default
   */
  async getOrDefault<T extends V = V>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Deletes a key-value pair.
   *
   * @param key - The key to delete
   */
  async delete(key: string): Promise<void> {
    const normalizedKey = this.validateKey(key);
    await this.table.delete(normalizedKey);
    logger.info(`${this.tableName} deleted`, `Key: ${normalizedKey}`);
  }

  /**
   * Checks if a key exists.
   *
   * @param key - The key to check
   * @returns true if the key exists
   */
  async has(key: string): Promise<boolean> {
    const normalizedKey = this.validateKey(key);
    const record = await this.table.get(normalizedKey);
    return record !== undefined;
  }

  /**
   * Gets all keys in the store.
   *
   * @returns Array of all keys
   */
  async keys(): Promise<string[]> {
    const records = await this.table.toArray();
    return records.map((r) => r.key);
  }

  /**
   * Gets all key-value pairs.
   *
   * @returns Array of all records
   */
  async getAll(): Promise<KeyValueRecord<V>[]> {
    return await this.table.toArray();
  }

  /**
   * Clears all key-value pairs.
   */
  async clear(): Promise<void> {
    await this.table.clear();
    logger.info(`${this.tableName} cleared`, 'All entries removed');
  }

  /**
   * Gets the number of entries in the store.
   *
   * @returns The count of stored key-value pairs
   */
  async count(): Promise<number> {
    return await this.table.count();
  }

  /**
   * Sets multiple key-value pairs at once.
   * Note: This is not atomic - some entries may succeed while others fail.
   *
   * @param entries - Object or Map of key-value pairs
   */
  async setMany(entries: Record<string, V> | Map<string, V>): Promise<void> {
    const items = entries instanceof Map ? Array.from(entries.entries()) : Object.entries(entries);

    const now = new Date();
    const records: KeyValueRecord<V>[] = [];

    for (const [key, value] of items) {
      const normalizedKey = this.validateKey(key);
      this.validateValue(value);

      const existing = await this.table.get(normalizedKey);
      records.push({
        key: normalizedKey,
        value,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    }

    await withQuotaHandling(this.tableName, async () => {
      await this.table.bulkPut(records);
      logger.info(`${this.tableName} setMany`, `Count: ${records.length}`);
    });
  }

  /**
   * Gets multiple values by keys.
   *
   * @param keys - Array of keys to look up
   * @returns Map of key to value (missing keys are omitted)
   */
  async getMany(keys: string[]): Promise<Map<string, V>> {
    const normalizedKeys = keys.map((k) => this.validateKey(k));
    const records = await this.table.bulkGet(normalizedKeys);

    const result = new Map<string, V>();
    for (const record of records) {
      if (record) {
        result.set(record.key, record.value);
      }
    }

    return result;
  }

  /**
   * Deletes multiple keys at once.
   *
   * @param keys - Array of keys to delete
   */
  async deleteMany(keys: string[]): Promise<void> {
    const normalizedKeys = keys.map((k) => this.validateKey(k));
    await this.table.bulkDelete(normalizedKeys);
    logger.info(`${this.tableName} deleteMany`, `Count: ${normalizedKeys.length}`);
  }
}
