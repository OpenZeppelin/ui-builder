import type { GetAccountReturnType } from '@wagmi/core';

import type { EvmWalletConnectionStatus } from '../types';

/**
 * Converts wagmi's GetAccountReturnType to our enhanced EvmWalletConnectionStatus.
 * This utility preserves all the rich UX capabilities from wagmi while ensuring
 * compatibility with our adapter interface.
 *
 * @param wagmiStatus - The status object from wagmi's GetAccountReturnType
 * @returns Enhanced EvmWalletConnectionStatus with all wagmi properties
 */
export function convertWagmiToEvmStatus(
  wagmiStatus: GetAccountReturnType
): EvmWalletConnectionStatus {
  return {
    isConnected: wagmiStatus.isConnected,
    isConnecting: wagmiStatus.isConnecting,
    isDisconnected: wagmiStatus.isDisconnected,
    isReconnecting: wagmiStatus.isReconnecting,
    status: wagmiStatus.status,
    address: wagmiStatus.address,
    chainId: wagmiStatus.chainId?.toString(),
    addresses: wagmiStatus.addresses,
    connector: wagmiStatus.connector
      ? {
          id: wagmiStatus.connector.id,
          name: wagmiStatus.connector.name,
          type: wagmiStatus.connector.type,
        }
      : undefined,
    chain: wagmiStatus.chain ? { ...wagmiStatus.chain } : undefined,
  };
}
