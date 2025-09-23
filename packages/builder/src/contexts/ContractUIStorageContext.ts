import { createContext } from 'react';

import { UseContractUIStorageReturn } from '@openzeppelin/ui-builder-storage';

/**
 * Context for sharing a single instance of contract UI storage operations.
 * This prevents multiple Dexie live query subscriptions from interfering with each other.
 */
export const ContractUIStorageContext = createContext<UseContractUIStorageReturn | undefined>(
  undefined
);
