import { useContext } from 'react';

import SharedAdapterContext, { type SharedAdapterState } from '../context/SharedAdapterContext';

/**
 * Hook to access the shared adapter state
 * @returns The shared adapter state
 */
export const useSharedAdapter = (): SharedAdapterState => {
  return useContext(SharedAdapterContext);
};
