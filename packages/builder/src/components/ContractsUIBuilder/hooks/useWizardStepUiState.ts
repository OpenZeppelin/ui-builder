import { useCallback } from 'react';

import { uiBuilderStore } from './uiBuilderStore';
import { useUIBuilderStore } from './useUIBuilderStore';

/**
 * A hook to manage UI state for a specific wizard step.
 * This allows for isolated state management within each step.
 *
 * @param stepId - A unique identifier for the wizard step.
 */
export function useWizardStepUiState<T>(stepId: string, initialValues: T) {
  const fullUiState = useUIBuilderStore((state) => state.uiState);

  const setStepUiState = useCallback(
    (newStepState: Partial<T>) => {
      uiBuilderStore.updateState((currentState) => ({
        uiState: {
          ...currentState.uiState,
          [stepId]: {
            ...(currentState.uiState[stepId] as T),
            ...newStepState,
          },
        },
      }));
    },
    [stepId]
  );

  const stepUiState = (fullUiState[stepId] as T) || initialValues;

  return { stepUiState, setStepUiState };
}
