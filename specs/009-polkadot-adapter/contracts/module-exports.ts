/**
 * API Contract: adapter-polkadot Module Exports
 *
 * This file defines the public API surface of the adapter-polkadot package.
 * All exports listed here MUST be available from '@openzeppelin/ui-builder-adapter-polkadot'.
 *
 * This serves as the contract for consumers of the Polkadot adapter.
 */

import type {
  ContractAdapter,
  ContractSchema,
  ContractFunction,
  FunctionParameter,
  NetworkConfig,
  FieldType,
  FormFieldType,
} from '@openzeppelin/ui-types';

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
   * Parse user input to blockchain-compatible value.
   * Delegates to adapter-evm-core.
   */
  parseInput(value: string, type: string): unknown;

  /**
   * Format blockchain result for display.
   * Delegates to adapter-evm-core.
   */
  formatFunctionResult(
    result: unknown,
    outputs: FunctionParameter[],
    functionId: string
  ): string;

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
  getContractDefinitionProviders(): Array<{ key: string; label: string }>;

  /**
   * Get execution configuration UI for transactions.
   * Supports EOA and Relayer strategies.
   */
  getExecutionConfigUI(): unknown;

  /**
   * Execute a transaction using the configured strategy.
   */
  executeTransaction(
    address: string,
    functionId: string,
    params: unknown[],
    schema: ContractSchema,
    executionConfig: unknown
  ): Promise<unknown>;

  /**
   * Get the current network configuration.
   */
  getNetworkConfig(): TypedPolkadotNetworkConfig;
}

// =============================================================================
// NETWORK CONFIGURATIONS
// =============================================================================

/**
 * Polkadot Hub mainnet configuration.
 * Chain ID: 420420419, Currency: DOT, Explorer: Blockscout
 */
export declare const polkadotHubMainnet: TypedPolkadotNetworkConfig;

/**
 * Kusama Hub mainnet configuration.
 * Chain ID: 420420418, Currency: KSM, Explorer: Blockscout
 */
export declare const kusamaHubMainnet: TypedPolkadotNetworkConfig;

/**
 * Moonbeam mainnet configuration.
 * Chain ID: 1284, Currency: GLMR, Explorer: Moonscan
 */
export declare const moonbeamMainnet: TypedPolkadotNetworkConfig;

/**
 * Moonriver mainnet configuration.
 * Chain ID: 1285, Currency: MOVR, Explorer: Moonscan
 */
export declare const moonriverMainnet: TypedPolkadotNetworkConfig;

/**
 * Polkadot Hub testnet configuration.
 * Chain ID: 420420417, Currency: PAS, Explorer: Blockscout
 */
export declare const polkadotHubTestnet: TypedPolkadotNetworkConfig;

/**
 * Moonbase Alpha testnet configuration.
 * Chain ID: 1287, Currency: DEV, Explorer: Moonscan
 */
export declare const moonbaseAlphaTestnet: TypedPolkadotNetworkConfig;

/**
 * All mainnet network configurations in priority order.
 * Hub networks first, then parachains.
 */
export declare const mainnetNetworks: readonly TypedPolkadotNetworkConfig[];

/**
 * All testnet network configurations in priority order.
 * Hub networks first, then parachains.
 */
export declare const testnetNetworks: readonly TypedPolkadotNetworkConfig[];

/**
 * All network configurations indexed by ID.
 */
export declare const networks: Record<string, TypedPolkadotNetworkConfig>;

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
// WALLET COMPONENTS (Re-exported from adapter-evm)
// =============================================================================

/**
 * Root component for Polkadot wallet UI.
 * Wraps wagmi provider with Polkadot-specific chain configurations.
 */
export declare const PolkadotWalletUiRoot: React.ComponentType<{
  children: React.ReactNode;
  networkConfig: TypedPolkadotNetworkConfig;
}>;

/**
 * Connect wallet button component.
 * Re-exported from adapter-evm wallet components.
 */
export declare const ConnectButton: React.ComponentType;

/**
 * Account display component showing connected wallet.
 * Re-exported from adapter-evm wallet components.
 */
export declare const AccountDisplay: React.ComponentType;

/**
 * Network switcher component.
 * Re-exported from adapter-evm wallet components.
 */
export declare const NetworkSwitcher: React.ComponentType;

// =============================================================================
// ECOSYSTEM REGISTRATION
// =============================================================================

/**
 * Register the Polkadot ecosystem with the ecosystem manager.
 * Called automatically when the adapter is imported.
 */
export declare function registerPolkadotEcosystem(): void;

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get networks filtered by category.
 * @param category - The network category to filter by
 * @returns Array of networks matching the category
 */
export declare function getNetworksByCategory(
  category: PolkadotNetworkCategory
): TypedPolkadotNetworkConfig[];

/**
 * Get networks filtered by relay chain.
 * @param relayChain - The relay chain to filter by
 * @returns Array of networks connected to the relay chain
 */
export declare function getNetworksByRelayChain(
  relayChain: PolkadotRelayChain
): TypedPolkadotNetworkConfig[];

/**
 * Check if a network configuration is for a Hub network.
 */
export declare function isHubNetwork(
  config: TypedPolkadotNetworkConfig
): boolean;

/**
 * Check if a network configuration is for a parachain.
 */
export declare function isParachainNetwork(
  config: TypedPolkadotNetworkConfig
): boolean;
