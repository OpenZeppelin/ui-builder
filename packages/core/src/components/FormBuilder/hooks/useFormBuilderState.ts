import { useCallback, useEffect } from 'react';

import { useWalletState } from '@openzeppelin/transaction-form-react-core';
import { ContractSchema, Ecosystem, FormValues } from '@openzeppelin/transaction-form-types';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

import { useCompleteStepState } from './useCompleteStepState';
import { useContractDefinitionState } from './useContractDefinitionState';
import { useContractWidgetState } from './useContractWidgetState';
import { useFormCustomizationState } from './useFormCustomizationState';
import { useFunctionSelectionState } from './useFunctionSelectionState';

/**
 * Coordinating hook that combines all step-specific hooks and manages dependencies between steps.
 * This ensures that when earlier step values change, later step values are reset appropriately.
 */
export function useFormBuilderState(initialNetworkConfigId?: string | null) {
  // --- Global State from Context ---
  const {
    activeNetworkId,
    setActiveNetworkId,
    activeNetworkConfig,
    activeAdapter,
    isAdapterLoading,
  } = useWalletState();

  // Effect to set initial global network if provided and different
  useEffect(() => {
    if (initialNetworkConfigId && initialNetworkConfigId !== activeNetworkId) {
      setActiveNetworkId(initialNetworkConfigId);
    }
    // This effect should only run if initialNetworkConfigId changes,
    // or to initialize. Avoid re-running if activeNetworkId changes due to this effect.
  }, [initialNetworkConfigId, setActiveNetworkId]);

  // --- Local Step State Hooks ---
  const contractDefinition = useContractDefinitionState();
  const functionSelection = useFunctionSelectionState();
  const formCustomization = useFormCustomizationState();
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // --- Callbacks ---
  const handleNetworkSelect = useCallback(
    (networkConfigId: string | null) => {
      setActiveNetworkId(networkConfigId);
      // Reset downstream steps as network selection impacts everything
      contractDefinition.resetContractSchema();
      functionSelection.resetFunctionSelection();
      formCustomization.resetFormConfig();
      contractWidget.resetWidget();
      completeStep.resetLoadingState();
    },
    [
      setActiveNetworkId,
      contractDefinition,
      functionSelection,
      formCustomization,
      contractWidget,
      completeStep,
    ]
  );

  // Create enhanced contract schema loaded handler
  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      contractDefinition.handleContractSchemaLoaded(schema, formValues);
      // Let the widget state hook handle visibility based on view functions
      // Don't force show/hide here
    },
    [contractDefinition]
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

  // --- Derived State & Props ---
  // Get the ecosystem from the selected network
  const selectedEcosystem: Ecosystem | null = activeNetworkConfig?.ecosystem ?? null;

  // Create sidebar widget props
  const sidebarWidget =
    contractDefinition.contractSchema &&
    contractDefinition.contractAddress &&
    activeAdapter &&
    activeNetworkConfig
      ? contractWidget.createWidgetProps(
          contractDefinition.contractSchema,
          contractDefinition.contractAddress,
          activeAdapter,
          activeNetworkConfig
        )
      : null;

  // Create a handler that calls exportForm with the current state
  const handleExportForm = useCallback(
    (formConfig: BuilderFormConfig | null, selectedFunction: string | null) => {
      if (!activeNetworkConfig || !activeAdapter || !selectedFunction) {
        console.error('Cannot export: Network/Adapter or Function not selected.');
        return;
      }
      // Use void to explicitly ignore the promise
      void completeStep.exportForm(
        formConfig,
        activeNetworkConfig,
        selectedFunction,
        contractDefinition.contractSchema
      );
    },
    [completeStep, contractDefinition.contractSchema, activeNetworkConfig, activeAdapter]
  );

  // --- Return Value ---
  return {
    selectedNetworkConfigId: activeNetworkId,
    selectedNetwork: activeNetworkConfig,
    selectedAdapter: activeAdapter,
    adapterLoading: isAdapterLoading,
    selectedEcosystem,
    contractSchema: contractDefinition.contractSchema,
    contractAddress: contractDefinition.contractAddress,
    contractFormValues: contractDefinition.contractFormValues,
    selectedFunction: functionSelection.selectedFunction,
    formConfig: formCustomization.formConfig,
    isExecutionStepValid: formCustomization.isExecutionStepValid,
    isWidgetVisible: contractWidget.isWidgetVisible,
    sidebarWidget,
    exportLoading: completeStep.loading,

    // Enhanced handlers with dependencies handled
    handleNetworkSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated: formCustomization.handleFormConfigUpdated,
    handleExecutionConfigUpdated: formCustomization.handleExecutionConfigUpdated,
    toggleWidget: contractWidget.toggleWidget,
    exportForm: handleExportForm,
  };
}
