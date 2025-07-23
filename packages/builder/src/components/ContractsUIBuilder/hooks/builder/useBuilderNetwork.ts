import { useCallback, useEffect } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { Ecosystem } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { uiBuilderStore } from '../uiBuilderStore';

const STEP_INDICES = {
  CHAIN_SELECT: 0,
  CONTRACT_DEFINITION: 1,
} as const;

/**
 * @notice A hook to manage network and adapter interactions.
 * @returns An object with functions to handle network selection and clear switch state.
 */
export function useBuilderNetwork() {
  const { setActiveNetworkId, activeAdapter, isAdapterLoading } = useWalletState();
  const state = uiBuilderStore.getState();

  const handleNetworkSelect = useCallback(
    async (ecosystem: Ecosystem, networkId: string | null) => {
      const previousNetworkId = state.selectedNetworkConfigId;
      const isChangingNetwork = previousNetworkId !== null && previousNetworkId !== networkId;

      uiBuilderStore.updateState(() => ({
        selectedNetworkConfigId: networkId,
        selectedEcosystem: ecosystem,
        pendingNetworkId: networkId,
        networkToSwitchTo: networkId, // Mark for network switch
      }));

      // Only reset downstream steps if we're actually changing networks
      if (isChangingNetwork) {
        uiBuilderStore.resetDownstreamSteps('network');
      }

      // Set the network ID and trigger adapter loading
      setActiveNetworkId(networkId);
    },
    [setActiveNetworkId, state.selectedNetworkConfigId]
  );

  useEffect(() => {
    const currentState = uiBuilderStore.getState();

    if (
      currentState.pendingNetworkId &&
      activeAdapter &&
      !isAdapterLoading &&
      activeAdapter.networkConfig.id === currentState.pendingNetworkId &&
      currentState.currentStepIndex === STEP_INDICES.CHAIN_SELECT
    ) {
      logger.info(
        'useBuilderNetwork',
        `Auto-advancing to next step after adapter ready for network: ${currentState.pendingNetworkId}`
      );

      uiBuilderStore.updateState(() => ({
        pendingNetworkId: null,
        currentStepIndex: STEP_INDICES.CONTRACT_DEFINITION,
      }));
    }
  }, [activeAdapter, isAdapterLoading]);

  const clearNetworkToSwitchTo = useCallback(() => {
    uiBuilderStore.updateState(() => ({ networkToSwitchTo: null }));
  }, []);

  return {
    select: handleNetworkSelect,
    clearSwitchTo: clearNetworkToSwitchTo,
  };
}
