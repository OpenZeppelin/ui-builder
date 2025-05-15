import { createContext } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';

// Create a context to share the adapter state
export interface SharedAdapterState {
  adapter: ContractAdapter | null;
  loading: boolean;
}

const SharedAdapterContext = createContext<SharedAdapterState>({
  adapter: null,
  loading: false,
});

export default SharedAdapterContext;
