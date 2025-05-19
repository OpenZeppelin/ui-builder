/**
 * useAdapterContext.ts
 *
 * This file provides a hook to access the AdapterContext throughout the application.
 * It's a critical part of the adapter singleton pattern, allowing components to
 * access the centralized adapter registry.
 *
 * The adapter singleton pattern ensures:
 * - Only one adapter instance exists per network
 * - Wallet connection state is consistent across the app
 * - Better performance by eliminating redundant adapter initialization
 */
import { useContext } from 'react';

import { AdapterContext, AdapterContextValue } from './AdapterContext';

/**
 * Hook to access the adapter context
 *
 * This hook provides access to the getAdapterForNetwork function which
 * retrieves or creates adapter instances from the singleton registry.
 *
 * Components should typically use useConfiguredAdapterSingleton instead
 * of this hook directly, as it handles React state update timing properly.
 *
 * @throws Error if used outside of an AdapterProvider context
 * @returns The adapter context value
 */
export function useAdapterContext(): AdapterContextValue {
  const context = useContext(AdapterContext);

  if (!context) {
    throw new Error('useAdapterContext must be used within an AdapterProvider');
  }

  return context;
}
