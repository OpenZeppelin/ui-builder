import { useCallback, useState } from 'react';

import type { Ecosystem } from '@openzeppelin/transaction-form-types/common';

/**
 * Hook for managing ecosystem selection state in the Transaction Form Builder.
 * Used in the first step of the form building process.
 */
export function useEcosystemSelectionState(initialEcosystem: Ecosystem = 'evm') {
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>(initialEcosystem);

  const handleEcosystemSelect = useCallback((ecosystem: Ecosystem) => {
    setSelectedEcosystem(ecosystem);
  }, []);

  return {
    selectedEcosystem,
    handleEcosystemSelect,
  };
}
