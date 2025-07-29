/**
 * Tests for ContractUIStorage service
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cleanupTestDb,
  createEmptyContractUIRecord,
  createMockContractUIRecord,
} from '../../__tests__/setup';
import type { ContractUIExportData } from '../../types';
import { ContractUIStorage } from '../ContractUIStorage';

// Mock the generateId utility
let idCounter = 0;
vi.mock('@openzeppelin/contracts-ui-builder-utils', async () => {
  const actual = await vi.importActual('@openzeppelin/contracts-ui-builder-utils');
  return {
    ...actual,
    generateId: vi.fn(() => `mocked-id-${++idCounter}`),
  };
});

describe('ContractUIStorage', () => {
  let storage: ContractUIStorage;

  beforeEach(async () => {
    await cleanupTestDb();
    storage = new ContractUIStorage();
  });

  describe('duplicate', () => {
    it('should create a duplicate of an existing record with (Copy) suffix', async () => {
      const originalRecord = createMockContractUIRecord({
        title: 'Original UI',
        contractAddress: '0x123',
        functionId: 'transfer',
      });

      const originalId = await storage.save(originalRecord);
      const duplicateId = await storage.duplicate(originalId);

      const duplicate = await storage.get(duplicateId);
      expect(duplicate).toBeDefined();
      expect(duplicate!.title).toBe('Original UI (Copy)');
      expect(duplicate!.contractAddress).toBe('0x123');
      expect(duplicate!.functionId).toBe('transfer');
      expect(duplicate!.id).not.toBe(originalId);
      expect(duplicate!.metadata?.isManuallyRenamed).toBe(false);
    });

    it('should throw error when duplicating non-existent record', async () => {
      await expect(storage.duplicate('non-existent-id')).rejects.toThrow(
        'Failed to duplicate configuration'
      );
    });

    it('should handle duplicate errors gracefully', async () => {
      const originalRecord = createMockContractUIRecord();
      const originalId = await storage.save(originalRecord);

      // Mock the save method to throw an error
      const saveSpy = vi.spyOn(storage, 'save').mockRejectedValue(new Error('Save failed'));

      await expect(storage.duplicate(originalId)).rejects.toThrow(
        'Failed to duplicate configuration'
      );

      saveSpy.mockRestore();
    });
  });

  describe('export', () => {
    it('should export all meaningful records when no ids provided', async () => {
      const record1 = createMockContractUIRecord({ title: 'UI 1' });
      const record2 = createMockContractUIRecord({ title: 'UI 2' });
      const emptyRecord = createEmptyContractUIRecord();

      await storage.save(record1);
      await storage.save(record2);
      await storage.save(emptyRecord);

      const exportJson = await storage.export();
      const exportData: ContractUIExportData = JSON.parse(exportJson);

      expect(exportData.version).toBe('1.0.0');
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.configurations).toHaveLength(2); // Empty record should be filtered out
      expect(exportData.configurations.some((c) => c.title === 'UI 1')).toBe(true);
      expect(exportData.configurations.some((c) => c.title === 'UI 2')).toBe(true);
    });

    it('should export specific records when ids provided', async () => {
      const record1 = createMockContractUIRecord({ title: 'UI 1' });
      const record2 = createMockContractUIRecord({ title: 'UI 2' });
      const record3 = createMockContractUIRecord({ title: 'UI 3' });

      const id1 = await storage.save(record1);
      await storage.save(record2);
      const id3 = await storage.save(record3);

      const exportJson = await storage.export([id1, id3]);
      const exportData: ContractUIExportData = JSON.parse(exportJson);

      expect(exportData.configurations).toHaveLength(2);
      expect(exportData.configurations.some((c) => c.title === 'UI 1')).toBe(true);
      expect(exportData.configurations.some((c) => c.title === 'UI 3')).toBe(true);
      expect(exportData.configurations.some((c) => c.title === 'UI 2')).toBe(false);
    });

    it('should filter out empty records from export', async () => {
      const emptyRecord1 = createEmptyContractUIRecord({ title: 'Empty 1' });
      const emptyRecord2 = createEmptyContractUIRecord({ title: 'Empty 2' });

      await storage.save(emptyRecord1);
      await storage.save(emptyRecord2);

      const exportJson = await storage.export();
      const exportData: ContractUIExportData = JSON.parse(exportJson);

      expect(exportData.configurations).toHaveLength(0);
    });

    it('should handle export errors gracefully', async () => {
      const getAllSpy = vi.spyOn(storage, 'getAll').mockRejectedValue(new Error('Database error'));

      await expect(storage.export()).rejects.toThrow('Failed to export configurations');

      getAllSpy.mockRestore();
    });
  });

  describe('import', () => {
    it('should import valid configuration data', async () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [
          createMockContractUIRecord({ title: 'Imported UI 1' }),
          createMockContractUIRecord({ title: 'Imported UI 2' }),
        ],
      };

      const importedIds = await storage.import(JSON.stringify(exportData));

      expect(importedIds).toHaveLength(2);

      const allRecords = await storage.getAll();
      expect(allRecords).toHaveLength(2);
      expect(allRecords.some((r) => r.title === 'Imported UI 1')).toBe(true);
      expect(allRecords.some((r) => r.title === 'Imported UI 2')).toBe(true);
    });

    it('should filter out empty records during import', async () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [
          createMockContractUIRecord({ title: 'Valid UI' }),
          createEmptyContractUIRecord({ title: 'Empty UI' }),
        ],
      };

      const importedIds = await storage.import(JSON.stringify(exportData));

      expect(importedIds).toHaveLength(1);

      const allRecords = await storage.getAll();
      expect(allRecords).toHaveLength(1);
      expect(allRecords[0].title).toBe('Valid UI');
    });

    it('should throw error for invalid export format', async () => {
      const invalidData = { invalid: 'format' };

      await expect(storage.import(JSON.stringify(invalidData))).rejects.toThrow(
        'Failed to import configurations'
      );
    });

    it('should throw error when no meaningful configurations found', async () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [createEmptyContractUIRecord(), createEmptyContractUIRecord()],
      };

      await expect(storage.import(JSON.stringify(exportData))).rejects.toThrow(
        'Failed to import configurations'
      );
    });

    it('should throw error for invalid JSON', async () => {
      await expect(storage.import('invalid json')).rejects.toThrow(
        'Failed to import configurations'
      );
    });
  });

  describe('isEmptyRecord', () => {
    it('should return true for records without contract address, function id, and fields', async () => {
      const emptyRecord = createEmptyContractUIRecord();
      expect(storage.isEmptyRecord(emptyRecord)).toBe(true);
    });

    it('should return false for records with contract address', async () => {
      const recordWithAddress = createEmptyContractUIRecord({
        contractAddress: '0x123',
      });
      expect(storage.isEmptyRecord(recordWithAddress)).toBe(false);
    });

    it('should return false for records with function id', async () => {
      const recordWithFunction = createEmptyContractUIRecord({
        functionId: 'transfer',
      });
      expect(storage.isEmptyRecord(recordWithFunction)).toBe(false);
    });

    it('should return false for records with form fields', async () => {
      const recordWithFields = createEmptyContractUIRecord({
        formConfig: {
          ...createEmptyContractUIRecord().formConfig,
          fields: [{ id: 'test', name: 'test', type: 'string' }],
        },
      });
      expect(storage.isEmptyRecord(recordWithFields)).toBe(false);
    });

    it('should return false for manually renamed records even if otherwise empty', async () => {
      const manuallyRenamedRecord = createEmptyContractUIRecord({
        metadata: { isManuallyRenamed: true },
      });
      expect(storage.isEmptyRecord(manuallyRenamedRecord)).toBe(false);
    });
  });

  describe('findEmptyRecords', () => {
    it('should find all empty records', async () => {
      const fullRecord = createMockContractUIRecord({ title: 'Full UI' });
      const emptyRecord1 = createEmptyContractUIRecord({ title: 'Empty 1' });
      const emptyRecord2 = createEmptyContractUIRecord({ title: 'Empty 2' });

      await storage.save(fullRecord);
      await storage.save(emptyRecord1);
      await storage.save(emptyRecord2);

      const emptyRecords = await storage.findEmptyRecords();

      expect(emptyRecords).toHaveLength(2);
      expect(emptyRecords.every((r) => storage.isEmptyRecord(r))).toBe(true);
    });

    it('should return empty array when no empty records exist', async () => {
      const fullRecord = createMockContractUIRecord();
      await storage.save(fullRecord);

      const emptyRecords = await storage.findEmptyRecords();
      expect(emptyRecords).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const getAllSpy = vi.spyOn(storage, 'getAll').mockRejectedValue(new Error('Database error'));

      await expect(storage.findEmptyRecords()).rejects.toThrow('Failed to find empty records');

      getAllSpy.mockRestore();
    });
  });

  describe('inherited methods from DexieStorage', () => {
    it('should properly save and retrieve ContractUIRecord', async () => {
      const record = createMockContractUIRecord({
        title: 'Test Contract UI',
        contractAddress: '0xabcdef',
        executionConfig: { chainId: 1 },
        uiKitConfig: { theme: 'dark' },
      });

      const id = await storage.save(record);
      const retrieved = await storage.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe('Test Contract UI');
      expect(retrieved!.contractAddress).toBe('0xabcdef');
      expect(retrieved!.executionConfig).toEqual({ chainId: 1 });
      expect(retrieved!.uiKitConfig).toEqual({ theme: 'dark' });
    });

    it('should maintain proper ordering by updatedAt', async () => {
      const record1 = createMockContractUIRecord({ title: 'First' });
      const record2 = createMockContractUIRecord({ title: 'Second' });

      const id1 = await storage.save(record1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const id2 = await storage.save(record2);

      const allRecords = await storage.getAll();
      expect(allRecords[0].id).toBe(id2); // Most recent first
      expect(allRecords[1].id).toBe(id1);
    });
  });
});
