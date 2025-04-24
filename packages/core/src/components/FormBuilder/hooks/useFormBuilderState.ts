import { useCallback } from 'react';

import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import { getContractAdapter } from '../../../adapters';

import { useChainSelectionState } from './useChainSelectionState';
import { useCompleteStepState } from './useCompleteStepState';
import { useContractDefinitionState } from './useContractDefinitionState';
import { useContractWidgetState } from './useContractWidgetState';
import { useFormCustomizationState } from './useFormCustomizationState';
import { useFunctionSelectionState } from './useFunctionSelectionState';

/**
 * Coordinating hook that combines all step-specific hooks and manages dependencies between steps.
 * This ensures that when earlier step values change, later step values are reset appropriately.
 */
export function useFormBuilderState(initialChain: ChainType = 'evm') {
  // Initialize all step-specific hooks
  const chainSelection = useChainSelectionState(initialChain);
  const contractDefinition = useContractDefinitionState();
  const functionSelection = useFunctionSelectionState();
  const formCustomization = useFormCustomizationState();
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // Create enhanced chain selection handler that resets downstream state
  const handleChainSelect = useCallback(
    (chain: ChainType) => {
      chainSelection.handleChainSelect(chain);
      contractDefinition.resetContractSchema();
      functionSelection.resetFunctionSelection();
      formCustomization.resetFormConfig();
      contractWidget.hideWidget();
      completeStep.resetLoadingState();
    },
    [
      chainSelection,
      contractDefinition,
      functionSelection,
      formCustomization,
      contractWidget,
      completeStep,
    ]
  );

  // Create enhanced contract schema loaded handler that shows widget
  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema) => {
      contractDefinition.handleContractSchemaLoaded(schema);
      contractWidget.showWidget();
    },
    [contractDefinition, contractWidget]
  );

  // Create enhanced function selection handler that resets downstream state
  const handleFunctionSelected = useCallback(
    (functionId: string | null) => {
      functionSelection.handleFunctionSelected(functionId);
      if (functionId === null) {
        formCustomization.resetFormConfig();
        completeStep.resetLoadingState();
      }
    },
    [functionSelection, formCustomization, completeStep]
  );

  // Get the adapter for the selected chain
  const adapter = chainSelection.selectedChain
    ? getContractAdapter(chainSelection.selectedChain)
    : null;

  // Create sidebar widget props
  const sidebarWidget =
    contractDefinition.contractSchema && contractDefinition.contractAddress && adapter
      ? contractWidget.createWidgetProps(
          contractDefinition.contractSchema,
          contractDefinition.contractAddress,
          adapter
        )
      : null;

  return {
    // State from all hooks
    selectedChain: chainSelection.selectedChain,
    contractSchema: contractDefinition.contractSchema,
    contractAddress: contractDefinition.contractAddress,
    selectedFunction: functionSelection.selectedFunction,
    formConfig: formCustomization.formConfig,
    isExecutionStepValid: formCustomization.isExecutionStepValid,
    isWidgetVisible: contractWidget.isWidgetVisible,
    sidebarWidget,
    exportLoading: completeStep.loading,

    // Enhanced handlers with dependencies handled
    handleChainSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated: formCustomization.handleFormConfigUpdated,
    handleExecutionConfigUpdated: formCustomization.handleExecutionConfigUpdated,
    toggleWidget: contractWidget.toggleWidget,
    exportForm: completeStep.exportForm,
  };
}
