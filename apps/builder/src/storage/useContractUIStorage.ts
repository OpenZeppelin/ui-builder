import type { Table } from 'dexie';
import { toast } from 'sonner';

import { createRepositoryHook } from '@openzeppelin/ui-storage';
import type { ContractDefinitionMetadata } from '@openzeppelin/ui-types';

import { contractUIStorage } from './ContractUIStorage';
import { db } from './database';
import type { ContractUIRecord } from './types';

export interface UseContractUIStorageReturn {
  // Data
  contractUIs: ContractUIRecord[] | undefined;
  isLoading: boolean;

  // Actions
  saveContractUI: (
    record: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateContractUI: (id: string, updates: Partial<ContractUIRecord>) => Promise<void>;
  deleteContractUI: (id: string) => Promise<void>;
  deleteAllContractUIs: () => Promise<void>;
  duplicateContractUI: (id: string) => Promise<string>;
  exportContractUIs: (ids?: string[]) => Promise<void>;
  importContractUIs: (file: File) => Promise<string[]>;
  updateContractDefinition: (
    id: string,
    contractDefinition: string,
    contractDefinitionSource: 'fetched' | 'manual',
    contractDefinitionMetadata?: ContractDefinitionMetadata,
    contractDefinitionOriginal?: string,
    contractDefinitionArtifacts?: Record<string, unknown>
  ) => Promise<void>;
  getRecordsNeedingDefinitionRefresh: (thresholdHours?: number) => Promise<ContractUIRecord[]>;
  compareStoredDefinition: (
    id: string,
    freshDefinition: string
  ) => Promise<{
    record: ContractUIRecord;
    hasStoredDefinition: boolean;
    definitionsMatch: boolean;
    needsUpdate: boolean;
  }>;
  getRecordsByDefinitionHash: (definitionHash: string) => Promise<ContractUIRecord[]>;
}

const toastOnError = (title: string, error: unknown) => {
  toast.error(title, { description: error instanceof Error ? error.message : 'Unknown error' });
};

const useBase = createRepositoryHook<ContractUIRecord, typeof contractUIStorage>({
  db,
  tableName: 'contractUIs',
  query: (table: Table<ContractUIRecord, string>) => table.orderBy('updatedAt').reverse().toArray(),
  repo: contractUIStorage,
  onError: toastOnError,
  fileIO: {
    exportJson: (ids?: string[]) => contractUIStorage.export(ids),
    importJson: (json: string) => contractUIStorage.import(json),
    filePrefix: 'contract-uis',
    shouldExport: (parsed: unknown) => {
      // Only export if there are configurations
      const data = parsed as { configurations?: unknown[] };
      return (data?.configurations?.length ?? 0) > 0;
    },
  },
  expose: (repo) => ({
    duplicateContractUI: (id: string) => repo.duplicate(id),
    updateContractDefinition: repo.updateDefinition.bind(repo),
    getRecordsNeedingDefinitionRefresh: repo.getRecordsNeedingDefinitionRefresh.bind(repo),
    compareStoredDefinition: repo.compareStoredDefinition.bind(repo),
    getRecordsByDefinitionHash: repo.getRecordsByDefinitionHash.bind(repo),
  }),
});

export function useContractUIStorage(): UseContractUIStorageReturn {
  const base = useBase() as unknown as {
    records: ContractUIRecord[] | undefined;
    isLoading: boolean;
    save: UseContractUIStorageReturn['saveContractUI'];
    update: UseContractUIStorageReturn['updateContractUI'];
    remove: UseContractUIStorageReturn['deleteContractUI'];
    clear: UseContractUIStorageReturn['deleteAllContractUIs'];
    exportAsFile: UseContractUIStorageReturn['exportContractUIs'];
    importFromFile: UseContractUIStorageReturn['importContractUIs'];
    duplicateContractUI: UseContractUIStorageReturn['duplicateContractUI'];
    updateContractDefinition: UseContractUIStorageReturn['updateContractDefinition'];
    getRecordsNeedingDefinitionRefresh: UseContractUIStorageReturn['getRecordsNeedingDefinitionRefresh'];
    compareStoredDefinition: UseContractUIStorageReturn['compareStoredDefinition'];
    getRecordsByDefinitionHash: UseContractUIStorageReturn['getRecordsByDefinitionHash'];
  };

  return {
    contractUIs: base.records,
    isLoading: base.isLoading,
    saveContractUI: base.save,
    updateContractUI: base.update,
    deleteContractUI: base.remove,
    deleteAllContractUIs: base.clear,
    duplicateContractUI: base.duplicateContractUI,
    exportContractUIs: base.exportAsFile,
    importContractUIs: base.importFromFile,
    updateContractDefinition: base.updateContractDefinition,
    getRecordsNeedingDefinitionRefresh: base.getRecordsNeedingDefinitionRefresh,
    compareStoredDefinition: base.compareStoredDefinition,
    getRecordsByDefinitionHash: base.getRecordsByDefinitionHash,
  };
}
