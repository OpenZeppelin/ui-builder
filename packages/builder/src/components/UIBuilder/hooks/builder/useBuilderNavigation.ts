import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook to manage wizard navigation.
 * @returns An object with a function to handle step changes.
 */
export function useBuilderNavigation(
  isLoadingSavedConfigRef: React.RefObject<boolean>,
  savedConfigIdRef: React.RefObject<string | null>
) {
  const { setActiveNetworkId } = useWalletState();

  const onStepChange = useCallback(
    (index: number) => {
      uiBuilderStore.updateState(() => ({ currentStepIndex: index }));

      // Handle going back to the first step
      if (index === STEP_INDICES.CHAIN_SELECT) {
        const currentState = uiBuilderStore.getState();

        // Check if we're working with an existing saved record
        const isExistingMeaningfulRecord =
          currentState.loadedConfigurationId &&
          savedConfigIdRef.current &&
          !currentState.isInNewUIMode;

        // Check if we have meaningful content even in new UI mode
        const hasMeaningfulContent = !!(
          currentState.selectedNetworkConfigId ||
          currentState.contractState.address ||
          currentState.selectedFunction
        );

        // Determine if we should preserve the existing record
        const shouldPreserveRecord =
          isLoadingSavedConfigRef.current || isExistingMeaningfulRecord || hasMeaningfulContent;

        // Always preserve network selection when going back to ecosystem step
        // Only reset contract and downstream data
        uiBuilderStore.resetDownstreamSteps('ecosystem');

        if (shouldPreserveRecord) {
          // Keep the existing record
          uiBuilderStore.updateState(() => ({
            isInNewUIMode: false,
          }));
        } else {
          // Clear the saved record reference but keep network
          savedConfigIdRef.current = null;
          uiBuilderStore.updateState(() => ({
            loadedConfigurationId: null,
            isInNewUIMode: true,
          }));
        }

        // Ensure wallet's active network matches the store's selected network
        if (currentState.selectedNetworkConfigId) {
          setActiveNetworkId(currentState.selectedNetworkConfigId);
        }
      }
    },
    [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef]
  );

  return {
    onStepChange,
  };
}
