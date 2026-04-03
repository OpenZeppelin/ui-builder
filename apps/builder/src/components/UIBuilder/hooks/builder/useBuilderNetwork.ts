import { shallow } from 'zustand/shallow';
import { useCallback, useEffect } from 'react';

import { Ecosystem } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { useBuilderWalletState } from '../../../../hooks/useBuilderWalletState';
import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';
import { useUIBuilderStore } from '../useUIBuilderStore';

/**
 * @notice A hook to manage network and runtime interactions.
 * @returns An object with functions to handle network selection and clear switch state.
 */
export function useBuilderNetwork() {
  const { activeRuntime, isRuntimeLoading, setActiveNetworkId } = useBuilderWalletState();

  // Subscribe to store state for reactive auto-advance
  const { pendingNetworkId, currentStepIndex } = useUIBuilderStore(
    (s) => ({
      pendingNetworkId: s.pendingNetworkId,
      currentStepIndex: s.currentStepIndex,
    }),
    shallow
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

      // Set the network ID and trigger runtime loading
      setActiveNetworkId(networkId);
    },
    [setActiveNetworkId]
  );

  useEffect(() => {
    if (
      pendingNetworkId &&
      activeRuntime &&
      !isRuntimeLoading &&
      activeRuntime.networkConfig.id === pendingNetworkId &&
      currentStepIndex === STEP_INDICES.CHAIN_SELECT
    ) {
      logger.info(
        'useBuilderNetwork',
        `Auto-advancing to next step after runtime ready for network: ${pendingNetworkId}`
      );

      uiBuilderStore.updateState(() => ({
        pendingNetworkId: null,
        currentStepIndex: STEP_INDICES.CONTRACT_DEFINITION,
      }));
    }
  }, [
    pendingNetworkId,
    currentStepIndex,
    activeRuntime,
    isRuntimeLoading,
    activeRuntime?.networkConfig.id,
  ]);

  const clearNetworkToSwitchTo = useCallback(() => {
    uiBuilderStore.updateState(() => ({ networkToSwitchTo: null }));
  }, []);

  return {
    select: handleNetworkSelect,
    clearSwitchTo: clearNetworkToSwitchTo,
  };
}
