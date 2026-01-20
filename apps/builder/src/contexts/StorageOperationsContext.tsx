import { useState, type ReactNode } from 'react';

import { StorageOperationsContext, type StorageOperationState } from './storageOperationsTypes';

interface StorageOperationsProviderProps {
  children: ReactNode;
}

/**
 * Provider for tracking storage operation states for individual contract UI items.
 * This enables showing progress indicators on specific items in the sidebar.
 */
export function StorageOperationsProvider({ children }: StorageOperationsProviderProps) {
  const [operationStates, setOperationStates] = useState<
    Record<string, Partial<StorageOperationState>>
  >({});

  const getOperationState = (id: string): StorageOperationState => {
    const state = operationStates[id];
    return {
      isLoading: state?.isLoading || false,
      isSaving: state?.isSaving || false,
      isDeleting: state?.isDeleting || false,
      isDuplicating: state?.isDuplicating || false,
      isExporting: state?.isExporting || false,
    };
  };

  const updateOperationState = (id: string, updates: Partial<StorageOperationState>) => {
    setOperationStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const setLoading = (id: string, isLoading: boolean) => {
    updateOperationState(id, { isLoading });
  };

  const setSaving = (id: string, isSaving: boolean) => {
    updateOperationState(id, { isSaving });
  };

  const setDeleting = (id: string, isDeleting: boolean) => {
    updateOperationState(id, { isDeleting });
  };

  const setDuplicating = (id: string, isDuplicating: boolean) => {
    updateOperationState(id, { isDuplicating });
  };

  const setExporting = (id: string, isExporting: boolean) => {
    updateOperationState(id, { isExporting });
  };

  const isAnyOperationInProgress = (id: string): boolean => {
    const state = getOperationState(id);
    return (
      state.isLoading ||
      state.isSaving ||
      state.isDeleting ||
      state.isDuplicating ||
      state.isExporting
    );
  };

  return (
    <StorageOperationsContext.Provider
      value={{
        getOperationState,
        setLoading,
        setSaving,
        setDeleting,
        setDuplicating,
        setExporting,
        isAnyOperationInProgress,
      }}
    >
      {children}
    </StorageOperationsContext.Provider>
  );
}
