import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import { db } from '../database/db';
import { contractUIStorage } from '../services/ContractUIStorage';
import type { ContractUIRecord } from '../types';

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
  importContractUIs: (file: File) => Promise<void>;
}

export function useContractUIStorage(): UseContractUIStorageReturn {
  // Live query for reactive updates
  const contractUIs = useLiveQuery(() =>
    db.table('contractUIs').orderBy('updatedAt').reverse().toArray()
  );

  const isLoading = contractUIs === undefined;

  const saveContractUI = useCallback(
    async (record: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      try {
        const id = await contractUIStorage.save(record);
        return id;
      } catch (error) {
        toast.error('Failed to save', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        throw error;
      }
    },
    []
  );

  const updateContractUI = useCallback(
    async (id: string, updates: Partial<ContractUIRecord>): Promise<void> => {
      try {
        await contractUIStorage.update(id, updates);
      } catch (error) {
        toast.error('Failed to update', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        throw error;
      }
    },
    []
  );

  const deleteContractUI = useCallback(async (id: string): Promise<void> => {
    try {
      await contractUIStorage.delete(id);
    } catch (error) {
      toast.error('Failed to delete', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }, []);

  const deleteAllContractUIs = useCallback(async (): Promise<void> => {
    try {
      await contractUIStorage.clear();
    } catch (error) {
      toast.error('Failed to delete all', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }, []);

  const duplicateContractUI = useCallback(async (id: string): Promise<string> => {
    try {
      const newId = await contractUIStorage.duplicate(id);
      return newId;
    } catch (error) {
      toast.error('Failed to duplicate', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }, []);

  const exportContractUIs = useCallback(async (ids?: string[]): Promise<void> => {
    try {
      const jsonData = await contractUIStorage.export(ids);

      // Parse the export data to get the actual count of exported configurations
      const exportData = JSON.parse(jsonData);
      const exportedCount = exportData.configurations?.length || 0;

      if (exportedCount === 0) {
        toast.error('Nothing to export', {
          description: 'No configurations found to export.',
        });
        return;
      }

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-uis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }, []);

  const importContractUIs = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      await contractUIStorage.import(text);
    } catch (error) {
      toast.error('Failed to import', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      contractUIs,
      isLoading,
      saveContractUI,
      updateContractUI,
      deleteContractUI,
      deleteAllContractUIs,
      duplicateContractUI,
      exportContractUIs,
      importContractUIs,
    }),
    [
      contractUIs,
      isLoading,
      saveContractUI,
      updateContractUI,
      deleteContractUI,
      deleteAllContractUIs,
      duplicateContractUI,
      exportContractUIs,
      importContractUIs,
    ]
  );
}
