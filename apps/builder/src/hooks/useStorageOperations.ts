import { useContext } from 'react';

import {
  StorageOperationsContext,
  type StorageOperationsContextValue,
  type StorageOperationState,
} from '../contexts/storageOperationsTypes';

/**
 * Hook to access storage operation states for contract UI items.
 */
export function useStorageOperations(): StorageOperationsContextValue {
  const context = useContext(StorageOperationsContext);

  if (!context) {
    throw new Error('useStorageOperations must be used within a StorageOperationsProvider');
  }

  return context;
}

/**
 * Hook to get operation state for a specific contract UI item.
 * Returns default state if not within provider context.
 */
export function useContractUIOperationState(
  id: string
): StorageOperationState & { isAnyOperationInProgress: boolean } {
  const context = useContext(StorageOperationsContext);

  if (!context) {
    // Not within provider context, return default state
    return {
      isLoading: false,
      isSaving: false,
      isDeleting: false,
      isDuplicating: false,
      isExporting: false,
      isAnyOperationInProgress: false,
    };
  }

  const { getOperationState, isAnyOperationInProgress } = context;
  const state = getOperationState(id);
  return {
    ...state,
    isAnyOperationInProgress: isAnyOperationInProgress(id),
  };
}
