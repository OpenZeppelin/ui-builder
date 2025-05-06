import { useCallback, useState } from 'react';

import { FullContractAdapter } from '@openzeppelin/transaction-form-types';
import type { ContractSchema } from '@openzeppelin/transaction-form-types';

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
      adapter: FullContractAdapter
    ) => {
      if (!contractSchema || !contractAddress) return null;

      return {
        contractSchema,
        contractAddress,
        adapter,
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
