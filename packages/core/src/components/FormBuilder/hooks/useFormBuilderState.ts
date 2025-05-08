import { useCallback, useEffect, useState } from 'react';

import {
  ContractAdapter,
  ContractSchema,
  Ecosystem,
  NetworkConfig,
} from '@openzeppelin/transaction-form-types';

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

  // State for the resolved network config and adapter
  const [resolvedNetwork, setResolvedNetwork] = useState<{
    network: NetworkConfig;
    adapter: ContractAdapter;
  } | null>(null);

  // --- Effects ---

  // Effect to resolve network config and adapter when network ID changes
  useEffect(() => {
    let isMounted = true;
    const resolveNetwork = async () => {
      if (!networkSelection.selectedNetworkConfigId) {
        setResolvedNetwork(null);
        return;
      }
      try {
        const result = await networkService.getNetworkAndAdapter(
          networkSelection.selectedNetworkConfigId
        );
        if (isMounted) {
          setResolvedNetwork(result);
        }
      } catch (error) {
        console.error('Failed to resolve network and adapter:', error);
        if (isMounted) {
          setResolvedNetwork(null); // Reset on error
        }
      }
    };

    void resolveNetwork();

    return () => {
      isMounted = false;
    };
  }, [networkSelection.selectedNetworkConfigId]);

  // --- Callbacks ---

  // Enhanced network selection handler that resets downstream state
  const handleNetworkSelect = useCallback(
    (networkConfigId: string | null) => {
      networkSelection.handleNetworkSelect(networkConfigId);
      // Reset downstream steps as network selection impacts everything
      contractDefinition.resetContractSchema();
      functionSelection.resetFunctionSelection();
      formCustomization.resetFormConfig();
      contractWidget.hideWidget();
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

  // --- Derived State & Props ---

  // Get the adapter and ecosystem from the resolved network state
  const adapter = resolvedNetwork?.adapter ?? null;
  const selectedEcosystem: Ecosystem | null = resolvedNetwork?.network.ecosystem ?? null;

  // Create sidebar widget props
  const sidebarWidget =
    contractDefinition.contractSchema && contractDefinition.contractAddress && resolvedNetwork // Use the resolved state which includes the adapter
      ? contractWidget.createWidgetProps(
          contractDefinition.contractSchema,
          contractDefinition.contractAddress,
          resolvedNetwork.adapter, // Pass the resolved adapter
          resolvedNetwork.network // Pass the resolved network config
        )
      : null;

  // Create a handler that calls exportForm with the current state
  const handleExportForm = useCallback(
    (formConfig: BuilderFormConfig | null, selectedFunction: string | null) => {
      if (!resolvedNetwork || !selectedFunction) {
        console.error('Cannot export: Network/Adapter or Function not selected.');
        return;
      }
      // Use void to explicitly ignore the promise
      void completeStep.exportForm(
        formConfig,
        resolvedNetwork.network,
        selectedFunction,
        contractDefinition.contractSchema
      );
    },
    [completeStep, contractDefinition.contractSchema, resolvedNetwork]
  );

  // --- Return Value ---

  return {
    // State from all hooks and derived state
    selectedNetworkConfigId: networkSelection.selectedNetworkConfigId,
    selectedNetwork: resolvedNetwork?.network ?? null,
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
