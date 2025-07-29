import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';

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

// Global lock to prevent multiple schema loading operations
let globalSchemaLoadInProgress = false;

/**
 * Coordinating hook that uses an external store to manage builder state.
 * This ensures state persists across component re-mounts.
 */
export function useUIBuilderState() {
  const state = useSyncExternalStore(uiBuilderStore.subscribe, uiBuilderStore.getState);
  const { activeNetworkConfig, activeAdapter, isAdapterLoading } = useWalletState();

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

  // Extract specific values to avoid dependency array reference issues
  const needsContractSchemaLoad = state.needsContractSchemaLoad;
  const contractFormValues = state.contractFormValues;
  const selectedNetworkConfigId = state.selectedNetworkConfigId;
  const adapterNetworkId = activeAdapter?.networkConfig.id;

  // Only load schema when the conditions are actually met, not on every contract object change
  useEffect(() => {
    // Global lock check - prevent multiple simultaneous loads
    if (globalSchemaLoadInProgress) {
      return;
    }

    // Skip if already loading in this component instance
    if (state.isLoadingConfiguration || isLoadingSavedConfigRef.current) {
      return;
    }

    // Load schema if we need to and have the required data
    if (needsContractSchemaLoad && contractFormValues) {
      if (activeAdapter) {
        // If we have a selectedNetworkConfigId, make sure it matches the adapter
        if (selectedNetworkConfigId) {
          if (selectedNetworkConfigId === adapterNetworkId) {
            globalSchemaLoadInProgress = true;
            void contract.loadSchemaIfNeeded().finally(() => {
              globalSchemaLoadInProgress = false;
            });
          }
        } else {
          // If selectedNetworkConfigId is empty (due to save bug), still try to load with current adapter
          globalSchemaLoadInProgress = true;
          void contract.loadSchemaIfNeeded().finally(() => {
            globalSchemaLoadInProgress = false;
          });
        }
      }
    }
  }, [
    // Use more stable dependencies to prevent rapid re-runs
    needsContractSchemaLoad,
    !!contractFormValues, // Boolean to avoid object reference changes
    selectedNetworkConfigId,
    adapterNetworkId,
    contract.loadSchemaIfNeeded,
    // Don't include activeAdapter directly to avoid re-runs when adapter object changes
  ]);

  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  // Update widget visibility when contract schema is loaded
  useEffect(() => {
    contractWidget.handleWidgetVisibilityUpdate(
      state.contractSchema,
      state.contractAddress,
      activeAdapter
    );
  }, [state.contractSchema, state.contractAddress, activeAdapter]);

  const sidebarWidget = useMemo(
    () =>
      state.contractSchema && state.contractAddress && activeAdapter && activeNetworkConfig
        ? contractWidget.createWidgetProps(
            state.contractSchema,
            state.contractAddress,
            activeAdapter,
            activeNetworkConfig
          )
        : null,
    [
      state.contractSchema,
      state.contractAddress,
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
      state.contractSchema
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
        schemaLoaded: contract.schemaLoaded,
        functionSelected: contract.functionSelected,
      },
      config: {
        form: config.form,
        execution: config.execution,
        uiKit: config.uiKit,
      },
      lifecycle: {
        load: lifecycle.load,
        createNew: lifecycle.createNew,
        resetAfterDelete: lifecycle.resetAfterDelete,
        initializePageState: lifecycle.initializePageState,
      },
    },
  };
}
