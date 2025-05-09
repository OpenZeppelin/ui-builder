import { useCallback, useState } from 'react';

/**
 * Hook for managing function selection state in the Transaction Form Builder.
 * Used in the third step of the form building process.
 */
export function useFunctionSelectionState() {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    setSelectedFunction(functionId);
  }, []);

  const resetFunctionSelection = useCallback(() => {
    setSelectedFunction(null);
  }, []);

  return {
    selectedFunction,
    handleFunctionSelected,
    resetFunctionSelection,
  };
}
