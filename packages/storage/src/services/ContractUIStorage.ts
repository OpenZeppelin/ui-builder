import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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

      const { id: _, createdAt, updatedAt, ...recordData } = original;
      const newTitle = `${original.title} (Copy)`;

      return await this.save({
        ...recordData,
        title: newTitle,
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

      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations,
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

      const importedIds: string[] = [];

      for (const config of data.configurations) {
        const { id: _, createdAt, updatedAt, ...recordData } = config;
        const newId = await this.save(recordData);
        importedIds.push(newId);
      }

      logger.info('Contract UIs imported', `Count: ${importedIds.length}`);
      return importedIds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to import Contract UIs', errorMessage);
      throw new Error('Failed to import configurations');
    }
  }
}

// Export singleton instance
export const contractUIStorage = new ContractUIStorage();
