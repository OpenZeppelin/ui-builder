/**
 * Wallet Types for EVM Core
 *
 * Configuration types for the WagmiWalletImplementation class.
 * These types allow different adapters to configure the wallet implementation
 * with their specific chains and network configurations.
 */

import type { Chain } from 'viem';

import type { UiKitConfiguration } from '@openzeppelin/ui-types';

/**
 * Network configuration with chain ID to network ID mapping.
 * This is a minimal interface that both EVM and Polkadot network configs satisfy.
 */
export interface WalletNetworkConfig {
  /** Unique network identifier (e.g., 'ethereum', 'polygon', 'polkadot-hub') */
  id: string;
  /** Chain ID for the network */
  chainId: number;
  /** Optional viem Chain object */
  viemChain?: Chain;
}

/**
 * Configuration options for WagmiWalletImplementation.
 *
 * This interface defines what adapters need to provide when creating
 * a wallet implementation instance.
 */
export interface WagmiWalletConfig {
  /**
   * The supported chains for this wallet implementation.
   * These chains will be used to configure wagmi and for wallet operations.
   */
  chains: readonly Chain[];

  /**
   * Network configurations for chain ID to network ID mapping.
   * Used for RPC override lookups via AppConfigService.
   */
  networkConfigs: WalletNetworkConfig[];

  /**
   * Optional WalletConnect Project ID.
   * If provided, WalletConnect connector will be added to default config.
   */
  walletConnectProjectId?: string;

  /**
   * Optional initial UI kit configuration.
   * Used primarily for logging the anticipated kit name.
   */
  initialUiKitConfig?: UiKitConfiguration;

  /**
   * Log system identifier for this implementation.
   * Defaults to 'WagmiWalletImplementation'.
   */
  logSystem?: string;
}

/**
 * Type alias for wagmi config chains parameter.
 * Represents the chains array that wagmi expects in its configuration.
 * Must have at least one chain (non-empty tuple).
 */
export type WagmiConfigChains = readonly [Chain, ...Chain[]];
