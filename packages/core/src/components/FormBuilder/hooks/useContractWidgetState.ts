import { useCallback, useRef, useState } from 'react';

import { FullContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';
import type { ContractSchema } from '@openzeppelin/transaction-form-types';

/**
 * Hook for managing contract state widget visibility and data.
 * This can be used across steps where the contract state widget is displayed.
 */
export function useContractWidgetState() {
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  // Track current contract address to detect changes
  const currentContractAddress = useRef<string | null>(null);
  // Track if user has manually toggled the widget
  const userToggledRef = useRef(false);

  const showWidget = useCallback(() => {
    userToggledRef.current = true;
    setIsWidgetVisible(true);
  }, []);

  const hideWidget = useCallback(() => {
    userToggledRef.current = true;
    setIsWidgetVisible(false);
  }, []);

  const toggleWidget = useCallback(() => {
    userToggledRef.current = true;
    setIsWidgetVisible((prev) => !prev);
  }, []);

  // Reset the widget state
  const resetWidget = useCallback(() => {
    setIsWidgetVisible(false);
    userToggledRef.current = false;
  }, []);

  // Helper function to create sidebar widget props
  const createWidgetProps = useCallback(
    (
      contractSchema: ContractSchema | null,
      contractAddress: string | null,
      adapter: FullContractAdapter,
      networkConfig: NetworkConfig | null
    ) => {
      if (!contractSchema || !contractAddress || !networkConfig) return null;

      // Check if contract has any simple view functions (no parameters)
      const hasViewFunctions = contractSchema.functions
        .filter((fn) => adapter.isViewFunction(fn))
        .some((fn) => fn.inputs.length === 0);

      // Handle contract address change
      const isContractChanged = contractAddress !== currentContractAddress.current;
      if (isContractChanged) {
        currentContractAddress.current = contractAddress;
        userToggledRef.current = false;

        // When contract changes:
        // 1. If there are view functions AND user hasn't toggled, show the widget
        // 2. If there are NO view functions, ALWAYS hide the widget
        if (hasViewFunctions) {
          // For contracts with view functions, default to showing widget
          // but respect user preference if they manually collapsed it
          if (!userToggledRef.current) {
            setIsWidgetVisible(true);
          }
        } else {
          // For contracts without view functions, always hide
          setIsWidgetVisible(false);
        }
      }

      return {
        contractSchema,
        contractAddress,
        adapter,
        networkConfig,
        isVisible: isWidgetVisible,
        onToggle: toggleWidget,
        hasViewFunctions,
      };
    },
    [isWidgetVisible, toggleWidget]
  );

  return {
    isWidgetVisible,
    showWidget,
    hideWidget,
    toggleWidget,
    resetWidget,
    createWidgetProps,
  };
}
