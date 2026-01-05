import type { Chain } from 'viem';

import type { WalletConnectionStatus } from '@openzeppelin/ui-types';

/**
 * EVM-specific wallet connection status extending the base interface.
 * Includes EVM-specific fields like multiple addresses and chain information.
 */
export interface EvmWalletConnectionStatus extends WalletConnectionStatus {
  /** Additional addresses (EVM multi-address support from wagmi) */
  addresses?: readonly string[];
  /** Chain information (EVM chain details from viem) */
  chain?: {
    id: number;
    name: string;
    [key: string]: unknown;
  };
}

/**
 * Type alias for wagmi config chains parameter.
 * Represents the chains array that wagmi expects in its configuration.
 * Must have at least one chain (non-empty tuple).
 */
export type WagmiConfigChains = readonly [Chain, ...Chain[]];
