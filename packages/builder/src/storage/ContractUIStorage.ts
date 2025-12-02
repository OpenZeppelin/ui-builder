import { EntityStorage } from '@openzeppelin/ui-builder-storage';
import type { ContractDefinitionMetadata } from '@openzeppelin/ui-builder-types';
import { generateId, logger } from '@openzeppelin/ui-builder-utils';

import { db } from './database';
import type { ContractUIExportData, ContractUIRecord } from './types';

/**
 * Storage for Contract UI configurations.
 * Uses a higher record size limit (50MB) to accommodate large contract definitions
 * and source code (e.g., Midnight contracts with compiled modules).
 */
export class ContractUIStorage extends EntityStorage<ContractUIRecord> {
  constructor() {
    // 50MB limit for records containing large contract definitions/source code
    super(db, 'contractUIs', { maxRecordSizeBytes: 50 * 1024 * 1024 });
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

      // Use bulkAdd for efficient batch insertion.
      // Note: bulkAdd does not trigger 'creating' hooks, which is desired here
      // to preserve the timestamps from the imported file.
      const importedIds = await this.bulkAdd(recordsToImport);

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
   * Helper to prepare a record with contract definition data for saving
   */
  static prepareRecordWithDefinition(
    record: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'>,
    contractDefinition?: string,
    contractDefinitionSource?: 'fetched' | 'manual',
    contractDefinitionMetadata?: ContractDefinitionMetadata,
    contractDefinitionOriginal?: string,
    contractDefinitionArtifacts?: Record<string, unknown>
  ): Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'> {
    const recordWithDefinition = {
      ...record,
      contractDefinitionSource,
      contractDefinition,
      contractDefinitionOriginal,
      contractDefinitionMetadata,
      contractDefinitionArtifacts,
    };

    return recordWithDefinition;
  }

  /**
   * Updates contract definition data for existing record
   */
  async updateDefinition(
    id: string,
    contractDefinition: string,
    contractDefinitionSource: 'fetched' | 'manual',
    contractDefinitionMetadata?: ContractDefinitionMetadata,
    contractDefinitionOriginal?: string,
    contractDefinitionArtifacts?: Record<string, unknown>
  ): Promise<void> {
    try {
      const existing = await this.get(id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found`);
      }

      const updates: Partial<ContractUIRecord> = {
        contractDefinition,
        contractDefinitionOriginal,
        contractDefinitionSource,
        contractDefinitionMetadata,
        contractDefinitionArtifacts,
        updatedAt: new Date(),
      };

      await this.update(id, updates);
      logger.info('Contract definition updated', `ID: ${id}, Source: ${contractDefinitionSource}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update contract definition', errorMessage);
      throw new Error('Failed to update contract definition');
    }
  }

  /**
   * Gets records that need contract definition refresh (older than threshold)
   */
  async getRecordsNeedingDefinitionRefresh(
    thresholdHours: number = 24
  ): Promise<ContractUIRecord[]> {
    try {
      const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
      const allRecords = await this.getAll();

      const needsRefresh = allRecords.filter(
        (record) =>
          record.contractDefinitionSource === 'fetched' &&
          record.contractDefinitionMetadata?.fetchTimestamp &&
          record.contractDefinitionMetadata.fetchTimestamp < threshold
      );

      logger.info(
        'Definition refresh check',
        `Found ${needsRefresh.length} records needing refresh`
      );
      return needsRefresh;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get records needing definition refresh', errorMessage);
      throw new Error('Failed to check for definition refresh needs');
    }
  }

  /**
   * Compares stored contract definition with fresh definition
   * Note: Actual comparison logic should be implemented in chain-specific adapters
   */
  async compareStoredDefinition(
    id: string,
    freshContractDefinition: string
  ): Promise<{
    record: ContractUIRecord;
    hasStoredDefinition: boolean;
    definitionsMatch: boolean;
    needsUpdate: boolean;
  }> {
    try {
      const record = await this.get(id);
      if (!record) {
        throw new Error(`Record with id ${id} not found`);
      }

      const hasStoredDefinition = !!record.contractDefinition;

      if (!hasStoredDefinition) {
        return {
          record,
          hasStoredDefinition: false,
          definitionsMatch: false,
          needsUpdate: true,
        };
      }

      // Simple string comparison - chain-specific adapters should implement
      // more sophisticated comparison logic
      const definitionsMatch = record.contractDefinition === freshContractDefinition;

      return {
        record,
        hasStoredDefinition: true,
        definitionsMatch: definitionsMatch,
        needsUpdate: !definitionsMatch,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to compare stored definition', errorMessage);
      throw new Error('Failed to compare contract definitions');
    }
  }

  /**
   * Gets records by contract definition hash for quick lookup
   */
  async getRecordsByDefinitionHash(definitionHash: string): Promise<ContractUIRecord[]> {
    try {
      const allRecords = await this.getAll();
      const matchingRecords = allRecords.filter(
        (record) => record.contractDefinitionMetadata?.definitionHash === definitionHash
      );

      logger.info(
        'Definition hash lookup',
        `Found ${matchingRecords.length} records with hash ${definitionHash}`
      );
      return matchingRecords;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get records by definition hash', errorMessage);
      throw new Error('Failed to lookup records by definition hash');
    }
  }
}

// Export singleton instance
export const contractUIStorage = new ContractUIStorage();
