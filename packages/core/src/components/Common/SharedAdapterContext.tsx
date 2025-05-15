import { createContext } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';

// Context to share adapter between WalletIntegration and WalletConnectionHeader
export interface SharedAdapterContextType {
  adapter: ContractAdapter | null;
  loading: boolean;
}

const SharedAdapterContext = createContext<SharedAdapterContextType | null>(null);

export default SharedAdapterContext;
