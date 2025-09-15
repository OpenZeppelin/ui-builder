import { useContext } from 'react';

import { UseContractUIStorageReturn } from '@openzeppelin/contracts-ui-builder-storage';

import { ContractUIStorageContext } from './ContractUIStorageContext';

/**
 * Hook to access the shared contract UI storage operations from context.
 *
 * IMPORTANT: Always use this hook instead of directly importing from @openzeppelin/contracts-ui-builder-storage.
 * This wrapper ensures a single Dexie.js subscription shared across all components, preventing
 * state conflicts and unwanted remounting that occur with multiple independent subscriptions.
 *
 * Architecture: Storage Package Hook → ContractUIStorageProvider (single instance) → This Context Hook
 */
export function useContractUIStorage(): UseContractUIStorageReturn {
  const context = useContext(ContractUIStorageContext);

  if (!context) {
    throw new Error('useContractUIStorage must be used within a ContractUIStorageProvider');
  }

  return context;
}
