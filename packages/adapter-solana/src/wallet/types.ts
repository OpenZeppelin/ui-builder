import type { WalletConnectionStatus } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Solana-specific wallet connection status extending the base interface.
 * Currently doesn't add Solana-specific fields but maintains consistency with other adapters.
 * This can be extended to an interface when Solana wallet features are implemented.
 */
export type SolanaWalletConnectionStatus = WalletConnectionStatus;
