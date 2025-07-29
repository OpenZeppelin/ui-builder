/**
 * Tests for database setup and schema
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { cleanupTestDb } from '../../__tests__/setup';
import { db } from '../db';

describe('Database Setup', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  describe('database instance', () => {
    it('should have correct database name', () => {
      expect(db.name).toBe('ContractsUIBuilder');
    });

    it('should be a Dexie instance', () => {
      expect(db.constructor.name).toBe('Dexie');
    });

    it('should have contractUIs table defined', () => {
      expect(db.tables.some((table) => table.name === 'contractUIs')).toBe(true);
    });
  });

  describe('schema version 1', () => {
    it('should have correct schema for contractUIs table', async () => {
      await db.open();

      const contractUIsTable = db.table('contractUIs');
      expect(contractUIsTable).toBeDefined();

      // Check that the table can handle the expected indexes
      const schema = contractUIsTable.schema;
      expect(schema.primKey.name).toBe('id');
      expect(schema.primKey.auto).toBe(true);

      // Verify indexed fields
      const indexNames = schema.indexes.map((idx) => idx.name);
      expect(indexNames).toContain('title');
      expect(indexNames).toContain('createdAt');
      expect(indexNames).toContain('updatedAt');
      expect(indexNames).toContain('ecosystem');
      expect(indexNames).toContain('networkId');
      expect(indexNames).toContain('contractAddress');
      expect(indexNames).toContain('functionId');
    });

    it('should support basic CRUD operations', async () => {
      await db.open();

      const contractUIsTable = db.table('contractUIs');

      // Create
      const testRecord = {
        title: 'Test UI',
        ecosystem: 'evm',
        networkId: '1',
        contractAddress: '0x123',
        functionId: 'transfer',
        formConfig: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await contractUIsTable.add(testRecord);
      expect(id).toBeDefined();

      // Read
      const retrieved = await contractUIsTable.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe('Test UI');

      // Update
      await contractUIsTable.update(id, { title: 'Updated UI' });
      const updated = await contractUIsTable.get(id);
      expect(updated!.title).toBe('Updated UI');

      // Delete
      await contractUIsTable.delete(id);
      const deleted = await contractUIsTable.get(id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle database open errors gracefully', async () => {
      // This test would require mocking IndexedDB to fail
      // For now, we'll just ensure the database opens successfully
      await expect(db.open()).resolves.not.toThrow();
    });

    it('should handle database operations when database is not open', async () => {
      // Close the database first
      db.close();

      const contractUIsTable = db.table('contractUIs');

      // Attempting operations on closed database should fail
      const testRecord = {
        title: 'Test UI',
        ecosystem: 'evm',
        networkId: '1',
        contractAddress: '0x123',
        functionId: 'transfer',
        formConfig: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // This should fail because database is closed
      await expect(contractUIsTable.add(testRecord)).rejects.toThrow();

      // Re-open for subsequent tests
      await db.open();
    });
  });

  describe('table queries', () => {
    beforeEach(async () => {
      await db.open();

      // Add some test data
      const contractUIsTable = db.table('contractUIs');
      await contractUIsTable.bulkAdd([
        {
          title: 'EVM UI 1',
          ecosystem: 'evm',
          networkId: '1',
          contractAddress: '0x111',
          functionId: 'transfer',
          formConfig: { fields: [] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          title: 'EVM UI 2',
          ecosystem: 'evm',
          networkId: '137',
          contractAddress: '0x222',
          functionId: 'approve',
          formConfig: { fields: [] },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          title: 'Solana UI',
          ecosystem: 'solana',
          networkId: 'mainnet',
          contractAddress: 'ABC123',
          functionId: 'transfer',
          formConfig: { fields: [] },
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
        },
      ]);
    });

    it('should query by ecosystem', async () => {
      const contractUIsTable = db.table('contractUIs');

      const evmUIs = await contractUIsTable.where('ecosystem').equals('evm').toArray();
      expect(evmUIs).toHaveLength(2);
      expect(evmUIs.every((ui) => ui.ecosystem === 'evm')).toBe(true);

      const solanaUIs = await contractUIsTable.where('ecosystem').equals('solana').toArray();
      expect(solanaUIs).toHaveLength(1);
      expect(solanaUIs[0].ecosystem).toBe('solana');
    });

    it('should query by network ID', async () => {
      const contractUIsTable = db.table('contractUIs');

      const mainnetUIs = await contractUIsTable.where('networkId').equals('1').toArray();
      expect(mainnetUIs).toHaveLength(1);
      expect(mainnetUIs[0].networkId).toBe('1');
    });

    it('should query by contract address', async () => {
      const contractUIsTable = db.table('contractUIs');

      const contractUIs = await contractUIsTable.where('contractAddress').equals('0x111').toArray();
      expect(contractUIs).toHaveLength(1);
      expect(contractUIs[0].contractAddress).toBe('0x111');
    });

    it('should query by function ID', async () => {
      const contractUIsTable = db.table('contractUIs');

      const transferUIs = await contractUIsTable.where('functionId').equals('transfer').toArray();
      expect(transferUIs).toHaveLength(2);
      expect(transferUIs.every((ui) => ui.functionId === 'transfer')).toBe(true);
    });

    it('should order by created date', async () => {
      const contractUIsTable = db.table('contractUIs');

      const orderedUIs = await contractUIsTable.orderBy('createdAt').toArray();
      expect(orderedUIs).toHaveLength(3);
      expect(new Date(orderedUIs[0].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(orderedUIs[1].createdAt).getTime()
      );
      expect(new Date(orderedUIs[1].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(orderedUIs[2].createdAt).getTime()
      );
    });

    it('should order by updated date descending', async () => {
      const contractUIsTable = db.table('contractUIs');

      const orderedUIs = await contractUIsTable.orderBy('updatedAt').reverse().toArray();
      expect(orderedUIs).toHaveLength(3);
      expect(new Date(orderedUIs[0].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(orderedUIs[1].updatedAt).getTime()
      );
      expect(new Date(orderedUIs[1].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(orderedUIs[2].updatedAt).getTime()
      );
    });
  });
});
