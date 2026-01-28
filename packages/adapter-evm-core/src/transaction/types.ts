/**
 * Transaction Types for EVM Core
 *
 * Defines the wallet interface that transaction execution strategies require.
 * This allows different adapters (EVM, Polkadot, etc.) to provide their own
 * wallet implementations while sharing execution logic.
 */

import type { GetAccountReturnType } from '@wagmi/core';
import type { PublicClient, WalletClient } from 'viem';

/**
 * Wallet connection status from wagmi.
 * Re-exported from @wagmi/core for convenience.
 */
export type EvmWalletConnectionStatus = GetAccountReturnType;

/**
 * Minimal interface for EVM wallet implementations.
 *
 * This interface defines what execution strategies need from a wallet implementation.
 * Different adapters can provide their own implementations (e.g., WagmiWalletImplementation
 * in adapter-evm, or a simpler implementation in adapter-polkadot) as long as they
 * implement this interface.
 *
 * @example
 * ```typescript
 * // In adapter-evm:
 * class WagmiWalletImplementation implements EvmWalletImplementation {
 *   // Full implementation with RainbowKit, etc.
 * }
 *
 * // In adapter-polkadot:
 * class PolkadotWalletImplementation implements EvmWalletImplementation {
 *   // Simpler implementation for Polkadot chains
 * }
 * ```
 */
/**
 * Result of a wallet connection attempt.
 */
export interface EvmWalletConnectionResult {
  connected: boolean;
  address?: string;
  chainId?: number;
  error?: string;
}

/**
 * Result of a wallet disconnection attempt.
 */
export interface EvmWalletDisconnectResult {
  disconnected: boolean;
  error?: string;
}

export interface EvmWalletImplementation {
  /**
   * Get the wallet client for signing transactions.
   * @returns The viem WalletClient or null if not connected
   */
  getWalletClient(): Promise<WalletClient | null>;

  /**
   * Get the public client for reading chain data.
   * @returns The viem PublicClient or null if not available
   */
  getPublicClient(): Promise<PublicClient | null>;

  /**
   * Get the current wallet connection status.
   * @returns The connection status including address, chainId, isConnected, etc.
   */
  getWalletConnectionStatus(): EvmWalletConnectionStatus;

  /**
   * Switch to a different chain.
   * @param chainId - The target chain ID to switch to
   */
  switchNetwork(chainId: number): Promise<void>;

  /**
   * Connect to a wallet using the specified connector.
   * @param connectorId - The ID of the connector to use
   * @returns The connection result including address and chainId
   */
  connect(connectorId: string): Promise<EvmWalletConnectionResult>;

  /**
   * Disconnect the currently connected wallet.
   * @returns The disconnection result
   */
  disconnect(): Promise<EvmWalletDisconnectResult>;
}
