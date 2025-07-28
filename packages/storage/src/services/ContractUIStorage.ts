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

      // Filter out empty/draft records from export
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

      // Filter out empty/draft records from import data
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
   * Checks if a record is considered "empty" or a draft.
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
   * Checks if a record can be deleted.
   * Draft/empty records cannot be deleted to maintain user working space.
   */
  canDelete(record: ContractUIRecord): boolean {
    return !this.isEmptyRecord(record);
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
   * Creates a minimal draft record for immediate storage.
   * @param ecosystem The blockchain ecosystem (defaults to 'evm')
   * @returns Promise resolving to the created record ID
   */
  async createDraftRecord(ecosystem: string = 'evm'): Promise<string> {
    try {
      const draftRecord: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'New Contract UI',
        ecosystem,
        networkId: '',
        contractAddress: '',
        functionId: '',
        formConfig: {
          id: 'draft',
          title: 'Contract UI Form',
          functionId: '',
          contractAddress: '',
          fields: [],
          layout: {
            columns: 1 as const,
            spacing: 'normal' as const,
            labelPosition: 'top' as const,
          },
          validation: {
            mode: 'onChange' as const,
            showErrors: 'inline' as const,
          },
          submitButton: {
            text: 'Submit',
            loadingText: 'Processing...',
          },
          theme: {},
          description: '',
        },
        metadata: {
          isDraft: true,
          isManuallyRenamed: false,
        },
      };

      const id = await this.save(draftRecord);
      logger.info('Draft record created', `ID: ${id}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create draft record', errorMessage);
      throw new Error('Failed to create draft record');
    }
  }

  /**
   * Finds an existing empty record or creates a new draft record.
   * This ensures we don't create duplicate empty records.
   * @param ecosystem The blockchain ecosystem (defaults to 'evm')
   * @returns Promise resolving to the record ID (existing or newly created)
   */
  async findOrCreateDraftRecord(ecosystem: string = 'evm'): Promise<string> {
    try {
      const emptyRecords = await this.findEmptyRecords();

      if (emptyRecords.length > 0) {
        // Return the most recently updated empty record
        const mostRecent = emptyRecords.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        logger.info('Reusing existing empty record', `ID: ${mostRecent.id}`);
        return mostRecent.id;
      }

      // No empty records found, create a new draft
      return await this.createDraftRecord(ecosystem);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find or create draft record', errorMessage);
      throw new Error('Failed to find or create draft record');
    }
  }
}

// Export singleton instance
export const contractUIStorage = new ContractUIStorage();
