import { useCallback } from 'react';

interface UseFunctionSelectionResult {
  selectFunction: (functionId: string, modifiesState: boolean) => void;
}

export function useFunctionSelection(
  selectedFunction: string | null,
  onFunctionSelected: (functionId: string | null) => void
): UseFunctionSelectionResult {
  const selectFunction = useCallback(
    (functionId: string, modifiesState: boolean) => {
      // Only allow selection of functions that modify state
      if (!modifiesState) return;

      // Toggle selection - if already selected, deselect it
      onFunctionSelected(selectedFunction === functionId ? null : functionId);
    },
    [selectedFunction, onFunctionSelected]
  );

  return {
    selectFunction,
  };
}
