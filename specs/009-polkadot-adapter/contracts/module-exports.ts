/**
 * API Contract: adapter-polkadot Module Exports
 *
 * This file defines the public API surface of the adapter-polkadot package.
 * All exports listed here MUST be available from '@openzeppelin/ui-builder-adapter-polkadot'.
 *
 * This serves as the contract for consumers of the Polkadot adapter.
 */

import type React from 'react';

import type { ContractAdapter, FunctionParameter, NetworkConfig } from '@openzeppelin/ui-types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Polkadot network execution types.
 * - 'evm': Networks using EVM via PolkaVM/REVM or native EVM (Moonbeam)
 * - 'substrate': Future - Native Substrate/Wasm chains
 */
export type PolkadotExecutionType = 'evm' | 'substrate';

/**
 * Network category for UI grouping.
 * - 'hub': Official Polkadot/Kusama system chains (displayed first)
 * - 'parachain': Independent parachains (displayed after hub networks)
 */
export type PolkadotNetworkCategory = 'hub' | 'parachain';

/**
 * The Polkadot/Kusama relay chain this network connects to.
 */
export type PolkadotRelayChain = 'polkadot' | 'kusama';

/**
 * Extended network configuration for Polkadot ecosystem.
 * Inherits from TypedEvmNetworkConfig for EVM-compatible networks.
 */
export interface TypedPolkadotNetworkConfig {
  /** Unique network identifier */
  id: string;
  /** Display name */
  name: string;
  /** Ecosystem identifier - always 'polkadot' */
  ecosystem: 'polkadot';
  /** Network slug */
  network: string;
  /** Network type */
  type: 'mainnet' | 'testnet';
  /** Whether this is a testnet */
  isTestnet: boolean;
  /** EVM chain ID */
  chainId: number;
  /** Primary RPC endpoint */
  rpcUrl: string;
  /** Block explorer URL */
  explorerUrl?: string;
  /** Explorer API URL for ABI loading */
  apiUrl?: string;
  /** Whether to use Etherscan V2 API format */
  supportsEtherscanV2?: boolean;
  /** Native currency configuration */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** viem chain definition (optional) */
  viemChain?: unknown;
  /** Execution type determines which handler processes requests */
  executionType: PolkadotExecutionType;
  /** Network category for UI grouping */
  networkCategory: PolkadotNetworkCategory;
  /** Optional: The relay chain this network is connected to */
  relayChain?: PolkadotRelayChain;
}

// =============================================================================
// ADAPTER CLASS
// =============================================================================

/**
 * PolkadotAdapter implements ContractAdapter for the Polkadot ecosystem.
 * Delegates all EVM operations to adapter-evm-core modules.
 */
export declare class PolkadotAdapter implements ContractAdapter {
  /**
   * Create a new PolkadotAdapter instance.
   * @param networkConfig - The Polkadot network configuration
   */
  constructor(networkConfig: NetworkConfig);

  /**
   * Load a contract schema from an address.
   * Uses Blockscout (V1 API) for Hub networks, Moonscan (V2 API) for parachains.
   * Falls back to Sourcify if primary provider fails.
   */
  loadContract(
    address: string,
    options?: {
      artifacts?: unknown;
      skipProxyDetection?: boolean;
    }
  ): Promise<ContractSchema>;

  /**
   * Map a Solidity parameter type to a UI field type.
   * Delegates to adapter-evm-core.
   */
  mapParameterTypeToFieldType(paramType: string): FieldType;

  /**
   * Get compatible field types for a parameter type.
   * Delegates to adapter-evm-core.
   */
  getCompatibleFieldTypes(paramType: string): FieldType[];

  /**
   * Generate default field configuration for a function parameter.
   * Delegates to adapter-evm-core.
   */
  generateDefaultField(
    param: FunctionParameter,
    functionId: string,
    paramIndex: number
  ): FormFieldType;

  /**
   * Format blockchain result for display.
   * Delegates to adapter-evm-core.
   */
  formatFunctionResult(result: unknown, outputs: FunctionParameter[], functionId: string): string;

  /**
   * Check if a function is view/pure (doesn't require transaction).
   * Delegates to adapter-evm-core.
   */
  isViewFunction(func: { stateMutability?: string }): boolean;

  /**
   * Query a view/pure function without wallet connection.
   * Delegates to adapter-evm-core.
   */
  queryViewFunction(
    address: string,
    functionId: string,
    params: unknown[],
    schema: ContractSchema
  ): Promise<unknown>;

  /**
   * Validate an address format.
   * Uses EVM address validation (0x + 40 hex chars).
   */
  isValidAddress(address: string, addressType?: string): boolean;

  /**
   * Get supported contract definition providers.
   * Returns Etherscan (for Blockscout/Moonscan) and Sourcify.
   */
  getSupportedContractDefinitionProviders(): Array<{ key: string; label: string }>;

  /**
   * Sign and broadcast a transaction.
   */
  signAndBroadcast(
    address: string,
    functionId: string,
    params: unknown[],
    schema: ContractSchema,
    executionConfig: unknown
  ): Promise<unknown>;

  /**
   * The current network configuration.
   */
  readonly networkConfig: TypedPolkadotNetworkConfig;
}

// =============================================================================
// NETWORK CONFIGURATIONS
// =============================================================================

/**
 * Polkadot Hub mainnet configuration.
 * ID: 'polkadot-hub', Chain ID: 420420419, Currency: DOT, Explorer: Blockscout
 */
export declare const polkadotHubMainnet: TypedPolkadotNetworkConfig;

/**
 * Kusama Hub mainnet configuration.
 * ID: 'kusama-hub', Chain ID: 420420418, Currency: KSM, Explorer: Blockscout
 */
export declare const kusamaHubMainnet: TypedPolkadotNetworkConfig;

/**
 * Moonbeam mainnet configuration.
 * ID: 'polkadot-moonbeam-mainnet', Chain ID: 1284, Currency: GLMR, Explorer: Moonscan
 */
export declare const moonbeamMainnet: TypedPolkadotNetworkConfig;

/**
 * Moonriver mainnet configuration.
 * ID: 'polkadot-moonriver-mainnet', Chain ID: 1285, Currency: MOVR, Explorer: Moonscan
 */
export declare const moonriverMainnet: TypedPolkadotNetworkConfig;

/**
 * Polkadot Hub testnet configuration.
 * ID: 'polkadot-hub-testnet', Chain ID: 420420417, Currency: PAS, Explorer: Blockscout
 */
export declare const polkadotHubTestnet: TypedPolkadotNetworkConfig;

/**
 * Moonbase Alpha testnet configuration.
 * ID: 'polkadot-moonbase-alpha-testnet', Chain ID: 1287, Currency: DEV, Explorer: Moonscan
 */
export declare const moonbaseAlphaTestnet: TypedPolkadotNetworkConfig;

/**
 * All Polkadot mainnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2).
 */
export declare const polkadotMainnetNetworks: readonly TypedPolkadotNetworkConfig[];

/**
 * All Polkadot testnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2).
 */
export declare const polkadotTestnetNetworks: readonly TypedPolkadotNetworkConfig[];

/**
 * All Polkadot network configurations as an array.
 * Used by ecosystem manager for registration.
 * Hub networks appear first (P1), followed by parachain networks (P2).
 */
export declare const polkadotNetworks: TypedPolkadotNetworkConfig[];

// =============================================================================
// VIEM CHAIN DEFINITIONS
// =============================================================================

/**
 * Custom viem chain definition for Polkadot Hub.
 * Not yet available in viem/chains.
 */
export declare const polkadotHub: {
  readonly id: 420420419;
  readonly name: 'Polkadot Hub';
  readonly nativeCurrency: {
    readonly name: 'Polkadot';
    readonly symbol: 'DOT';
    readonly decimals: 18;
  };
  readonly rpcUrls: {
    readonly default: { readonly http: readonly string[] };
  };
  readonly blockExplorers: {
    readonly default: { readonly name: string; readonly url: string };
  };
};

/**
 * Custom viem chain definition for Kusama Hub.
 * Not yet available in viem/chains.
 */
export declare const kusamaHub: {
  readonly id: 420420418;
  readonly name: 'Kusama Hub';
  readonly nativeCurrency: {
    readonly name: 'Kusama';
    readonly symbol: 'KSM';
    readonly decimals: 18;
  };
  readonly rpcUrls: {
    readonly default: { readonly http: readonly string[] };
  };
  readonly blockExplorers: {
    readonly default: { readonly name: string; readonly url: string };
  };
};

/**
 * Custom viem chain definition for Polkadot Hub TestNet.
 * Not yet available in viem/chains.
 */
export declare const polkadotHubTestNet: {
  readonly id: 420420417;
  readonly name: 'Polkadot Hub TestNet';
  readonly nativeCurrency: {
    readonly name: 'Paseo';
    readonly symbol: 'PAS';
    readonly decimals: 18;
  };
  readonly rpcUrls: {
    readonly default: { readonly http: readonly string[] };
  };
  readonly blockExplorers: {
    readonly default: { readonly name: string; readonly url: string };
  };
  readonly testnet: true;
};

// =============================================================================
// WALLET COMPONENTS
// =============================================================================

/**
 * Root component for Polkadot wallet UI.
 * Wraps wagmi provider with Polkadot-specific chain configurations.
 */
export declare const PolkadotWalletUiRoot: React.ComponentType<{
  children: React.ReactNode;
  chains?: unknown[];
}>;

/**
 * Polkadot viem chains array for wallet configuration.
 * Contains all supported Polkadot ecosystem chains (Hub, Moonbeam, etc.).
 */
export declare const polkadotChains: readonly unknown[];

/**
 * Polkadot adapter configuration for ecosystem registration.
 * Used by the builder app's ecosystem manager.
 */
export declare const polkadotAdapterConfig: {
  ecosystem: 'polkadot';
  name: string;
  networks: TypedPolkadotNetworkConfig[];
  createAdapter: (config: NetworkConfig) => PolkadotAdapter;
};

// =============================================================================
// NOTE: No utility functions exported
// =============================================================================
// Following the same pattern as adapter-evm, users can filter networks directly:
//   polkadotNetworks.filter(n => n.networkCategory === 'hub')
//   polkadotNetworks.filter(n => n.relayChain === 'kusama')
//   polkadotNetworks.find(n => n.chainId === 1284)
