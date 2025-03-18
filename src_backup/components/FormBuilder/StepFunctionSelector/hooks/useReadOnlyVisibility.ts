import { useState } from 'react';

interface UseReadOnlyVisibilityResult {
  showReadOnlyFunctions: boolean;
  setShowReadOnlyFunctions: (show: boolean) => void;
  toggleReadOnlyFunctions: () => void;
}

export function useReadOnlyVisibility(initialVisibility = false): UseReadOnlyVisibilityResult {
  const [showReadOnlyFunctions, setShowReadOnlyFunctions] = useState(initialVisibility);

  const toggleReadOnlyFunctions = () => {
    setShowReadOnlyFunctions((prev) => !prev);
  };

  return {
    showReadOnlyFunctions,
    setShowReadOnlyFunctions,
    toggleReadOnlyFunctions,
  };
}
