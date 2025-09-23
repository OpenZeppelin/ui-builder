import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';

import { useContractDefinition } from '../../../hooks/useContractDefinition';
import { useContractDefinitionComparison } from '../../../hooks/useContractDefinitionComparison';
import {
  useAutoSave,
  useBuilderConfig,
  useBuilderContract,
  useBuilderLifecycle,
  useBuilderNavigation,
  useBuilderNetwork,
} from './builder';
import { uiBuilderStore } from './uiBuilderStore';
import { useCompleteStepState } from './useCompleteStepState';
import { useContractWidgetState } from './useContractWidgetState';
import { useUIBuilderStore } from './useUIBuilderStore';

/**
 * Coordinating hook that uses an external store to manage builder state.
 * This ensures state persists across component re-mounts.
 */
export function useUIBuilderState() {
  const state = useUIBuilderStore((s) => s);
  const { activeNetworkConfig, activeAdapter, isAdapterLoading, reconfigureActiveAdapterUiKit } =
    useWalletState();

  const savedConfigIdRef = useRef<string | null>(null);
  const isLoadingSavedConfigRef = useRef<boolean>(false);

  // Initialize the store with the active network from the wallet context on first load.
  useEffect(() => {
    uiBuilderStore.setInitialState({ selectedNetworkConfigId: activeNetworkConfig?.id || null });

    void lifecycle.initializePageState();
  }, []); // Run only once

  const autoSave = useAutoSave(isLoadingSavedConfigRef);
  const lifecycle = useBuilderLifecycle(isLoadingSavedConfigRef, savedConfigIdRef, autoSave);
  const navigation = useBuilderNavigation(isLoadingSavedConfigRef, savedConfigIdRef);
  const network = useBuilderNetwork();
  const contract = useBuilderContract();
  const config = useBuilderConfig();

  const { comparisonResult } = useContractDefinitionComparison({
    originalDefinition: state.contractState.definitionOriginal,
    currentDefinition: state.contractState.definitionJson,
    isLoadedConfigMode: !!state.loadedConfigurationId,
    adapter: activeAdapter,
  });

  // Contract definition loading hook with automatic deduplication
  const contractDefinition = useContractDefinition({
    onLoaded: (schema, formValues, source, metadata, originalDefinition) => {
      // Update store with fresh contract definition
      uiBuilderStore.setContractDefinitionResult({
        schema,
        formValues,
        source,
        metadata: metadata ?? {},
        original: originalDefinition ?? '',
      });
    },
    onError: (err) => {
      // Record error and stop auto-retry loop
      uiBuilderStore.setContractDefinitionError(err.message);
    },
  });

  const load = useCallback(
    async (id: string) => {
      const loadedData = await lifecycle.load(id);
      if (loadedData?.uiKitConfig && reconfigureActiveAdapterUiKit) {
        reconfigureActiveAdapterUiKit(loadedData.uiKitConfig);
      }
      return loadedData;
    },
    [lifecycle, reconfigureActiveAdapterUiKit]
  );

  // Auto-load contract definition when needed
  useEffect(() => {
    // Skip if we're in the middle of loading a saved configuration
    if (state.isLoadingConfiguration || isLoadingSavedConfigRef.current) {
      return;
    }

    // Load if we need to and have the required data
    if (
      state.needsContractDefinitionLoad &&
      state.contractState.address &&
      activeAdapter &&
      // Avoid triggering loads while the user is still typing an invalid/partial address
      activeAdapter.isValidAddress(state.contractState.address) &&
      (state.selectedNetworkConfigId === activeAdapter.networkConfig.id ||
        !state.selectedNetworkConfigId)
    ) {
      // Build form values using the latest address from store to avoid stale resets
      const baseFormValues = state.contractState.formValues || { contractAddress: '' };
      const mergedFormValues = {
        ...baseFormValues,
        contractAddress: state.contractState.address,
      } as typeof baseFormValues;
      void contractDefinition.load(mergedFormValues);
    }
  }, [
    state.needsContractDefinitionLoad,
    state.contractState.address,
    state.selectedNetworkConfigId,
    state.isLoadingConfiguration,
    activeAdapter?.networkConfig.id,
    contractDefinition.load,
  ]);

  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // Update widget visibility when contract schema is loaded
  useEffect(() => {
    contractWidget.handleWidgetVisibilityUpdate(
      state.contractState.schema,
      state.contractState.address,
      activeAdapter
    );
  }, [state.contractState.schema, state.contractState.address, activeAdapter]);

  const sidebarWidget = useMemo(
    () =>
      state.contractState.schema &&
      state.contractState.address &&
      activeAdapter &&
      activeNetworkConfig
        ? contractWidget.createWidgetProps(
            state.contractState.schema,
            state.contractState.address,
            activeAdapter,
            activeNetworkConfig
          )
        : null,
    [
      state.contractState.schema,
      state.contractState.address,
      activeAdapter,
      activeNetworkConfig,
      contractWidget,
    ]
  );

  const handleExportApp = useCallback(() => {
    if (!activeNetworkConfig || !activeAdapter || !state.selectedFunction) return;
    void completeStep.exportApp(
      state.formConfig,
      activeNetworkConfig,
      state.selectedFunction,
      state.contractState.schema
    );
  }, [completeStep, state, activeNetworkConfig, activeAdapter]);

  return {
    state: {
      ...state,
      selectedNetwork: activeNetworkConfig,
      selectedAdapter: activeAdapter,
      adapterLoading: isAdapterLoading,
      exportLoading: completeStep.loading,
      isWidgetVisible: contractWidget.isWidgetVisible,
      // Override schema loading state with our service state
      isSchemaLoading: contractDefinition.isLoading,
      contractState: state.contractState,
      definitionComparison: {
        comparisonResult: comparisonResult,
      },
    },
    widget: {
      sidebar: sidebarWidget,
      toggle: contractWidget.toggleWidget,
    },
    actions: {
      export: handleExportApp,
      navigation: {
        onStepChange: navigation.onStepChange,
      },
      network: {
        select: network.select,
        clearSwitchTo: network.clearSwitchTo,
      },
      contract: {
        functionSelected: contract.functionSelected,
        loadDefinition: contractDefinition.load,
      },
      config: {
        form: config.form,
        execution: config.execution,
        uiKit: config.uiKit,
      },

      lifecycle: {
        load,
        createNew: lifecycle.createNew,
        resetAfterDelete: lifecycle.resetAfterDelete,
        initializePageState: lifecycle.initializePageState,
      },
    },
  };
}
