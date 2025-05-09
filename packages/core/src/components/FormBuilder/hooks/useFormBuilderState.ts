import { useCallback, useEffect, useState } from 'react';

import { ContractSchema, Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';

import { useConfiguredAdapterSingleton } from '../../../core/hooks/useConfiguredAdapterSingleton';
import { networkService } from '../../../core/networks/service';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

import { useCompleteStepState } from './useCompleteStepState';
import { useContractDefinitionState } from './useContractDefinitionState';
import { useContractWidgetState } from './useContractWidgetState';
import { useFormCustomizationState } from './useFormCustomizationState';
import { useFunctionSelectionState } from './useFunctionSelectionState';
import { useNetworkSelectionState } from './useNetworkSelectionState';

/**
 * Coordinating hook that combines all step-specific hooks and manages dependencies between steps.
 * This ensures that when earlier step values change, later step values are reset appropriately.
 */
export function useFormBuilderState(initialNetworkConfigId: string | null = null) {
  // --- State Hooks ---
  const networkSelection = useNetworkSelectionState(initialNetworkConfigId);
  const contractDefinition = useContractDefinitionState();
  const functionSelection = useFunctionSelectionState();
  const formCustomization = useFormCustomizationState();
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // State for the resolved network config
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);

  // --- Effects ---

  // Effect to resolve network config when network ID changes
  useEffect(() => {
    let isMounted = true;
    const resolveNetwork = async () => {
      if (!networkSelection.selectedNetworkConfigId) {
        setSelectedNetwork(null);
        return;
      }
      try {
        const network = await networkService.getNetworkById(
          networkSelection.selectedNetworkConfigId
        );
        if (isMounted && network) {
          setSelectedNetwork(network);
        } else if (isMounted) {
          setSelectedNetwork(null);
        }
      } catch (error) {
        console.error('Failed to resolve network:', error);
        if (isMounted) {
          setSelectedNetwork(null);
        }
      }
    };

    void resolveNetwork();

    return () => {
      isMounted = false;
    };
  }, [networkSelection.selectedNetworkConfigId]);

  // Use the singleton adapter hook to get the appropriate adapter for the selected network
  const { adapter, isLoading: adapterLoading } = useConfiguredAdapterSingleton(selectedNetwork);

  // --- Callbacks ---

  // Enhanced network selection handler that resets downstream state
  const handleNetworkSelect = useCallback(
    (networkConfigId: string | null) => {
      networkSelection.handleNetworkSelect(networkConfigId);
      // Reset downstream steps as network selection impacts everything
      contractDefinition.resetContractSchema();
      functionSelection.resetFunctionSelection();
      formCustomization.resetFormConfig();
      contractWidget.resetWidget();
      completeStep.resetLoadingState();
    },
    [
      networkSelection,
      contractDefinition,
      functionSelection,
      formCustomization,
      contractWidget,
      completeStep,
    ]
  );

  // Create enhanced contract schema loaded handler that shows widget
  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null) => {
      contractDefinition.handleContractSchemaLoaded(schema);
      if (schema) {
        contractWidget.showWidget();
      } else {
        contractWidget.hideWidget();
      }
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

  // --- Derived State & Props ---

  // Get the ecosystem from the selected network
  const selectedEcosystem: Ecosystem | null = selectedNetwork?.ecosystem ?? null;

  // Create sidebar widget props
  const sidebarWidget =
    contractDefinition.contractSchema &&
    contractDefinition.contractAddress &&
    adapter &&
    selectedNetwork
      ? contractWidget.createWidgetProps(
          contractDefinition.contractSchema,
          contractDefinition.contractAddress,
          adapter,
          selectedNetwork
        )
      : null;

  // Create a handler that calls exportForm with the current state
  const handleExportForm = useCallback(
    (formConfig: BuilderFormConfig | null, selectedFunction: string | null) => {
      if (!selectedNetwork || !adapter || !selectedFunction) {
        console.error('Cannot export: Network/Adapter or Function not selected.');
        return;
      }
      // Use void to explicitly ignore the promise
      void completeStep.exportForm(
        formConfig,
        selectedNetwork,
        selectedFunction,
        contractDefinition.contractSchema
      );
    },
    [completeStep, contractDefinition.contractSchema, selectedNetwork, adapter]
  );

  // --- Return Value ---

  return {
    // State from all hooks and derived state
    selectedNetworkConfigId: networkSelection.selectedNetworkConfigId,
    selectedNetwork,
    selectedAdapter: adapter,
    selectedEcosystem,
    contractSchema: contractDefinition.contractSchema,
    contractAddress: contractDefinition.contractAddress,
    selectedFunction: functionSelection.selectedFunction,
    formConfig: formCustomization.formConfig,
    isExecutionStepValid: formCustomization.isExecutionStepValid,
    isWidgetVisible: contractWidget.isWidgetVisible,
    sidebarWidget,
    exportLoading: completeStep.loading,
    adapterLoading,

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
