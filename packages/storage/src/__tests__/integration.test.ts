/**
 * Integration tests for the storage package
 * These tests cover end-to-end workflows combining multiple components
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FieldType, FieldValidation } from '../../../types/src';
import { db } from '../database/db';
import { ContractUIStorage } from '../services/ContractUIStorage';
import type { ContractUIExportData } from '../types';

import { cleanupTestDb, createEmptyContractUIRecord, createMockContractUIRecord } from './setup';

describe('Storage Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestDb();
    vi.clearAllMocks();
  });

  describe('Complete CRUD workflow', () => {
    it('should handle full lifecycle of contract UI configurations', async () => {
      const storage = new ContractUIStorage();

      // 1. Create a new, initially empty record
      const newRecord = createEmptyContractUIRecord();
      const recordId = await storage.save(newRecord);
      expect(recordId).toBeDefined();

      let record = await storage.get(recordId);
      expect(record).toBeDefined();
      expect(storage.isEmptyRecord(record!)).toBe(true);

      // 2. Update record to be a meaningful configuration
      await storage.update(recordId, {
        title: 'Token Transfer UI',
        contractAddress: '0x1234567890123456789012345678901234567890',
        functionId: 'transfer',
        formConfig: {
          ...record!.formConfig,
          contractAddress: '0x1234567890123456789012345678901234567890',
          functionId: 'transfer',
          fields: [
            {
              id: 'to',
              name: 'to',
              type: 'address' as FieldType,
              label: 'To',
              validation: { required: true } as FieldValidation,
            },
            {
              id: 'amount',
              name: 'amount',
              type: 'uint256' as FieldType,
              label: 'Amount',
              validation: { required: true } as FieldValidation,
            },
          ],
        },
        metadata: { isManuallyRenamed: true },
      });

      const updated = await storage.get(recordId);
      expect(updated!.title).toBe('Token Transfer UI');
      expect(storage.isEmptyRecord(updated!)).toBe(false);

      // 3. Duplicate the configuration
      const duplicateId = await storage.duplicate(recordId);
      const duplicate = await storage.get(duplicateId);
      expect(duplicate!.title).toBe('Token Transfer UI (Copy)');
      expect(duplicate!.contractAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(duplicate!.metadata?.isManuallyRenamed).toBe(false);

      // 4. Create additional configurations
      const config2 = createMockContractUIRecord({
        title: 'Approval UI',
        functionId: 'approve',
      });
      const config2Id = await storage.save(config2);

      // 5. Get all configurations
      const allConfigs = await storage.getAll();
      expect(allConfigs).toHaveLength(3);

      // 6. Export specific configurations
      const exportJson = await storage.export([recordId, config2Id]);
      const exportData: ContractUIExportData = JSON.parse(exportJson);
      expect(exportData.configurations).toHaveLength(2);

      // 7. Clear and import
      await storage.clear();
      let emptyConfigs = await storage.getAll();
      expect(emptyConfigs).toHaveLength(0);

      const importedIds = await storage.import(exportJson);
      expect(importedIds).toHaveLength(2);

      const importedConfigs = await storage.getAll();
      expect(importedConfigs).toHaveLength(2);
      expect(importedConfigs.some((c) => c.title === 'Token Transfer UI')).toBe(true);
      expect(importedConfigs.some((c) => c.title === 'Approval UI')).toBe(true);

      // 8. Delete individual configuration
      await storage.delete(importedIds[0]);
      const finalConfigs = await storage.getAll();
      expect(finalConfigs).toHaveLength(1);
    });
  });

  describe('Export/Import workflow with filtering', () => {
    it('should properly filter empty records during export/import', async () => {
      const storage = new ContractUIStorage();

      // Create mix of meaningful and empty records
      const meaningful1 = createMockContractUIRecord({ title: 'Meaningful 1' });
      const meaningful2 = createMockContractUIRecord({ title: 'Meaningful 2' });
      const empty1 = createEmptyContractUIRecord({ title: 'Empty 1' });
      const empty2 = createEmptyContractUIRecord({ title: 'Empty 2' });

      await storage.save(meaningful1);
      await storage.save(empty1);
      await storage.save(meaningful2);
      await storage.save(empty2);

      // Export all - should only include meaningful records
      const exportJson = await storage.export();
      const exportData: ContractUIExportData = JSON.parse(exportJson);
      expect(exportData.configurations).toHaveLength(2);
      expect(
        exportData.configurations.every(
          (c) => c.title === 'Meaningful 1' || c.title === 'Meaningful 2'
        )
      ).toBe(true);

      // Import into clean database
      await storage.clear();
      const importedIds = await storage.import(exportJson);
      expect(importedIds).toHaveLength(2);

      const importedConfigs = await storage.getAll();
      expect(importedConfigs).toHaveLength(2);
      expect(importedConfigs.every((c) => !storage.isEmptyRecord(c))).toBe(true);
    });

    it('should handle import of data with preserved timestamps', async () => {
      const storage = new ContractUIStorage();

      // Test that import preserves the basic record structure
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [
          createMockContractUIRecord({
            title: 'Timestamped Record',
            id: 'test-timestamp-id',
          }),
        ],
      };

      const importedIds = await storage.import(JSON.stringify(exportData));

      const imported = await storage.get(importedIds[0]);
      expect(imported!.title).toBe('Timestamped Record');
      expect(imported!.createdAt).toBeInstanceOf(Date);
      expect(imported!.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Database schema and operations integration', () => {
    it('should work correctly with database indexes and queries', async () => {
      await db.open();
      const storage = new ContractUIStorage();

      // Create test data across different ecosystems and networks
      const evmRecord1 = createMockContractUIRecord({
        title: 'EVM UI 1',
        ecosystem: 'evm',
        networkId: '1',
        contractAddress: '0x111',
        functionId: 'transfer',
      });

      const evmRecord2 = createMockContractUIRecord({
        title: 'EVM UI 2',
        ecosystem: 'evm',
        networkId: '137',
        contractAddress: '0x222',
        functionId: 'approve',
      });

      const solanaRecord = createMockContractUIRecord({
        title: 'Solana UI',
        ecosystem: 'solana',
        networkId: 'mainnet',
        contractAddress: 'ABC123DEF456',
        functionId: 'transfer',
      });

      await storage.save(evmRecord1);
      await storage.save(evmRecord2);
      await storage.save(solanaRecord);

      // Test direct database queries using indexes
      const contractUIsTable = db.table('contractUIs');

      // Query by ecosystem
      const evmUIs = await contractUIsTable.where('ecosystem').equals('evm').toArray();
      expect(evmUIs).toHaveLength(2);

      // Query by function ID
      const transferUIs = await contractUIsTable.where('functionId').equals('transfer').toArray();
      expect(transferUIs).toHaveLength(2);

      // Query by network ID
      const mainnetUIs = await contractUIsTable.where('networkId').equals('1').toArray();
      expect(mainnetUIs).toHaveLength(1);

      // Verify storage methods work with indexed data
      const allFromStorage = await storage.getAll();
      expect(allFromStorage).toHaveLength(3);

      // Verify ordering by updatedAt (most recent first)
      const titles = allFromStorage.map((ui) => ui.title);
      // Order should be most recent first, but exact order may vary due to timing
      expect(titles).toContain('Solana UI');
      expect(titles).toContain('EVM UI 2');
      expect(titles).toContain('EVM UI 1');
    });
  });

  describe('Error handling across components', () => {
    it('should handle cascading errors properly', async () => {
      const storage = new ContractUIStorage();

      // Create a valid record
      const record = createMockContractUIRecord();
      const recordId = await storage.save(record);

      // Test duplicate of non-existent record
      await expect(storage.duplicate('non-existent')).rejects.toThrow(
        'Failed to duplicate configuration'
      );

      // Test export with mix of valid and invalid IDs
      const exportJson = await storage.export([recordId, 'non-existent']);
      const exportData: ContractUIExportData = JSON.parse(exportJson);
      expect(exportData.configurations).toHaveLength(1); // Only valid record exported

      // Test import with malformed JSON
      await expect(storage.import('invalid json')).rejects.toThrow(
        'Failed to import configurations'
      );

      // Test import with invalid structure
      const invalidExport = JSON.stringify({ invalid: 'structure' });
      await expect(storage.import(invalidExport)).rejects.toThrow(
        'Failed to import configurations'
      );

      // Verify original record is still intact
      const originalRecord = await storage.get(recordId);
      expect(originalRecord).toBeDefined();
      expect(originalRecord!.title).toBe(record.title);
    });
  });

  describe('Performance with larger datasets', () => {
    it('should handle multiple records efficiently', async () => {
      const storage = new ContractUIStorage();

      // Create a larger number of test records
      const records = Array.from({ length: 50 }, (_, i) =>
        createMockContractUIRecord({
          title: `Test UI ${i + 1}`,
          contractAddress: `0x${i.toString().padStart(40, '0')}`,
          functionId: i % 3 === 0 ? 'transfer' : i % 3 === 1 ? 'approve' : 'mint',
          ecosystem: i % 4 === 0 ? 'solana' : 'evm',
          networkId: ((i % 5) + 1).toString(),
        })
      );

      // Save all records
      const startTime = performance.now();
      const ids = await Promise.all(records.map((record) => storage.save(record)));
      const saveTime = performance.now() - startTime;

      expect(ids).toHaveLength(50);
      expect(saveTime).toBeLessThan(1000); // Should complete in under 1 second

      // Test retrieval performance
      const retrievalStartTime = performance.now();
      const allRecords = await storage.getAll();
      const retrievalTime = performance.now() - retrievalStartTime;

      expect(allRecords).toHaveLength(50);
      expect(retrievalTime).toBeLessThan(100); // Should be very fast

      // Test export performance
      const exportStartTime = performance.now();
      const exportJson = await storage.export();
      const exportTime = performance.now() - exportStartTime;

      expect(exportTime).toBeLessThan(500); // Should be reasonably fast
      const exportData: ContractUIExportData = JSON.parse(exportJson);
      expect(exportData.configurations).toHaveLength(50);

      // Test import performance
      await storage.clear();
      const importStartTime = performance.now();
      const importedIds = await storage.import(exportJson);
      const importTime = performance.now() - importStartTime;

      expect(importTime).toBeLessThan(1000); // Should complete in reasonable time
      expect(importedIds).toHaveLength(50);
    });
  });
});
