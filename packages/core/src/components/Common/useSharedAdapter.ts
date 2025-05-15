import { useContext } from 'react';

import SharedAdapterContext, { SharedAdapterContextType } from './SharedAdapterContext';

// Hook to access the shared adapter context
export const useSharedAdapter = (): SharedAdapterContextType => {
  const context = useContext(SharedAdapterContext);
  if (!context) {
    throw new Error('useSharedAdapter must be used within a WalletIntegration component');
  }
  return context;
};
