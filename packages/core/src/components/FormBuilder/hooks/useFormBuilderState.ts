import { useCallback } from 'react';

import type { Ecosystem } from '@openzeppelin/transaction-form-types/common';
import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import { getAdapter } from '../../../core/adapterRegistry';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

import { useCompleteStepState } from './useCompleteStepState';
import { useContractDefinitionState } from './useContractDefinitionState';
import { useContractWidgetState } from './useContractWidgetState';
import { useEcosystemSelectionState } from './useEcosystemSelectionState';
import { useFormCustomizationState } from './useFormCustomizationState';
import { useFunctionSelectionState } from './useFunctionSelectionState';

/**
 * Coordinating hook that combines all step-specific hooks and manages dependencies between steps.
 * This ensures that when earlier step values change, later step values are reset appropriately.
 */
export function useFormBuilderState(initialEcosystem: Ecosystem = 'evm') {
  // Initialize all step-specific hooks
  const ecosystemSelection = useEcosystemSelectionState(initialEcosystem);
  const contractDefinition = useContractDefinitionState();
  const functionSelection = useFunctionSelectionState();
  const formCustomization = useFormCustomizationState();
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // Create enhanced ecosystem selection handler that resets downstream state
  const handleEcosystemSelect = useCallback(
    (ecosystem: Ecosystem) => {
      ecosystemSelection.handleEcosystemSelect(ecosystem);
      contractDefinition.resetContractSchema();
      functionSelection.resetFunctionSelection();
      formCustomization.resetFormConfig();
      contractWidget.hideWidget();
      completeStep.resetLoadingState();
    },
    [
      ecosystemSelection,
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

  // Get the adapter for the selected ecosystem
  const adapter = ecosystemSelection.selectedEcosystem
    ? getAdapter(ecosystemSelection.selectedEcosystem)
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

  // Create a handler that calls exportForm with the current state
  const handleExportForm = useCallback(
    (
      formConfig: BuilderFormConfig | null,
      selectedEcosystem: Ecosystem,
      selectedFunction: string | null
    ) => {
      // Use void to explicitly ignore the promise
      void completeStep.exportForm(
        formConfig,
        selectedEcosystem,
        selectedFunction,
        contractDefinition.contractSchema
      );
    },
    [completeStep]
  );

  return {
    // State from all hooks
    selectedEcosystem: ecosystemSelection.selectedEcosystem,
    contractSchema: contractDefinition.contractSchema,
    contractAddress: contractDefinition.contractAddress,
    selectedFunction: functionSelection.selectedFunction,
    formConfig: formCustomization.formConfig,
    isExecutionStepValid: formCustomization.isExecutionStepValid,
    isWidgetVisible: contractWidget.isWidgetVisible,
    sidebarWidget,
    exportLoading: completeStep.loading,

    // Enhanced handlers with dependencies handled
    handleEcosystemSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated: formCustomization.handleFormConfigUpdated,
    handleExecutionConfigUpdated: formCustomization.handleExecutionConfigUpdated,
    toggleWidget: contractWidget.toggleWidget,
    exportForm: handleExportForm,
  };
}
