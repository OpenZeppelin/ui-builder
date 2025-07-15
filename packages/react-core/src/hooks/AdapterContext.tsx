/**
 * AdapterContext.tsx
 *
 * This file defines the React Context used for the adapter singleton pattern.
 * It provides types and the context definition, but the actual implementation
 * is in the AdapterProvider component.
 *
 * The adapter singleton pattern ensures that only one adapter instance exists
 * per network configuration, which is critical for consistent wallet connection
 * state across the application.
 */
import { createContext } from 'react';

import type { ContractAdapter, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Registry type that maps network IDs to their corresponding adapter instances
 * This is the core data structure for the singleton pattern
 */
export interface AdapterRegistry {
  [networkId: string]: ContractAdapter;
}

/**
 * Context value interface defining what's provided through the context
 * The main functionality is getAdapterForNetwork which either returns
 * an existing adapter or initiates loading of a new one
 */
export interface AdapterContextValue {
  getAdapterForNetwork: (networkConfig: NetworkConfig | null) => {
    adapter: ContractAdapter | null;
    isLoading: boolean;
  };
}

/**
 * The React Context that provides adapter registry access throughout the app
 * Components can access this through the useAdapterContext hook
 */
export const AdapterContext = createContext<AdapterContextValue | null>(null);
