import { createContext } from 'react';

/**
 * Tracks the state of storage operations for individual contract UI items
 */
export interface StorageOperationState {
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  isExporting: boolean;
}

export interface StorageOperationsContextValue {
  /** Get operation state for a specific contract UI ID */
  getOperationState: (id: string) => StorageOperationState;

  /** Set loading state for a contract UI */
  setLoading: (id: string, isLoading: boolean) => void;

  /** Set saving state for a contract UI */
  setSaving: (id: string, isSaving: boolean) => void;

  /** Set deleting state for a contract UI */
  setDeleting: (id: string, isDeleting: boolean) => void;

  /** Set duplicating state for a contract UI */
  setDuplicating: (id: string, isDuplicating: boolean) => void;

  /** Set exporting state for a contract UI */
  setExporting: (id: string, isExporting: boolean) => void;

  /** Check if any operation is in progress for a contract UI */
  isAnyOperationInProgress: (id: string) => boolean;
}

export const StorageOperationsContext = createContext<StorageOperationsContextValue | null>(null);
