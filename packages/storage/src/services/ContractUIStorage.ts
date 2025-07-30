import type { ContractSchemaMetadata } from '@openzeppelin/contracts-ui-builder-types';
import { generateId, logger } from '@openzeppelin/contracts-ui-builder-utils';

import { DexieStorage } from '../base/DexieStorage';
import { db } from '../database/db';
import type { ContractUIExportData, ContractUIRecord } from '../types';

export class ContractUIStorage extends DexieStorage<ContractUIRecord> {
  constructor() {
    super(db, 'contractUIs');
  }

  async duplicate(id: string): Promise<string> {
    try {
      const original = await this.get(id);
      if (!original) {
        throw new Error('Configuration not found');
      }

      const { id: _, createdAt: _createdAt, updatedAt: _updatedAt, ...recordData } = original;
      const newTitle = `${original.title} (Copy)`;

      return await this.save({
        ...recordData,
        title: newTitle,
        metadata: {
          ...recordData.metadata,
          isManuallyRenamed: false, // Reset the manual rename flag for duplicates
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to duplicate Contract UI', errorMessage);
      throw new Error('Failed to duplicate configuration');
    }
  }

  async export(ids?: string[]): Promise<string> {
    try {
      let configurations: ContractUIRecord[];

      if (ids && ids.length > 0) {
        configurations = await Promise.all(ids.map((id) => this.get(id))).then((results) =>
          results.filter((r): r is ContractUIRecord => r !== undefined)
        );
      } else {
        configurations = await this.getAll();
      }

      // Filter out empty records before exporting
      const meaningfulConfigurations = configurations.filter(
        (config) => !this.isEmptyRecord(config)
      );

      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: meaningfulConfigurations,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to export Contract UIs', errorMessage);
      throw new Error('Failed to export configurations');
    }
  }

  async import(jsonData: string): Promise<string[]> {
    try {
      const data = JSON.parse(jsonData) as ContractUIExportData;

      // Validate export format
      if (!data.version || !data.configurations || !Array.isArray(data.configurations)) {
        throw new Error('Invalid export format');
      }

      const meaningfulConfigurations = data.configurations.filter(
        (config) => !this.isEmptyRecord(config)
      );

      if (meaningfulConfigurations.length === 0) {
        throw new Error('No meaningful configurations found to import');
      }

      const recordsToImport: ContractUIRecord[] = meaningfulConfigurations.map((config) => {
        // Generate new ID but preserve original timestamps
        const { id: _originalId, ...configWithTimestamps } = config;

        return {
          ...configWithTimestamps,
          id: generateId(),
          // Preserve original timestamps and ensure they are Date objects
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        };
      });

      // Use table.bulkAdd for efficient batch insertion.
      // This is much faster than adding records one by one in a loop.
      // Note: bulkAdd does not trigger 'creating' hooks, which is desired here
      // to preserve the timestamps from the imported file.
      const importedIds = (await this.table.bulkAdd(recordsToImport, {
        allKeys: true,
      })) as string[];

      logger.info('Contract UIs imported', `Count: ${importedIds.length}`);
      return importedIds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to import Contract UIs', errorMessage);
      throw new Error('Failed to import configurations');
    }
  }

  /**
   * Checks if a record is considered "empty".
   * A record is empty if it lacks critical configuration data AND has not been manually renamed.
   */
  isEmptyRecord(record: ContractUIRecord): boolean {
    if (record.metadata?.isManuallyRenamed === true) {
      return false;
    }

    return (
      !record.contractAddress &&
      !record.functionId &&
      (!record.formConfig.fields || record.formConfig.fields.length === 0)
    );
  }

  /**
   * Finds existing empty records in the database.
   * @returns Array of empty ContractUIRecord instances
   */
  async findEmptyRecords(): Promise<ContractUIRecord[]> {
    try {
      const allRecords = await this.getAll();
      return allRecords.filter((record) => this.isEmptyRecord(record));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find empty records', errorMessage);
      throw new Error('Failed to find empty records');
    }
  }

  /**
   * Helper to prepare a record with contract schema data for saving
   */
  static prepareRecordWithSchema(
    record: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'>,
    contractSchema?: string,
    schemaSource: 'fetched' | 'manual' | 'hybrid' = 'manual',
    schemaMetadata?: ContractSchemaMetadata,
    schemaHash?: string
  ): Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'> {
    const recordWithSchema = {
      ...record,
      schemaSource,
      contractSchema,
      schemaHash,
      schemaMetadata,
    };

    if (schemaSource === 'fetched') {
      recordWithSchema.lastSchemaFetched = new Date();
    }

    return recordWithSchema;
  }

  /**
   * Updates contract schema data for existing record
   */
  async updateSchema(
    id: string,
    contractSchema: string,
    schemaSource: 'fetched' | 'manual' | 'hybrid',
    schemaMetadata?: ContractSchemaMetadata,
    schemaHash?: string
  ): Promise<void> {
    try {
      const existing = await this.get(id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found`);
      }

      const updates: Partial<ContractUIRecord> = {
        contractSchema,
        schemaSource,
        schemaMetadata,
        schemaHash,
        updatedAt: new Date(),
      };

      if (schemaSource === 'fetched') {
        updates.lastSchemaFetched = new Date();
      }

      await this.update(id, updates);
      logger.info('Contract schema updated', `ID: ${id}, Source: ${schemaSource}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update contract schema', errorMessage);
      throw new Error('Failed to update contract schema');
    }
  }

  /**
   * Gets records that need contract schema refresh (older than threshold)
   */
  async getRecordsNeedingSchemaRefresh(thresholdHours: number = 24): Promise<ContractUIRecord[]> {
    try {
      const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
      const allRecords = await this.getAll();

      const needsRefresh = allRecords.filter(
        (record) =>
          record.schemaSource === 'fetched' &&
          record.lastSchemaFetched &&
          record.lastSchemaFetched < threshold
      );

      logger.info('Schema refresh check', `Found ${needsRefresh.length} records needing refresh`);
      return needsRefresh;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get records needing schema refresh', errorMessage);
      throw new Error('Failed to check for schema refresh needs');
    }
  }

  /**
   * Compares stored contract schema with fresh schema
   * Note: Actual comparison logic should be implemented in chain-specific adapters
   */
  async compareStoredSchema(
    id: string,
    freshSchema: string
  ): Promise<{
    record: ContractUIRecord;
    hasStoredSchema: boolean;
    schemasMatch: boolean;
    needsUpdate: boolean;
  }> {
    try {
      const record = await this.get(id);
      if (!record) {
        throw new Error(`Record with id ${id} not found`);
      }

      const hasStoredSchema = !!record.contractSchema;

      if (!hasStoredSchema) {
        return {
          record,
          hasStoredSchema: false,
          schemasMatch: false,
          needsUpdate: true,
        };
      }

      // Simple string comparison - chain-specific adapters should implement
      // more sophisticated comparison logic
      const schemasMatch = record.contractSchema === freshSchema;

      return {
        record,
        hasStoredSchema: true,
        schemasMatch,
        needsUpdate: !schemasMatch,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to compare stored schema', errorMessage);
      throw new Error('Failed to compare contract schemas');
    }
  }

  /**
   * Gets records by contract schema hash for quick lookup
   */
  async getRecordsBySchemaHash(schemaHash: string): Promise<ContractUIRecord[]> {
    try {
      const allRecords = await this.getAll();
      const matchingRecords = allRecords.filter((record) => record.schemaHash === schemaHash);

      logger.info(
        'Schema hash lookup',
        `Found ${matchingRecords.length} records with hash ${schemaHash}`
      );
      return matchingRecords;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get records by schema hash', errorMessage);
      throw new Error('Failed to lookup records by schema hash');
    }
  }
}

// Export singleton instance
export const contractUIStorage = new ContractUIStorage();
