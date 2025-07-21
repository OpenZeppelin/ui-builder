import { useCallback } from 'react';

interface UseFunctionSelectionResult {
  selectFunction: (functionId: string, modifiesState: boolean) => void;
}

export function useFunctionSelection(
  onFunctionSelected: (functionId: string | null) => void
): UseFunctionSelectionResult {
  const selectFunction = useCallback(
    (functionId: string, modifiesState: boolean) => {
      // Only allow selection of functions that modify state
      if (!modifiesState) return;

      // Always select the function (no toggle behavior)
      onFunctionSelected(functionId);
    },
    [onFunctionSelected]
  );

  return {
    selectFunction,
  };
}
