import { useCallback, useMemo } from 'react';

import {
  ContractDefinitionMetadata,
  ContractSchema,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook to manage contract definition and function selection.
 * @returns An object with functions to handle definition loading and function selection.
 */
export function useBuilderContract() {
  const handleContractSchemaLoaded = useCallback(
    (
      schema: ContractSchema,
      formValues: FormValues,
      source: 'fetched' | 'manual' | 'hybrid',
      metadata: ContractDefinitionMetadata,
      original: string
    ) => {
      uiBuilderStore.setContractDefinitionResult({
        schema,
        formValues,
        source,
        metadata,
        original,
      });

      const { selectedFunction } = uiBuilderStore.getState();
      if (!selectedFunction) {
        uiBuilderStore.resetDownstreamSteps('contract');
      }
    },
    []
  );

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    const currentState = uiBuilderStore.getState();
    const previousFunctionId = currentState.selectedFunction;

    if (functionId !== null && functionId !== previousFunctionId) {
      const advancedToFormCustomization =
        currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR;
      uiBuilderStore.updateState(() => ({
        selectedFunction: functionId,
        formConfig: null,
        isExecutionStepValid: false,
        ...(advancedToFormCustomization && {
          currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
        }),
      }));
    } else if (functionId !== null && functionId === previousFunctionId) {
      // If the same function is re-selected, still navigate to form customization
      if (currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
        uiBuilderStore.updateState(() => ({
          currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
        }));
      }
    }
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      schemaLoaded: handleContractSchemaLoaded,
      functionSelected: handleFunctionSelected,
    }),
    [handleContractSchemaLoaded, handleFunctionSelected]
  );
}
