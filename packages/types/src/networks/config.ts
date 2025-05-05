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
   * Base URL for the block explorer (common across ecosystems)
   */
  explorerUrl?: string;
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
   * JSON-RPC endpoint for the network
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
   * Horizon server URL
   */
  horizonUrl: string;

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
