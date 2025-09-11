import { ReactNode } from 'react';

import { useContractUIStorage as useContractUIStorageHook } from '@openzeppelin/contracts-ui-builder-storage';

import { ContractUIStorageContext } from './ContractUIStorageContext';

interface ContractUIStorageProviderProps {
  children: ReactNode;
}

/**
 * Provider component that creates a single instance of the contract UI storage hook
 * and shares it with all child components via context.
 */
export function ContractUIStorageProvider({ children }: ContractUIStorageProviderProps) {
  const storageOperations = useContractUIStorageHook();

  return (
    <ContractUIStorageContext.Provider value={storageOperations}>
      {children}
    </ContractUIStorageContext.Provider>
  );
}
