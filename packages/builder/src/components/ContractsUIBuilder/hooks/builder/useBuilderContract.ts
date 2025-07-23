import { toast } from 'sonner';
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { loadContractDefinition } from '../../../../services/ContractLoader';
import { uiBuilderStore } from '../uiBuilderStore';

const STEP_INDICES = {
  FUNCTION_SELECTOR: 2,
  FORM_CUSTOMIZATION: 3,
};

/**
 * @notice A hook to manage contract schema and function selection.
 * @returns An object with functions to handle schema loading and function selection.
 */
export function useBuilderContract() {
  const { activeAdapter } = useWalletState();
  // Use useSyncExternalStore to get reactive state values instead of static snapshot
  const state = useSyncExternalStore(
    uiBuilderStore.subscribe,
    uiBuilderStore.getState,
    uiBuilderStore.getState
  );

  // Loading guard to prevent multiple concurrent loads
  const isLoadingSchemaRef = useRef(false);

  // Extract specific values to avoid dependency array issues
  const needsContractSchemaLoad = state.needsContractSchemaLoad;
  const contractFormValues = state.contractFormValues;
  const selectedNetworkConfigId = state.selectedNetworkConfigId;

  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      const currentState = uiBuilderStore.getState();

      uiBuilderStore.updateState(() => ({
        contractSchema: schema,
        contractAddress: schema?.address ?? null,
        contractFormValues: formValues || null,
      }));

      // Only reset downstream steps if we're not loading a saved configuration
      if (!currentState.selectedFunction) {
        uiBuilderStore.resetDownstreamSteps('contract');
      }
    },
    []
  );

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    const currentState = uiBuilderStore.getState();
    const previousFunctionId = currentState.selectedFunction;

    // Only proceed if a function was actually selected
    if (functionId !== null) {
      // We want to create/reset the form config if this is the first selection,
      // or if the user is switching to a *different* function.
      const isReselectingSameFunction = previousFunctionId === functionId;

      if (!isReselectingSameFunction) {
        // Combine the selectedFunction update with the resetDownstreamSteps logic
        uiBuilderStore.updateState((s) => {
          const newState = { ...s, selectedFunction: functionId };
          // Simulate resetDownstreamSteps('function') by clearing the relevant fields
          newState.formConfig = null; // Or set to a new default form config
          newState.isExecutionStepValid = false;
          return newState;
        });

        // Always auto-advance to form customization step when a function is selected
        if (currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
          logger.info(
            'useBuilderContract',
            `Auto-advancing to form customization after function selected: ${functionId}`
          );
          uiBuilderStore.updateState(() => ({
            currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
          }));
        }
      }
    }
  }, []);

  const loadSchemaIfNeeded = useCallback(async () => {
    // Prevent multiple concurrent loads
    if (isLoadingSchemaRef.current) {
      logger.info('useBuilderContract', 'Schema loading already in progress, skipping');
      return;
    }

    // Get fresh state values to avoid stale closure issues
    const currentState = uiBuilderStore.getState();

    if (
      activeAdapter &&
      currentState.needsContractSchemaLoad &&
      currentState.contractFormValues &&
      currentState.selectedNetworkConfigId === activeAdapter.networkConfig.id
    ) {
      try {
        isLoadingSchemaRef.current = true;
        logger.info('useBuilderContract', `Loading contract schema for saved configuration`);
        const schema = await loadContractDefinition(activeAdapter, currentState.contractFormValues);
        if (schema) {
          handleContractSchemaLoaded(schema, currentState.contractFormValues);
        }
        uiBuilderStore.updateState(() => ({ needsContractSchemaLoad: false }));
      } catch (error) {
        logger.error('useBuilderContract', 'Failed to load contract schema:', error);
        toast.error('Failed to load contract', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        uiBuilderStore.updateState(() => ({ needsContractSchemaLoad: false }));
      } finally {
        isLoadingSchemaRef.current = false;
      }
    }
  }, [
    activeAdapter,
    // Use extracted values instead of state object properties to avoid reference changes
    needsContractSchemaLoad,
    contractFormValues,
    selectedNetworkConfigId,
    handleContractSchemaLoaded,
  ]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      loadSchemaIfNeeded,
      schemaLoaded: handleContractSchemaLoaded,
      functionSelected: handleFunctionSelected,
    }),
    [loadSchemaIfNeeded, handleContractSchemaLoaded, handleFunctionSelected]
  );
}
