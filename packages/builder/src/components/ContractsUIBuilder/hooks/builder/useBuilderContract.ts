import { useCallback, useMemo } from 'react';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook to manage contract definition and function selection.
 * @returns An object with functions to handle definition loading and function selection.
 */
export function useBuilderContract() {
  const handleFunctionSelected = useCallback((functionId: string | null) => {
    const currentState = uiBuilderStore.getState();
    const previousFunctionId = currentState.selectedFunction;

    if (functionId !== null && functionId !== previousFunctionId) {
      const advancedToFormCustomization =
        currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR;
      uiBuilderStore.updateState(() => ({
        selectedFunction: functionId,
        formConfig: null,
        isExecutionStepValid: false,
        ...(advancedToFormCustomization && {
          currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
        }),
      }));
    } else if (functionId !== null && functionId === previousFunctionId) {
      // If the same function is re-selected, still navigate to form customization
      if (currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
        uiBuilderStore.updateState(() => ({
          currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
        }));
      }
    }
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      functionSelected: handleFunctionSelected,
    }),
    [handleFunctionSelected]
  );
}
