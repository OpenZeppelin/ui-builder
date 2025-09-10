import type { WalletConnectionStatus } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Stellar-specific wallet connection status extending the base interface.
 * Includes Stellar-specific fields like walletId.
 * Note that stellar wallets don't work with multiple addresses, only a single active address.
 */
export interface StellarWalletConnectionStatus extends WalletConnectionStatus {
  /** Stellar-specific wallet identifier (e.g., 'freighter', 'albedo') */
  walletId?: string;
}

/**
 * Type for wallet connection status listener callback
 */
export type StellarConnectionStatusListener = (
  status: StellarWalletConnectionStatus,
  prevStatus: StellarWalletConnectionStatus
) => void;
