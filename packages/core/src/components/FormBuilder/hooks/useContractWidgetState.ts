import { useCallback, useRef } from 'react';

import { FullContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';
import type { ContractSchema } from '@openzeppelin/transaction-form-types';

import { useWizardStepUiState } from './useWizardStepUiState';

/**
 * Hook for managing contract state widget visibility and data.
 * This can be used across steps where the contract state widget is displayed.
 */
export function useContractWidgetState() {
  const [{ isWidgetVisible }, setUiState] = useWizardStepUiState('contractWidget', {
    isWidgetVisible: false,
  });

  // Track current contract address to detect changes
  const currentContractAddress = useRef<string | null>(null);
  // Track if user has manually toggled the widget
  const userToggledRef = useRef(false);

  const showWidget = useCallback(() => {
    userToggledRef.current = true;
    setUiState({ isWidgetVisible: true });
  }, [setUiState]);

  const hideWidget = useCallback(() => {
    userToggledRef.current = true;
    setUiState({ isWidgetVisible: false });
  }, [setUiState]);

  const toggleWidget = useCallback(() => {
    userToggledRef.current = true;
    setUiState({ isWidgetVisible: !isWidgetVisible });
  }, [setUiState, isWidgetVisible]);

  // Reset the widget state
  const resetWidget = useCallback(() => {
    setUiState({ isWidgetVisible: false });
    userToggledRef.current = false;
  }, [setUiState]);

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

      // Handle contract address change, but only if there was a previous address.
      // This prevents the logic from running on the first render after a re-mount.
      const isContractChanged =
        currentContractAddress.current !== null &&
        contractAddress !== currentContractAddress.current;

      if (isContractChanged) {
        currentContractAddress.current = contractAddress;
        userToggledRef.current = false;

        // When contract changes, only auto-show if it has view functions and user hasn't toggled yet.
        // We no longer auto-hide, respecting the user's choice to keep it open.
        if (hasViewFunctions && !userToggledRef.current) {
          setUiState({ isWidgetVisible: true });
        }
      }

      // On the very first load of a contract, if it has view functions, show the widget by default.
      if (currentContractAddress.current === null && hasViewFunctions) {
        currentContractAddress.current = contractAddress; // Set it so this block doesn't re-run
        if (!userToggledRef.current) {
          setUiState({ isWidgetVisible: true });
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
