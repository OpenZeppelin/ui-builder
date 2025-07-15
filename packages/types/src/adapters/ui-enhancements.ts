import type React from 'react';

import type { FormFieldType, FormValues } from '../forms';

/**
 * Configuration for excluding specific wallet components provided by an adapter for its 'custom' kit.
 */
export interface ComponentExclusionConfig {
  /**
   * Array of component keys (e.g., 'ConnectButton', 'NetworkSwitcher') to exclude
   * when the adapter provides its 'custom' set of UI components.
   */
  exclude?: Array<keyof EcosystemWalletComponents>;
}

/**
 * Configuration for the desired UI kit to be used by an adapter.
 */
export interface UiKitConfiguration {
  /** Name of the chosen UI kit (e.g., 'rainbowkit', 'connectkit'). Use 'custom' for adapter-provided default components or 'none' to disable adapter UI. */
  kitName: UiKitName;

  /**
   * Kit-specific configuration options.
   * This is an open-ended object to allow adapters to define their own configuration.
   * The adapter is responsible for validating and type-checking these values.
   */
  kitConfig: FormValues;

  customCode?: string;
}

/**
 * A generic hook function type that can be called with any parameters and returns any result.
 * This allows us to maintain flexibility for adapter implementations while avoiding the use of 'any'.
 */
type GenericHook<TParams extends unknown[] = [], TResult = unknown> = (...args: TParams) => TResult;

/**
 * Defines the shape of facade hooks provided by an adapter for its ecosystem.
 * These typically wrap underlying library hooks (e.g., from wagmi for EVM).
 *
 * We use generic hook signatures to allow direct use of library hooks
 * without tightly coupling to their specific parameter and return types.
 *
 * Adapters implementing these facade hooks are responsible for mapping their native
 * library's return values to a conventional set of properties expected by consumers.
 * This ensures that UI components using these facade hooks can remain chain-agnostic.
 *
 * @example For `useSwitchChain`:
 * Consumers will expect an object like:
 * ```typescript
 * {
 *   switchChain: (args: { chainId: number }) => void; // Function to initiate the switch
 *   isPending: boolean;                             // True if the switch is in progress
 *   error: Error | null;                            // Error object if the switch failed
 *   // chains?: Chain[]; // Optional: array of available chains, if provided by underlying hook
 * }
 * ```
 * If an adapter's underlying library uses `isLoading` instead of `isPending`,
 * the adapter's facade implementation for `useSwitchChain` should map `isLoading` to `isPending`.
 *
 * @example For `useAccount`:
 * Consumers will expect an object like:
 * ```typescript
 * {
 *   isConnected: boolean;
 *   address?: string;
 *   chainId?: number;
 *   // Other properties like `connector`, `status` might also be conventionally expected.
 * }
 * ```
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

export type NativeConfigLoader = (relativePath: string) => Promise<Record<string, unknown> | null>;

/**
 * Describes a UI kit available for a specific adapter, providing all necessary
 * metadata for the builder app to render its configuration options.
 */
export interface AvailableUiKit {
  /** A unique identifier for the UI kit (e.g., 'rainbowkit'). */
  id: string;

  /** The display name of the UI kit (e.g., 'RainbowKit'). */
  name: string;

  /** An optional link to the UI kit's documentation. */
  linkToDocs?: string;

  /**
   * An optional description of the UI kit and its configuration.
   * This can contain HTML for formatting (e.g., code blocks, links).
   */
  description?: string;

  /** An array of form fields required to configure the UI kit. */
  configFields: FormFieldType[];

  /**
   * If true, indicates that this UI kit supports advanced configuration via a code editor.
   * @default false
   */
  hasCodeEditor?: boolean;

  /**
   * The default boilerplate code to display if `hasCodeEditor` is true.
   */
  defaultCode?: string;
}

export type UiKitName = 'rainbowkit' | 'connectkit' | 'appkit' | 'custom' | 'none';
