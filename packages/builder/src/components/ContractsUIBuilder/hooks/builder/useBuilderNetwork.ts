import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { Ecosystem } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook to manage network and adapter interactions.
 * @returns An object with functions to handle network selection and clear switch state.
 */
export function useBuilderNetwork() {
  const { setActiveNetworkId, activeAdapter, isAdapterLoading } = useWalletState();

  // Subscribe to store state for reactive auto-advance
  const state = useSyncExternalStore(
    uiBuilderStore.subscribe,
    uiBuilderStore.getState,
    uiBuilderStore.getState
  );

  const handleNetworkSelect = useCallback(
    async (ecosystem: Ecosystem, networkId: string | null) => {
      // Get fresh state each time instead of using stale snapshot
      const currentState = uiBuilderStore.getState();
      const previousNetworkId = currentState.selectedNetworkConfigId;
      const isChangingNetwork = previousNetworkId !== null && previousNetworkId !== networkId;

      // Reset downstream steps FIRST if we're changing networks
      if (isChangingNetwork) {
        uiBuilderStore.resetDownstreamSteps('network');
      }

      // THEN set the new network state (including pendingNetworkId)
      uiBuilderStore.updateState(() => ({
        selectedNetworkConfigId: networkId,
        selectedEcosystem: ecosystem,
        pendingNetworkId: networkId,
        networkToSwitchTo: networkId, // Mark for network switch
      }));

      // Set the network ID and trigger adapter loading
      setActiveNetworkId(networkId);
    },
    [setActiveNetworkId]
  );

  useEffect(() => {
    if (
      state.pendingNetworkId &&
      activeAdapter &&
      !isAdapterLoading &&
      activeAdapter.networkConfig.id === state.pendingNetworkId &&
      state.currentStepIndex === STEP_INDICES.CHAIN_SELECT
    ) {
      logger.info(
        'useBuilderNetwork',
        `Auto-advancing to next step after adapter ready for network: ${state.pendingNetworkId}`
      );

      uiBuilderStore.updateState(() => ({
        pendingNetworkId: null,
        currentStepIndex: STEP_INDICES.CONTRACT_DEFINITION,
      }));
    }
  }, [
    state.pendingNetworkId,
    state.currentStepIndex,
    activeAdapter,
    isAdapterLoading,
    activeAdapter?.networkConfig.id,
  ]);

  const clearNetworkToSwitchTo = useCallback(() => {
    uiBuilderStore.updateState(() => ({ networkToSwitchTo: null }));
  }, []);

  return {
    select: handleNetworkSelect,
    clearSwitchTo: clearNetworkToSwitchTo,
  };
}
