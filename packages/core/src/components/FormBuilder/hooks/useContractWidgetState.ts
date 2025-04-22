import { useCallback, useState } from 'react';

import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

/**
 * Hook for managing contract state widget visibility and data.
 * This can be used across steps where the contract state widget is displayed.
 */
export function useContractWidgetState() {
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  const showWidget = useCallback(() => {
    setIsWidgetVisible(true);
  }, []);

  const hideWidget = useCallback(() => {
    setIsWidgetVisible(false);
  }, []);

  const toggleWidget = useCallback(() => {
    setIsWidgetVisible((prev) => !prev);
  }, []);

  // Helper function to create sidebar widget props
  const createWidgetProps = useCallback(
    (
      contractSchema: ContractSchema | null,
      contractAddress: string | null,
      chainType: ChainType
    ) => {
      if (!contractSchema || !contractAddress) return null;

      return {
        contractSchema,
        contractAddress,
        chainType,
        isVisible: isWidgetVisible,
        onToggle: toggleWidget,
      };
    },
    [isWidgetVisible, toggleWidget]
  );

  return {
    isWidgetVisible,
    showWidget,
    hideWidget,
    toggleWidget,
    createWidgetProps,
  };
}
