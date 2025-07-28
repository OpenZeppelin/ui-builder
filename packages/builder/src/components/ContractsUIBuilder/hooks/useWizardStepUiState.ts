import { useCallback } from 'react';

import { useBuilderStoreSelector } from './builder/useBuilderStoreSelector';

import { uiBuilderStore } from './uiBuilderStore';

/**
 * A hook for managing transient UI state for a specific wizard step.
 * This state is stored in an external store to persist across component re-mounts.
 * It provides a `useState`-like API for convenience.
 *
 * @param stepId A unique identifier for the step's state slice.
 * @param initialStepState The initial state for this step's UI.
 * @returns A tuple containing the current state and a function to update it.
 */
export function useWizardStepUiState<T>(
  stepId: string,
  initialStepState: T
): [T, (newState: Partial<T>) => void] {
  // Subscribe only to the uiState object from the external store
  const fullUiState = useBuilderStoreSelector((state) => state.uiState);

  // Get the state for this specific step, or fall back to the initial state
  const stepState = (fullUiState[stepId] as T) ?? initialStepState;

  // Create a memoized setter function
  const setStepState = useCallback(
    (newState: Partial<T>) => {
      uiBuilderStore.updateState((currentState) => ({
        uiState: {
          ...currentState.uiState,
          [stepId]: {
            ...((currentState.uiState[stepId] as T) ?? initialStepState),
            ...newState,
          },
        },
      }));
    },
    [stepId, initialStepState]
  );

  return [stepState, setStepState];
}
