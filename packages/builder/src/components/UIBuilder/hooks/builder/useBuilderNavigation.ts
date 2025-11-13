import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';

import { STEP_INDICES } from '../../constants/stepIndices';
import { hasMeaningfulContent } from '../../utils/meaningfulContent';
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

        // Check if we have meaningful content even in new UI mode (beyond just network selection)
        const hasMeaningfulContentCheck = hasMeaningfulContent(currentState);

        // Determine if we should preserve the network selection and record
        const shouldPreserveRecord =
          isLoadingSavedConfigRef.current ||
          isExistingMeaningfulRecord ||
          hasMeaningfulContentCheck;

        // Reset downstream steps (contract and beyond)
        uiBuilderStore.resetDownstreamSteps('ecosystem');

        if (shouldPreserveRecord) {
          // Keep the existing record and network selection in store
          // but ALWAYS unmount wallet on network selection screen
          // Explicitly preserve ecosystem and network ID to ensure they remain set
          uiBuilderStore.updateState(() => ({
            isInNewUIMode: false,
            selectedEcosystem: currentState.selectedEcosystem,
            selectedNetworkConfigId: currentState.selectedNetworkConfigId,
          }));
        } else {
          // No meaningful content: clear network and record, but preserve ecosystem tab for UX
          // This ensures users stay on the same ecosystem tab (e.g., Stellar) when going back
          savedConfigIdRef.current = null;
          uiBuilderStore.updateState(() => ({
            selectedNetworkConfigId: null,
            // Keep selectedEcosystem to maintain tab selection
            selectedEcosystem: currentState.selectedEcosystem,
            networkToSwitchTo: null,
            loadedConfigurationId: null,
            isInNewUIMode: true,
          }));
        }

        // ALWAYS clear the active network to unmount the wallet on network selection screen
        // The wallet should only be visible after a network is selected (step 1+)
        setActiveNetworkId(null);
      }
    },
    [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef]
  );

  return {
    onStepChange,
  };
}
