import { useState } from 'react';

/**
 * Hook for managing field selection in the form customization UI
 */
export function useFieldSelection() {
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  const selectField = (index: number) => {
    setSelectedFieldIndex(index);
  };

  const clearSelection = () => {
    setSelectedFieldIndex(null);
  };

  return {
    selectedFieldIndex,
    selectField,
    clearSelection,
  };
}
