import { useCallback, useState } from 'react';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

/**
 * Hook for managing chain selection state in the Transaction Form Builder.
 * Used in the first step of the form building process.
 */
export function useChainSelectionState(initialChain: ChainType = 'evm') {
  const [selectedChain, setSelectedChain] = useState<ChainType>(initialChain);

  const handleChainSelect = useCallback((chain: ChainType) => {
    setSelectedChain(chain);
  }, []);

  return {
    selectedChain,
    handleChainSelect,
  };
}
