/**
 * Tests for EntityStorage base class
 */
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityStorage, type BaseRecord } from '../EntityStorage';

// Test record interface extending BaseRecord
interface TestRecord extends BaseRecord {
  name: string;
  value: number;
}

// Concrete implementation for testing
class TestStorage extends EntityStorage<TestRecord> {
  constructor(db: Dexie, options?: { maxRecordSizeBytes?: number }) {
    super(db, 'testRecords', options);
  }
}

describe('EntityStorage', () => {
  let testDb: Dexie;
  let storage: TestStorage;

  beforeEach(async () => {
    // Close and recreate test database to ensure complete isolation
    if (testDb) {
      testDb.close();
      await testDb.delete();
    }

    // Create a fresh test database with unique name
    const dbName = `TestDB-${Date.now()}-${Math.random()}`;
    testDb = new Dexie(dbName);
    testDb.version(1).stores({
      testRecords: '++id, name, value, createdAt, updatedAt',
    });

    storage = new TestStorage(testDb);
    await testDb.open();
  });

  describe('save', () => {
    it('should save a record with auto-generated id and timestamps', async () => {
      const recordData = { name: 'Test Record', value: 42 };

      const id = await storage.save(recordData);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const saved = await storage.get(id);
      expect(saved).toBeDefined();
      expect(saved!.name).toBe('Test Record');
      expect(saved!.value).toBe(42);
      expect(saved!.createdAt).toBeInstanceOf(Date);
      expect(saved!.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle save errors gracefully', async () => {
      // Mock the table.add method to throw an error
      const addSpy = vi
        .spyOn(storage['table'], 'add')
        .mockRejectedValue(new Error('Database error'));

      const recordData = { name: 'Test Record', value: 42 };

      await expect(storage.save(recordData)).rejects.toThrow();

      addSpy.mockRestore();
    });

    it('should reject records that exceed maxRecordSizeBytes', async () => {
      // Create storage with very small limit
      const smallStorage = new TestStorage(testDb, { maxRecordSizeBytes: 10 });

      const largeRecord = { name: 'This is a very long name that exceeds the limit', value: 42 };

      await expect(smallStorage.save(largeRecord)).rejects.toThrow('testRecords/record-too-large');
    });
  });

  describe('update', () => {
    it('should update an existing record and modify updatedAt timestamp', async () => {
      const recordData = { name: 'Original Name', value: 100 };
      const id = await storage.save(recordData);

      const originalRecord = await storage.get(id);
      const originalUpdatedAt = originalRecord!.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await storage.update(id, { name: 'Updated Name', value: 200 });

      const updatedRecord = await storage.get(id);
      expect(updatedRecord!.name).toBe('Updated Name');
      expect(updatedRecord!.value).toBe(200);
      expect(updatedRecord!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedRecord!.createdAt).toEqual(originalRecord!.createdAt);
    });

    it('should not allow updating id or createdAt fields', async () => {
      const recordData = { name: 'Test Record', value: 42 };
      const id = await storage.save(recordData);

      const originalRecord = await storage.get(id);

      await storage.update(id, {
        id: 'new-id',
        createdAt: new Date('2020-01-01'),
        name: 'Updated Name',
      } as Partial<TestRecord>);

      const updatedRecord = await storage.get(id);
      expect(updatedRecord!.id).toBe(id); // ID should not change
      expect(updatedRecord!.createdAt).toEqual(originalRecord!.createdAt); // createdAt should not change
      expect(updatedRecord!.name).toBe('Updated Name'); // Other fields should update
    });

    it('should throw error when updating non-existent record', async () => {
      await expect(storage.update('non-existent-id', { name: 'Updated' })).rejects.toThrow(
        'No record found with id: non-existent-id'
      );
    });

    it('should handle update errors gracefully', async () => {
      const updateSpy = vi
        .spyOn(storage['table'], 'update')
        .mockRejectedValue(new Error('Database error'));

      await expect(storage.update('some-id', { name: 'Updated' })).rejects.toThrow(
        'Database error'
      );

      updateSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete an existing record', async () => {
      const recordData = { name: 'To Delete', value: 99 };
      const id = await storage.save(recordData);

      expect(await storage.get(id)).toBeDefined();

      await storage.delete(id);

      expect(await storage.get(id)).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should retrieve an existing record', async () => {
      const recordData = { name: 'Retrievable', value: 123 };
      const id = await storage.save(recordData);

      const retrieved = await storage.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(id);
      expect(retrieved!.name).toBe('Retrievable');
      expect(retrieved!.value).toBe(123);
    });

    it('should return undefined for non-existent record', async () => {
      const result = await storage.get('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should retrieve all records ordered by updatedAt desc', async () => {
      const record1 = { name: 'First', value: 1 };
      const record2 = { name: 'Second', value: 2 };
      const record3 = { name: 'Third', value: 3 };

      const id1 = await storage.save(record1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const id2 = await storage.save(record2);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const id3 = await storage.save(record3);

      const allRecords = await storage.getAll();

      expect(allRecords).toHaveLength(3);
      // Should be ordered by updatedAt desc (most recent first)
      expect(allRecords[0].id).toBe(id3);
      expect(allRecords[1].id).toBe(id2);
      expect(allRecords[2].id).toBe(id1);
    });

    it('should return empty array when no records exist', async () => {
      const allRecords = await storage.getAll();
      expect(allRecords).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all records from the table', async () => {
      await storage.save({ name: 'Record 1', value: 1 });
      await storage.save({ name: 'Record 2', value: 2 });
      await storage.save({ name: 'Record 3', value: 3 });

      let allRecords = await storage.getAll();
      expect(allRecords).toHaveLength(3);

      await storage.clear();

      allRecords = await storage.getAll();
      expect(allRecords).toHaveLength(0);
    });
  });

  describe('has', () => {
    it('should return true for existing record', async () => {
      const id = await storage.save({ name: 'Test', value: 1 });
      expect(await storage.has(id)).toBe(true);
    });

    it('should return false for non-existent record', async () => {
      expect(await storage.has('non-existent-id')).toBe(false);
    });
  });

  describe('count', () => {
    it('should return the number of records', async () => {
      expect(await storage.count()).toBe(0);

      await storage.save({ name: 'Record 1', value: 1 });
      expect(await storage.count()).toBe(1);

      await storage.save({ name: 'Record 2', value: 2 });
      await storage.save({ name: 'Record 3', value: 3 });
      expect(await storage.count()).toBe(3);
    });
  });

  describe('hooks', () => {
    it('should auto-generate id and timestamps on creation', async () => {
      const recordData = { name: 'Hook Test', value: 777 };

      // Use table.add directly to test the creating hook
      const result = await storage['table'].add(recordData as TestRecord);

      const saved = await storage['table'].get(result);
      expect(saved!.id).toBeDefined();
      expect(saved!.createdAt).toBeInstanceOf(Date);
      expect(saved!.updatedAt).toBeInstanceOf(Date);
    });

    it('should update timestamp on modification through updating hook', async () => {
      const recordData = { name: 'Hook Update Test', value: 888 };
      const id = await storage.save(recordData);

      const original = await storage.get(id);
      const originalUpdatedAt = original!.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Use table.update directly to test the updating hook
      await storage['table'].update(id, { name: 'Modified by Hook' });

      const updated = await storage.get(id);
      expect(updated!.name).toBe('Modified by Hook');
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('quota handling', () => {
    it('should throw quota-exceeded error for quota errors', async () => {
      // Mock quota exceeded error
      const addSpy = vi.spyOn(storage['table'], 'add').mockRejectedValue({
        name: 'QuotaExceededError',
        message: 'Quota exceeded',
      });

      await expect(storage.save({ name: 'Test', value: 1 })).rejects.toThrow(
        'testRecords/quota-exceeded'
      );

      addSpy.mockRestore();
    });

    it('should detect Safari iOS quota error (code 22)', async () => {
      const addSpy = vi.spyOn(storage['table'], 'add').mockRejectedValue({
        code: 22,
        message: 'Some error',
      });

      await expect(storage.save({ name: 'Test', value: 1 })).rejects.toThrow(
        'testRecords/quota-exceeded'
      );

      addSpy.mockRestore();
    });
  });
});
