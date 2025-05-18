/**
 * Adapter Singleton Pattern
 *
 * This module implements a singleton pattern for adapter instances using React Context.
 * The pattern ensures that only one adapter instance exists per network configuration,
 * which is critical for maintaining consistent wallet connection state across the app.
 *
 * The implementation consists of several files:
 * - AdapterContext.tsx: Defines the context and types
 * - AdapterProvider.tsx: Implements the provider component that manages the adapter registry
 * - useAdapterContext.ts: Provides a hook to access the context
 * - useConfiguredAdapterSingleton.ts: Provides a hook to safely get adapter instances
 *
 * This pattern solves the issue of multiple adapter instances causing inconsistent
 * wallet connection state and improves performance by reusing existing adapters.
 */

// Export adapter context and provider
export { AdapterProvider } from './AdapterProvider';
export { useAdapterContext } from './useAdapterContext';

// Export WalletState context, provider, and hook
export { WalletStateProvider } from './WalletStateProvider';
export { useWalletState, WalletStateContext } from './WalletStateContext';
