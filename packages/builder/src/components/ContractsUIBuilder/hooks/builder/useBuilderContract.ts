import { toast } from 'sonner';
import { useCallback, useMemo, useRef } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { loadContractDefinition } from '../../../../services/ContractLoader';
import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

import { useBuilderStoreSelector } from './useBuilderStoreSelector';

/**
 * @notice A hook to manage contract schema and function selection.
 * @returns An object with functions to handle schema loading and function selection.
 */
export function useBuilderContract() {
  const { activeAdapter } = useWalletState();

  // Use selective subscriptions for better performance
  const needsContractSchemaLoad = useBuilderStoreSelector((state) => state.needsContractSchemaLoad);
  const contractFormValues = useBuilderStoreSelector((state) => state.contractFormValues);
  const selectedNetworkConfigId = useBuilderStoreSelector((state) => state.selectedNetworkConfigId);

  // Loading guard to prevent multiple concurrent loads
  const isLoadingSchemaRef = useRef(false);

  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      // Get the current state to check if we need to reset
      const { selectedFunction } = uiBuilderStore.getState();

      uiBuilderStore.updateState(() => ({
        contractSchema: schema,
        contractAddress: schema?.address ?? null,
        contractFormValues: formValues || null,
      }));

      // Only reset downstream steps if we're not loading a saved configuration
      if (!selectedFunction) {
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

    if (
      activeAdapter &&
      needsContractSchemaLoad &&
      contractFormValues &&
      contractFormValues.contractAddress && // Ensure we have a valid contract address
      selectedNetworkConfigId === activeAdapter.networkConfig.id
    ) {
      try {
        isLoadingSchemaRef.current = true;
        logger.info('useBuilderContract', `Loading contract schema for saved configuration`);
        const schema = await loadContractDefinition(activeAdapter, contractFormValues);
        if (schema) {
          handleContractSchemaLoaded(schema, contractFormValues);
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
