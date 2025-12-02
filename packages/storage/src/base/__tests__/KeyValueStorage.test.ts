/**
 * Tests for KeyValueStorage base class
 */
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KeyValueStorage } from '../KeyValueStorage';

// Concrete implementation for testing
class TestKVStorage extends KeyValueStorage<string> {
  constructor(db: Dexie, options?: { maxKeyLength?: number; maxValueSizeBytes?: number }) {
    super(db, 'testSettings', options);
  }
}

// Generic storage for testing different value types
class GenericKVStorage extends KeyValueStorage<unknown> {
  constructor(db: Dexie, options?: { maxKeyLength?: number; maxValueSizeBytes?: number }) {
    super(db, 'genericSettings', options);
  }
}

describe('KeyValueStorage', () => {
  let testDb: Dexie;
  let storage: TestKVStorage;

  beforeEach(async () => {
    // Close and recreate test database to ensure complete isolation
    if (testDb) {
      testDb.close();
      await testDb.delete();
    }

    // Create a fresh test database with unique name
    const dbName = `TestKVDB-${Date.now()}-${Math.random()}`;
    testDb = new Dexie(dbName);
    testDb.version(1).stores({
      testSettings: '&key',
      genericSettings: '&key',
    });

    storage = new TestKVStorage(testDb);
    await testDb.open();
  });

  describe('key validation', () => {
    it('should trim keys', async () => {
      await storage.set('  theme  ', 'dark');
      const value = await storage.get('theme');
      expect(value).toBe('dark');
    });

    it('should reject empty keys', async () => {
      await expect(storage.set('', 'value')).rejects.toThrow('testSettings/invalid-key');
    });

    it('should reject whitespace-only keys', async () => {
      await expect(storage.set('   ', 'value')).rejects.toThrow('testSettings/invalid-key');
    });

    it('should reject keys exceeding maxKeyLength', async () => {
      const shortStorage = new TestKVStorage(testDb, { maxKeyLength: 5 });
      await expect(shortStorage.set('toolongkey', 'value')).rejects.toThrow(
        'testSettings/key-too-long'
      );
    });

    it('should accept keys at exactly maxKeyLength', async () => {
      const shortStorage = new TestKVStorage(testDb, { maxKeyLength: 5 });
      await shortStorage.set('exact', 'value');
      expect(await shortStorage.get('exact')).toBe('value');
    });
  });

  describe('value validation', () => {
    it('should reject undefined values', async () => {
      await expect(storage.set('key', undefined as unknown as string)).rejects.toThrow(
        'testSettings/invalid-value'
      );
    });

    it('should accept null values', async () => {
      const genericStorage = new GenericKVStorage(testDb);
      await genericStorage.set('key', null);
      expect(await genericStorage.get('key')).toBeNull();
    });

    it('should reject strings exceeding maxValueSizeBytes', async () => {
      const smallStorage = new TestKVStorage(testDb, { maxValueSizeBytes: 10 });
      await expect(smallStorage.set('key', 'this is a very long string')).rejects.toThrow(
        'testSettings/value-too-large'
      );
    });

    it('should reject objects exceeding maxValueSizeBytes when serialized', async () => {
      const smallStorage = new GenericKVStorage(testDb, { maxValueSizeBytes: 10 });
      const largeObject = { data: 'this is way too large for the limit' };
      await expect(smallStorage.set('key', largeObject)).rejects.toThrow(
        'genericSettings/value-too-large'
      );
    });

    it('should reject non-serializable objects', async () => {
      const genericStorage = new GenericKVStorage(testDb);
      const circular: { self?: unknown } = {};
      circular.self = circular;
      await expect(genericStorage.set('key', circular)).rejects.toThrow(
        'genericSettings/value-not-serializable'
      );
    });
  });

  describe('set', () => {
    it('should store a new value', async () => {
      await storage.set('theme', 'dark');
      const value = await storage.get('theme');
      expect(value).toBe('dark');
    });

    it('should update an existing value (upsert)', async () => {
      await storage.set('theme', 'light');
      await storage.set('theme', 'dark');
      const value = await storage.get('theme');
      expect(value).toBe('dark');
    });

    it('should preserve createdAt on update', async () => {
      await storage.set('theme', 'light');
      const record1 = await storage['table'].get('theme');
      const createdAt1 = record1!.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      await storage.set('theme', 'dark');

      const record2 = await storage['table'].get('theme');
      expect(record2!.createdAt).toEqual(createdAt1);
      expect(record2!.updatedAt.getTime()).toBeGreaterThan(createdAt1.getTime());
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent key', async () => {
      const value = await storage.get('non-existent');
      expect(value).toBeUndefined();
    });

    it('should return the stored value', async () => {
      await storage.set('language', 'en');
      const value = await storage.get('language');
      expect(value).toBe('en');
    });
  });

  describe('getOrDefault', () => {
    it('should return stored value if exists', async () => {
      await storage.set('theme', 'dark');
      const value = await storage.getOrDefault('theme', 'light');
      expect(value).toBe('dark');
    });

    it('should return default value if key does not exist', async () => {
      const value = await storage.getOrDefault('missing', 'default');
      expect(value).toBe('default');
    });
  });

  describe('delete', () => {
    it('should remove an existing key', async () => {
      await storage.set('toDelete', 'value');
      expect(await storage.has('toDelete')).toBe(true);

      await storage.delete('toDelete');
      expect(await storage.has('toDelete')).toBe(false);
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true for existing key', async () => {
      await storage.set('exists', 'value');
      expect(await storage.has('exists')).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      expect(await storage.has('missing')).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return empty array when no entries', async () => {
      const keys = await storage.keys();
      expect(keys).toEqual([]);
    });

    it('should return all keys', async () => {
      await storage.set('a', 'value');
      await storage.set('b', 'value');
      await storage.set('c', 'value');

      const keys = await storage.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no entries', async () => {
      const records = await storage.getAll();
      expect(records).toEqual([]);
    });

    it('should return all records', async () => {
      await storage.set('theme', 'dark');
      await storage.set('language', 'en');

      const records = await storage.getAll();
      expect(records).toHaveLength(2);
      expect(records.map((r) => r.key)).toContain('theme');
      expect(records.map((r) => r.key)).toContain('language');
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      await storage.set('a', 'value');
      await storage.set('b', 'value');
      await storage.set('c', 'value');

      expect(await storage.count()).toBe(3);
      await storage.clear();
      expect(await storage.count()).toBe(0);
    });
  });

  describe('count', () => {
    it('should return 0 when empty', async () => {
      expect(await storage.count()).toBe(0);
    });

    it('should return the number of entries', async () => {
      await storage.set('a', 'value');
      expect(await storage.count()).toBe(1);

      await storage.set('b', 'value');
      await storage.set('c', 'value');
      expect(await storage.count()).toBe(3);
    });
  });

  describe('setMany', () => {
    it('should set multiple entries from object', async () => {
      await storage.setMany({ theme: 'dark', language: 'en', fontSize: '14px' });

      expect(await storage.get('theme')).toBe('dark');
      expect(await storage.get('language')).toBe('en');
      expect(await storage.get('fontSize')).toBe('14px');
    });

    it('should set multiple entries from Map', async () => {
      const entries = new Map([
        ['theme', 'dark'],
        ['language', 'en'],
      ]);
      await storage.setMany(entries);

      expect(await storage.get('theme')).toBe('dark');
      expect(await storage.get('language')).toBe('en');
    });

    it('should preserve createdAt for existing entries', async () => {
      await storage.set('theme', 'light');
      const record1 = await storage['table'].get('theme');
      const createdAt1 = record1!.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      await storage.setMany({ theme: 'dark', newKey: 'value' });

      const record2 = await storage['table'].get('theme');
      expect(record2!.createdAt).toEqual(createdAt1);
    });

    it('should validate all entries before writing', async () => {
      const smallStorage = new TestKVStorage(testDb, { maxValueSizeBytes: 5 });
      await expect(
        smallStorage.setMany({ short: 'ok', toolong: 'this is too long' })
      ).rejects.toThrow('testSettings/value-too-large');

      // Neither should be written
      expect(await smallStorage.has('short')).toBe(false);
    });
  });

  describe('getMany', () => {
    it('should return values for existing keys', async () => {
      await storage.set('a', 'value-a');
      await storage.set('b', 'value-b');
      await storage.set('c', 'value-c');

      const result = await storage.getMany(['a', 'c']);
      expect(result.get('a')).toBe('value-a');
      expect(result.get('c')).toBe('value-c');
      expect(result.has('b')).toBe(false);
    });

    it('should omit non-existent keys', async () => {
      await storage.set('exists', 'value');

      const result = await storage.getMany(['exists', 'missing']);
      expect(result.get('exists')).toBe('value');
      expect(result.has('missing')).toBe(false);
      expect(result.size).toBe(1);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple keys', async () => {
      await storage.set('a', 'value');
      await storage.set('b', 'value');
      await storage.set('c', 'value');

      await storage.deleteMany(['a', 'c']);

      expect(await storage.has('a')).toBe(false);
      expect(await storage.has('b')).toBe(true);
      expect(await storage.has('c')).toBe(false);
    });

    it('should not throw for non-existent keys', async () => {
      await expect(storage.deleteMany(['missing1', 'missing2'])).resolves.not.toThrow();
    });
  });

  describe('quota handling', () => {
    it('should throw quota-exceeded error for quota errors', async () => {
      const putSpy = vi.spyOn(storage['table'], 'put').mockRejectedValue({
        name: 'QuotaExceededError',
        message: 'Quota exceeded',
      });

      await expect(storage.set('key', 'value')).rejects.toThrow('testSettings/quota-exceeded');

      putSpy.mockRestore();
    });

    it('should detect Safari iOS quota error (code 22)', async () => {
      const putSpy = vi.spyOn(storage['table'], 'put').mockRejectedValue({
        code: 22,
        message: 'Some error',
      });

      await expect(storage.set('key', 'value')).rejects.toThrow('testSettings/quota-exceeded');

      putSpy.mockRestore();
    });

    it('should detect quota error from message', async () => {
      const putSpy = vi.spyOn(storage['table'], 'put').mockRejectedValue({
        message: 'Storage quota has been exceeded',
      });

      await expect(storage.set('key', 'value')).rejects.toThrow('testSettings/quota-exceeded');

      putSpy.mockRestore();
    });
  });
});
