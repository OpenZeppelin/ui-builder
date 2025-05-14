import type React from 'react';

/**
 * Configuration for the desired UI kit to be used by an adapter.
 */
export interface UiKitConfiguration {
  /** Name of the chosen UI kit (e.g., 'custom', 'rainbowkit', 'connectkit', 'appkit') or 'none'. */
  kitName?: 'rainbowkit' | 'connectkit' | 'appkit' | 'custom' | 'none';
  /** Kit-specific configuration options (e.g., RainbowKit projectId, theme). */
  kitConfig?: Record<string, unknown>;
}

/**
 * Defines the shape of facade hooks provided by an adapter for its ecosystem.
 * These typically wrap underlying library hooks (e.g., from wagmi/react).
 */
export interface EcosystemSpecificReactHooks {
  // TODO: Replace 'unknown' with actual imported Wagmi/React hook return types or accurately defined facade types in EvmAdapter.
  useAccount?: () => unknown;
  useConnect?: () => unknown;
  useDisconnect?: () => unknown;
  useSwitchChain?: () => unknown;
  useChainId?: () => unknown;
  useChains?: () => unknown;
  useBalance?: (args: unknown) => unknown;
  useSendTransaction?: (args: unknown) => unknown;
  useWaitForTransactionReceipt?: (args: unknown) => unknown;
  useSignMessage?: (args: unknown) => unknown;
  useSignTypedData?: (args: unknown) => unknown;
}

/**
 * Props for the ecosystem-specific UI context provider component.
 */
export interface EcosystemReactUiProviderProps {
  children: React.ReactNode;
}

/**
 * Defines standardized names for commonly needed wallet UI components
 * that an adapter might provide.
 */
export interface EcosystemWalletComponents {
  ConnectButton?: React.ComponentType<unknown>; // Props for these components would ideally be standardized or kept minimal.
  AccountDisplay?: React.ComponentType<unknown>;
  NetworkSwitcher?: React.ComponentType<unknown>;
}
