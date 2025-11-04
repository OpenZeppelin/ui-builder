import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

import type { WalletConnectionStatus } from '@openzeppelin/ui-builder-types';

/**
 * TODO: The official DAppConnectorWalletAPI type from @midnight-ntwrk/dapp-connector-api
 * does not currently include onAccountChange or offAccountChange event handlers, which are
 * standard in CIP-30. We should propose adding these to the official Midnight repository
 * (https://github.com/input-output-hk/midnight-dapp-connector-api) to align the types
 * with the likely implementation and improve developer experience for the ecosystem.
 *
 * Extends the official DAppConnectorWalletAPI with optional event handlers
 * that are common in CIP-30 implementations but may not be in the base spec.
 * This allows us to use them in a type-safe way.
 */
export interface ExtendedDAppConnectorWalletAPI extends DAppConnectorWalletAPI {
  onAccountChange?: (callback: (addresses: string[]) => void) => void;
  offAccountChange?: (callback: (addresses: string[]) => void) => void;
  // onNetworkChange is also common, can be added here in the future.
}

/**
 * Midnight-specific wallet connection status extending the base interface.
 */
export interface MidnightWalletConnectionStatus extends WalletConnectionStatus {
  /** Midnight currently has a single wallet (Lace) so walletId is optional for parity */
  walletId?: string;
}

/** Listener callback for normalized Midnight connection changes */
export type MidnightConnectionListener = (
  status: MidnightWalletConnectionStatus,
  prevStatus: MidnightWalletConnectionStatus
) => void;
