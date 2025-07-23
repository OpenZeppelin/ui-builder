import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';

import { uiBuilderStore } from '../uiBuilderStore';

// Step indices for the wizard navigation
const STEP_INDICES = {
  CHAIN_SELECT: 0,
  CONTRACT_DEFINITION: 1,
  FUNCTION_SELECTOR: 2,
  FORM_CUSTOMIZATION: 3,
  COMPLETE: 4,
} as const;

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

      // Clear network selection when going back to the first step
      if (index === STEP_INDICES.CHAIN_SELECT) {
        setActiveNetworkId(null);
        uiBuilderStore.updateState(() => ({ selectedNetworkConfigId: null }));
        uiBuilderStore.resetDownstreamSteps('network');
        // Only reset saved configuration ID when starting fresh, not when loading
        if (!isLoadingSavedConfigRef.current) {
          savedConfigIdRef.current = null;
          uiBuilderStore.updateState(() => ({ loadedConfigurationId: null }));
        }
      }
    },
    [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef]
  );

  return {
    onStepChange,
  };
}
