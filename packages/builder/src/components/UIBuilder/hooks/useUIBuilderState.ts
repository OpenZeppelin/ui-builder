import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';
import type { ContractAdapter, FormValues } from '@openzeppelin/ui-builder-types';
import { hasMissingRequiredContractInputs } from '@openzeppelin/ui-builder-utils';

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

  // Memoize address to avoid recalculating on every render
  const memoAddress = useMemo(
    () => state.contractState.address?.trim() || '',
    [state.contractState.address]
  );

  // Memoize address validation result to avoid repeated validation calls across renders
  const isValidAddr = useMemo(
    () => (activeAdapter && memoAddress ? activeAdapter.isValidAddress(memoAddress) : false),
    [activeAdapter, memoAddress]
  );

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

  // Helper: check if adapter-declared required fields are missing in provided values
  const hasMissingRequiredFields = useCallback(
    (adapter: ContractAdapter | null | undefined, values: FormValues): boolean =>
      hasMissingRequiredContractInputs(adapter, values),
    []
  );

  // Contract definition loading hook with automatic deduplication
  const contractDefinition = useContractDefinition({
    onLoaded: (schema, formValues, source, metadata, originalDefinition, artifacts) => {
      // Update store with fresh contract definition
      uiBuilderStore.setContractDefinitionResult({
        schema,
        formValues,
        source,
        metadata: metadata ?? {},
        original: originalDefinition ?? '',
        contractDefinitionArtifacts: artifacts ?? null,
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
      memoAddress &&
      activeAdapter &&
      // Use memoized validation to avoid repeated isValidAddress calls
      isValidAddr &&
      (state.selectedNetworkConfigId === activeAdapter.networkConfig.id ||
        !state.selectedNetworkConfigId)
    ) {
      // Prevent triggering loads for adapters (e.g., Midnight) that require multiple artifacts
      const candidateValues = {
        ...(state.contractState.formValues || ({} as FormValues)),
        contractAddress: state.contractState.address,
      } as FormValues;
      if (hasMissingRequiredFields(activeAdapter, candidateValues)) {
        return;
      }

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
    memoAddress,
    isValidAddr,
    state.selectedNetworkConfigId,
    state.isLoadingConfiguration,
    activeAdapter?.networkConfig.id,
    contractDefinition.load,
    hasMissingRequiredFields,
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

    // Contract loading state from the centralized service
    isLoadingContract: contractDefinition.isLoading,
  };
}
