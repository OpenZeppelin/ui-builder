import type React from 'react';

/**
 * Configuration for the desired UI kit to be used by an adapter.
 */
export interface UiKitConfiguration {
  /** Name of the chosen UI kit (e.g., 'rainbowkit', 'connectkit'). Use 'none' for the default internal implementation. */
  kitName?: 'rainbowkit' | 'connectkit' | 'appkit' | 'custom' | 'none';
  /** Kit-specific configuration options (e.g., RainbowKit projectId, theme, or configuration for the default implementation). */
  kitConfig?: Record<string, unknown>;
}

/**
 * A generic hook function type that can be called with any parameters and returns any result.
 * This allows us to maintain flexibility for adapter implementations while avoiding the use of 'any'.
 */
type GenericHook<TParams extends unknown[] = [], TResult = unknown> = (...args: TParams) => TResult;

/**
 * Defines the shape of facade hooks provided by an adapter for its ecosystem.
 * These typically wrap underlying library hooks (e.g., from wagmi).
 *
 * We use generic hook signatures to allow direct use of library hooks
 * without tightly coupling to their specific parameter and return types.
 */
export interface EcosystemSpecificReactHooks {
  // Hooks that don't require parameters
  useAccount?: GenericHook;
  useConnect?: GenericHook;
  useDisconnect?: GenericHook;
  useSwitchChain?: GenericHook;
  useChainId?: GenericHook;
  useChains?: GenericHook;

  // Hooks that typically require parameters
  useBalance?: GenericHook;
  useSendTransaction?: GenericHook;
  useWaitForTransactionReceipt?: GenericHook;
  useSignMessage?: GenericHook;
  useSignTypedData?: GenericHook;
  // Other ecosystem-specific hooks can be added as needed
}

/**
 * Props for the ecosystem-specific UI context provider component.
 */
export interface EcosystemReactUiProviderProps {
  children: React.ReactNode;
}

/**
 * Base props interface that all component props should be compatible with.
 * Components can extend this with additional props as needed.
 */
export interface BaseComponentProps {
  className?: string;
}

/**
 * Defines standardized names for commonly needed wallet UI components
 * that an adapter might provide.
 */
export interface EcosystemWalletComponents {
  // Using a generic type parameter with a default of BaseComponentProps
  // This allows components with more specific props that include at least className
  ConnectButton?: React.ComponentType<BaseComponentProps>;
  AccountDisplay?: React.ComponentType<BaseComponentProps>;
  NetworkSwitcher?: React.ComponentType<BaseComponentProps>;
}
