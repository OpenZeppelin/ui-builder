/**
 * Network Configuration Types
 *
 * This file defines the TypeScript types for network configurations across different blockchain ecosystems.
 * It uses a discriminated union pattern with the 'ecosystem' property as the discriminant to ensure type safety.
 */
import { Ecosystem, NetworkType } from '../common/ecosystem';

/**
 * Base interface with common properties shared across all network configurations
 */
export interface BaseNetworkConfig {
  /**
   * Unique identifier for the network, e.g., 'ethereum-mainnet', 'polygon-amoy'
   */
  id: string;

  /**
   * User-friendly network name, e.g., 'Ethereum Mainnet'
   */
  name: string;

  /**
   * The blockchain ecosystem this network belongs to (discriminant for the union type)
   */
  ecosystem: Ecosystem;

  /**
   * Parent network name, e.g., 'ethereum', 'polygon'
   */
  network: string;

  /**
   * Network type/environment: 'mainnet', 'testnet', or 'devnet'
   */
  type: NetworkType;

  /**
   * Explicit flag for easy filtering of test networks
   */
  isTestnet: boolean;

  /**
   * The constant name under which this specific network configuration object
   * is exported from its adapter package's network index file.
   * Used by the export system to dynamically import the correct config.
   * Example: 'ethereumMainnet', 'ethereumSepolia'
   */
  exportConstName: string;

  /**
   * Base URL for the block explorer (common across ecosystems)
   */
  explorerUrl?: string;

  /**
   * Optional icon name for the network (for use with @web3icons/react or similar)
   * If not provided, the network property will be used as a fallback
   */
  icon?: string;

  /**
   * A unique identifier for the specific explorer API service used by this network.
   * This is used by the AppConfigService to fetch the correct API key.
   * Examples: "etherscan-mainnet", "polygonscan-mainnet", "bscscan-mainnet"
   * Should align with keys in AppRuntimeConfig.networkServiceConfigs
   */
  primaryExplorerApiIdentifier?: string;
}

/**
 * EVM-specific network configuration
 */
export interface EvmNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'evm';

  /**
   * EVM chain ID, e.g., 1 for Ethereum Mainnet, 11155111 for Sepolia
   */
  chainId: number;

  /**
   * JSON-RPC endpoint for the network (can be a base URL if API key is resolved from env)
   */
  rpcUrl: string;

  /**
   * Native currency information
   */
  nativeCurrency: {
    name: string; // e.g., 'Ether'
    symbol: string; // e.g., 'ETH'
    decimals: number; // typically 18
  };

  /**
   * Optional icon name for the network (for use with @web3icons/react or similar)
   * If not provided, the network property will be used as a fallback
   */
  apiUrl?: string;

  /**
   * Whether this network supports Etherscan V2 API (default: true for all Etherscan-compatible explorers)
   */
  supportsEtherscanV2?: boolean;

  /**
   * Whether this network's explorer requires an API key for basic operations (default: true)
   * Some explorers like routescan.io provide free access without API keys
   */
  requiresExplorerApiKey?: boolean;

  /**
   * Optional chain-specific configuration object for this network.
   * For EVM networks, this should be a Viem Chain object.
   * If provided, this will be used directly by the chain's clients.
   * If not provided, a fallback or minimal custom chain object might be used.
   */
  viemChain?: unknown;
}

/**
 * Solana-specific network configuration
 */
export interface SolanaNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'solana';

  /**
   * RPC endpoint for Solana network
   */
  rpcEndpoint: string;

  /**
   * Solana transaction confirmation commitment level
   */
  commitment: 'confirmed' | 'finalized';
}

/**
 * Stellar-specific network configuration
 */
export interface StellarNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'stellar';

  /**
   * Horizon server URL (for Stellar Classic operations)
   */
  horizonUrl: string;

  /**
   * Soroban RPC server URL (for smart contract operations)
   */
  sorobanRpcUrl: string;

  /**
   * Stellar network passphrase
   */
  networkPassphrase: string;
}

/**
 * Midnight-specific network configuration
 */
export interface MidnightNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'midnight';

  // Additional Midnight-specific properties can be added here as the protocol evolves
}

/**
 * Union type for all network configurations
 * This allows us to handle network configurations in a type-safe manner
 */
export type NetworkConfig =
  | EvmNetworkConfig
  | SolanaNetworkConfig
  | StellarNetworkConfig
  | MidnightNetworkConfig;

/**
 * Type guard to check if a network config is for EVM
 * @param config The network configuration to check
 * @returns True if the config is for EVM
 */
export const isEvmNetworkConfig = (config: NetworkConfig): config is EvmNetworkConfig =>
  config.ecosystem === 'evm';

/**
 * Type guard to check if a network config is for Solana
 * @param config The network configuration to check
 * @returns True if the config is for Solana
 */
export const isSolanaNetworkConfig = (config: NetworkConfig): config is SolanaNetworkConfig =>
  config.ecosystem === 'solana';

/**
 * Type guard to check if a network config is for Stellar
 * @param config The network configuration to check
 * @returns True if the config is for Stellar
 */
export const isStellarNetworkConfig = (config: NetworkConfig): config is StellarNetworkConfig =>
  config.ecosystem === 'stellar';

/**
 * Type guard to check if a network config is for Midnight
 * @param config The network configuration to check
 * @returns True if the config is for Midnight
 */
export const isMidnightNetworkConfig = (config: NetworkConfig): config is MidnightNetworkConfig =>
  config.ecosystem === 'midnight';
