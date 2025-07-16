import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import {
  ContractSchema,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

import { type BuilderFormConfig, uiBuilderStore } from './uiBuilderStore';
import { useCompleteStepState } from './useCompleteStepState';
import { useContractWidgetState } from './useContractWidgetState';

// Step indices for the wizard navigation
const STEP_INDICES = {
  CHAIN_SELECT: 0,
  CONTRACT_DEFINITION: 1,
  FUNCTION_SELECTOR: 2,
  FORM_CUSTOMIZATION: 3,
  COMPLETE: 4,
} as const;

/**
 * Coordinating hook that uses an external store to manage builder state.
 * This ensures state persists across component re-mounts.
 */
export function useUIBuilderState() {
  const state = useSyncExternalStore(uiBuilderStore.subscribe, uiBuilderStore.getState);
  const {
    setActiveNetworkId,
    activeNetworkConfig,
    activeAdapter,
    isAdapterLoading,
    reconfigureActiveAdapterUiKit,
  } = useWalletState();

  // Initialize the store with the active network from the wallet context on first load.
  useEffect(() => {
    uiBuilderStore.setInitialState({ selectedNetworkConfigId: activeNetworkConfig?.id || null });
  }, []); // Run only once

  const handleNetworkSelect = useCallback(
    (networkConfigId: string | null) => {
      setActiveNetworkId(networkConfigId);
      uiBuilderStore.updateState(() => ({
        selectedNetworkConfigId: networkConfigId,
        selectedEcosystem: activeNetworkConfig?.ecosystem ?? null,
      }));
      uiBuilderStore.resetDownstreamSteps('network');
    },
    [setActiveNetworkId, activeNetworkConfig]
  );

  const onStepChange = useCallback(
    (index: number) => {
      uiBuilderStore.updateState(() => ({ currentStepIndex: index }));

      // Clear network selection when going back to the first step
      if (index === STEP_INDICES.CHAIN_SELECT) {
        setActiveNetworkId(null);
        uiBuilderStore.updateState(() => ({
          selectedNetworkConfigId: null,
          selectedEcosystem: null,
        }));
        uiBuilderStore.resetDownstreamSteps('network');
      }

      // Note: We don't clear function selection when going back to step 2
      // to preserve user progress. The UI will visually hide the selection
      // but keep the data intact.
    },
    [setActiveNetworkId]
  );

  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      uiBuilderStore.updateState(() => ({
        contractSchema: schema,
        contractAddress: schema?.address ?? null,
        contractFormValues: formValues || null,
      }));
      uiBuilderStore.resetDownstreamSteps('contract');
    },
    []
  );

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    const currentState = uiBuilderStore.getState();
    const previousFunctionId = currentState.selectedFunction;
    const isDifferentFunction = functionId !== previousFunctionId;
    const existingFormConfig = currentState.formConfig;
    // Remove redundant check - !isDifferentFunction already implies function ID match
    const isSameFunctionWithExistingConfig: boolean = !isDifferentFunction && !!existingFormConfig;

    uiBuilderStore.updateState((s) => {
      const newState = { selectedFunction: functionId };

      // Auto-advance to next step when a function is selected and we're on the function selector step
      if (functionId && s.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
        return { ...newState, currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION };
      }
      return newState;
    });

    // Only reset downstream steps if we're selecting a different function
    // Preserve form config if it's the same function
    if (functionId !== null) {
      uiBuilderStore.resetDownstreamSteps('function', isSameFunctionWithExistingConfig);
    }
  }, []);

  const handleFormConfigUpdated = useCallback((config: Partial<BuilderFormConfig>) => {
    uiBuilderStore.updateState((s) => ({
      formConfig: s.formConfig ? { ...s.formConfig, ...config } : (config as BuilderFormConfig),
    }));
  }, []);

  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isValid: boolean) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig
          ? { ...s.formConfig, executionConfig: execConfig }
          : s.selectedFunction && s.contractAddress
            ? {
                functionId: s.selectedFunction,
                contractAddress: s.contractAddress,
                fields: [],
                layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
                validation: { mode: 'onChange', showErrors: 'inline' },
                executionConfig: execConfig,
              }
            : s.formConfig,
        isExecutionStepValid: isValid,
      }));
    },
    []
  );

  const handleUiKitConfigUpdated = useCallback(
    (uiKitConfig: UiKitConfiguration) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig ? { ...s.formConfig, uiKitConfig } : null,
      }));
      // Also trigger the global reconfiguration to update the header, etc.
      reconfigureActiveAdapterUiKit(uiKitConfig);
    },
    [reconfigureActiveAdapterUiKit]
  );

  // Other hooks that manage transient/UI state can remain here
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  const sidebarWidget =
    state.contractSchema && state.contractAddress && activeAdapter && activeNetworkConfig
      ? contractWidget.createWidgetProps(
          state.contractSchema,
          state.contractAddress,
          activeAdapter,
          activeNetworkConfig
        )
      : null;

  const handleExportApp = useCallback(() => {
    if (!activeNetworkConfig || !activeAdapter || !state.selectedFunction) return;
    void completeStep.exportApp(
      state.formConfig,
      activeNetworkConfig,
      state.selectedFunction,
      state.contractSchema
    );
  }, [completeStep, state, activeNetworkConfig, activeAdapter]);

  return {
    ...state,
    selectedNetwork: activeNetworkConfig,
    selectedAdapter: activeAdapter,
    adapterLoading: isAdapterLoading,
    sidebarWidget,
    exportLoading: completeStep.loading,
    isWidgetVisible: contractWidget.isWidgetVisible,
    onStepChange,
    handleNetworkSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    toggleWidget: contractWidget.toggleWidget,
    exportApp: handleExportApp,
    handleUiKitConfigUpdated,
  };
}
