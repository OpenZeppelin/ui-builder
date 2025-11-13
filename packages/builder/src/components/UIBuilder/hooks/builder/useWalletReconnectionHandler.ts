import { useEffect, useRef } from 'react';

import { useDerivedAccountStatus } from '@openzeppelin/ui-builder-react-core';
import type { ContractAdapter } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { uiBuilderStore } from '../uiBuilderStore';

/**
 * Hook that detects wallet reconnection and re-queues network switch if needed.
 *
 * When a user disconnects their wallet and then reconnects in the same session,
 * the wallet may connect to a different chain than what's selected in the builder.
 * This hook detects that scenario and automatically re-queues the network switch.
 *
 * @param selectedNetworkConfigId - Currently selected network in the builder
 * @param selectedAdapter - Currently active adapter instance
 * @param networkToSwitchTo - Current network switch queue state
 */
export function useWalletReconnectionHandler(
  selectedNetworkConfigId: string | null,
  selectedAdapter: ContractAdapter | null,
  networkToSwitchTo: string | null
): void {
  const { isConnected, chainId: walletChainId } = useDerivedAccountStatus();
  const prevConnectedRef = useRef(isConnected);

  useEffect(() => {
    const wasDisconnected = !prevConnectedRef.current;
    const isNowConnected = isConnected;
    const isReconnection = wasDisconnected && isNowConnected;

    // Update ref for next render
    prevConnectedRef.current = isConnected;

    if (!isReconnection || !selectedNetworkConfigId || !selectedAdapter) {
      return;
    }

    // Skip if already queued
    if (networkToSwitchTo === selectedNetworkConfigId) {
      return;
    }

    // Check if adapter config has chainId (only EVM chains support network switching)
    const adapterConfig = selectedAdapter.networkConfig;
    if (!('chainId' in adapterConfig) || !walletChainId) {
      return;
    }

    const targetChainId = Number(adapterConfig.chainId);
    if (walletChainId !== targetChainId) {
      logger.info(
        'useWalletReconnectionHandler',
        `Wallet reconnected with chain ${walletChainId}, but selected network requires ${targetChainId}. Re-queueing switch.`
      );
      uiBuilderStore.updateState(() => ({
        networkToSwitchTo: selectedNetworkConfigId,
      }));
    }
  }, [isConnected, walletChainId, selectedNetworkConfigId, selectedAdapter, networkToSwitchTo]);
}
