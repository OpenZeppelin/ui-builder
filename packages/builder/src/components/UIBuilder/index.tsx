import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ContractStateWidget } from '@openzeppelin/ui-builder-renderer';
import { Ecosystem } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { STEP_INDICES } from './constants/stepIndices';
import { isTrimmedOnlyArtifacts } from './hooks/uiBuilderStore';
import { ChainSelector } from './StepChainSelection/index';
import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { NetworkSwitchManager } from '../Common/Wallet/components/NetworkSwitchManager';
import type { WizardStep } from '../Common/WizardLayout';
import { WizardLayout } from '../Common/WizardLayout';
import { HeroSection } from './HeroSection';
import { useUIBuilderState } from './hooks';
import { StepComplete } from './StepComplete';
import { StepContractDefinition } from './StepContractDefinition';

/**
 * Main builder app wizard component.
 * This component renders the multi-step wizard for building transaction apps..
 */
export function UIBuilder() {
  const { state, widget, actions, isLoadingContract } = useUIBuilderState();

  // Check if we have trimmed-only artifacts
  const isTrimmedOnly = useMemo(() => isTrimmedOnlyArtifacts(state), [state]);

  // Track network switching state
  const [isAdapterReady, setIsAdapterReady] = useState(false);

  // Store the latest selected network ID
  const latestNetworkIdRef = useRef<string | null>(null);

  // Track if we've initialized the network switch for the first time
  const hasInitializedNetworkRef = useRef(false);

  // Custom handler for network selection that directly signals a network switch
  const handleNetworkSelection = (ecosystem: Ecosystem, networkId: string | null) => {
    logger.info('UIBuilder', `🔀 Network selected: ${ecosystem}/${networkId}`);

    // If there's a previous network and we're selecting a new one, set it as the network to switch to
    // OR if this is the first network selection (initial load)
    if (
      networkId &&
      (latestNetworkIdRef.current !== networkId || !hasInitializedNetworkRef.current)
    ) {
      setIsAdapterReady(false); // Reset the adapter ready flag
      logger.info('UIBuilder', `🎯 Setting network to switch to: ${networkId}`);

      // Mark that we've initialized if this is the first selection
      if (!hasInitializedNetworkRef.current) {
        hasInitializedNetworkRef.current = true;
        logger.info('UIBuilder', '🚀 Initial network selection - triggering wallet switch');
      }
    }

    // Update our cached latest network ID
    latestNetworkIdRef.current = networkId;

    // Call the original handler from the hook with both ecosystem and networkId
    void actions.network.select(ecosystem, networkId);

    // Note: Auto-navigation is now handled in useUIBuilderState via the pendingNetworkId state
  };

  // Watch for adapter changes that match our network to switch to
  // This effect manages the isAdapterReady flag which controls when NetworkSwitchManager is mounted
  // The flow is:
  // 1. User selects network -> networkToSwitchTo is set in the store
  // 2. Adapter loads -> this effect detects when adapter matches the target network
  // 3. isAdapterReady is set to true -> NetworkSwitchManager mounts
  // 4. NetworkSwitchManager handles the actual wallet switch
  useEffect(() => {
    if (!state.selectedAdapter || !state.networkToSwitchTo || !state.selectedNetworkConfigId) {
      // If networkToSwitchTo is cleared (e.g., switch complete), ensure isAdapterReady is false.
      if (!state.networkToSwitchTo && isAdapterReady) {
        logger.info('UIBuilder', 'Target network cleared, ensuring isAdapterReady is false.');
        setIsAdapterReady(false);
      }
      return;
    }

    // If the adapter is now loaded for the network we want to switch to, mark it as ready.
    if (state.selectedNetworkConfigId === state.networkToSwitchTo && state.selectedAdapter) {
      logger.info(
        'UIBuilder',
        `✅ Adapter available for target network ${state.selectedNetworkConfigId}. (Current selectedAdapter ID: ${state.selectedAdapter.networkConfig.id}). Setting isAdapterReady.`
      );
      if (!isAdapterReady) {
        setIsAdapterReady(true);
      }
    } else {
      // If selectedNetworkConfigId (current actual loaded network) does not match networkToSwitchTo
      // (e.g., adapter is still loading for the new network, or user rapidly changed selection),
      // ensure isAdapterReady is false, as we are not ready to switch with the current adapter.
      if (isAdapterReady) {
        logger.info(
          'UIBuilder',
          `Mismatch: selectedNetwork (${state.selectedNetworkConfigId}) vs target (${state.networkToSwitchTo}). Resetting isAdapterReady.`
        );
        setIsAdapterReady(false);
      }
    }
  }, [
    state.selectedAdapter,
    state.networkToSwitchTo,
    state.selectedNetworkConfigId,
    isAdapterReady,
  ]);

  // Reset the network to switch to when switching is complete
  const handleNetworkSwitchComplete = () => {
    logger.info('UIBuilder', '🔄 Network switch completed, resetting target');
    actions.network.clearSwitchTo();
    setIsAdapterReady(false);
  };

  // Memoize the mounting conditions to prevent unnecessary re-renders
  const shouldMountNetworkSwitcher = useMemo(() => {
    const decision = !!(
      state.selectedAdapter &&
      state.networkToSwitchTo &&
      isAdapterReady && // Indicates the switching process has been initiated
      state.selectedAdapter.networkConfig.id === state.networkToSwitchTo // Ensures the adapter in current render scope is correct
    );
    if (decision) {
      logger.info(
        'UIBuilder',
        `MOUNTING NetworkSwitchManager. Adapter ID: ${state.selectedAdapter?.networkConfig.id}, Target: ${state.networkToSwitchTo ?? 'null'}`
      );
    }
    return decision;
  }, [state.selectedAdapter, state.networkToSwitchTo, isAdapterReady]);

  // Wrapper to intercept step changes and prevent/override navigation when trimmed-only
  const handleStepChange = useCallback(
    (newStepIndex: number) => {
      // When artifacts are trimmed-only, any navigation to the function-selector
      // should redirect to the contract-definition step (re-upload required)
      if (isTrimmedOnly && newStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
        logger.info(
          'UIBuilder',
          'Blocked navigation to function-selector: trimmed artifacts require re-upload'
        );
        actions.navigation.onStepChange(STEP_INDICES.CONTRACT_DEFINITION);
        return;
      }

      // If we're going from Customize (step 4) backwards and have trimmed-only artifacts,
      // force landing on Contract Definition (step 2) instead of Function Selector (step 3)
      if (
        isTrimmedOnly &&
        newStepIndex === STEP_INDICES.FUNCTION_SELECTOR &&
        state.currentStepIndex === STEP_INDICES.FORM_CUSTOMIZATION
      ) {
        actions.navigation.onStepChange(STEP_INDICES.CONTRACT_DEFINITION);
      } else {
        actions.navigation.onStepChange(newStepIndex);
      }
    },
    [isTrimmedOnly, state.currentStepIndex, actions.navigation]
  );

  // Create sidebar widget when we have contract data
  const sidebarWidgetComponent = widget.sidebar ? (
    <ContractStateWidget
      contractSchema={widget.sidebar.contractSchema}
      contractAddress={widget.sidebar.contractAddress}
      adapter={widget.sidebar.adapter}
      isVisible={widget.sidebar.isVisible}
      onToggle={widget.sidebar.onToggle}
    />
  ) : null;

  const steps: WizardStep[] = [
    {
      id: 'chain-select',
      title: 'Select Blockchain',
      component: (
        <ChainSelector
          onNetworkSelect={handleNetworkSelection}
          initialEcosystem={state.selectedNetwork?.ecosystem ?? state.selectedEcosystem ?? 'evm'}
          selectedNetworkId={state.selectedNetworkConfigId}
        />
      ),
      isValid: !!state.selectedNetworkConfigId,
    },
    {
      id: 'contract-definition',
      title: 'Load Contract',
      component: (
        <StepContractDefinition
          adapter={state.selectedAdapter}
          networkConfig={state.selectedNetwork}
          existingFormValues={state.contractState.formValues}
          loadedConfigurationId={state.loadedConfigurationId}
          onToggleContractState={widget.toggle}
          isWidgetExpanded={state.isWidgetVisible}
          definitionComparison={state.definitionComparison || null}
          isLoadingFromService={isLoadingContract}
        />
      ),
      isValid: !!state.contractState.schema && !isTrimmedOnly,
    },
    {
      id: 'function-selector',
      title: 'Select Function',
      component: (
        <StepFunctionSelector
          contractSchema={state.contractState.schema}
          onFunctionSelected={actions.contract.functionSelected}
          selectedFunction={state.selectedFunction}
          networkConfig={state.selectedNetwork}
          onToggleContractState={widget.toggle}
          isWidgetExpanded={state.isWidgetVisible}
          adapter={state.selectedAdapter}
        />
      ),
      isValid: !!state.selectedFunction,
    },
    {
      id: 'form-customization',
      title: 'Customize',
      component: (
        <StepFormCustomization
          contractSchema={state.contractState.schema}
          selectedFunction={state.selectedFunction}
          networkConfig={state.selectedNetwork}
          onFormConfigUpdated={actions.config.form}
          onExecutionConfigUpdated={actions.config.execution}
          currentExecutionConfig={state.formConfig?.executionConfig}
          onToggleContractState={widget.toggle}
          isWidgetExpanded={state.isWidgetVisible}
          onUiKitConfigUpdated={actions.config.uiKit}
          currentUiKitConfig={state.formConfig?.uiKitConfig}
          currentFormConfig={state.formConfig}
          adapter={state.selectedAdapter ?? undefined}
        />
      ),
      isValid: state.isExecutionStepValid,
    },
    {
      id: 'complete',
      title: 'Complete',
      component: (
        <StepComplete
          networkConfig={state.selectedNetwork}
          formConfig={state.formConfig}
          contractSchema={state.contractState.schema}
          onExport={() => {
            void actions.export();
          }}
          exportLoading={state.exportLoading}
          functionDetails={
            state.contractState.schema?.functions.find((fn) => fn.id === state.selectedFunction) ||
            null
          }
          onToggleContractState={widget.toggle}
          isWidgetExpanded={state.isWidgetVisible}
        />
      ),
    },
  ];

  return (
    <>
      {shouldMountNetworkSwitcher && state.selectedAdapter && state.networkToSwitchTo && (
        <NetworkSwitchManager
          adapter={state.selectedAdapter}
          targetNetworkId={state.networkToSwitchTo}
          onNetworkSwitchComplete={handleNetworkSwitchComplete}
        />
      )}

      {/* Auto-save indicator */}
      {state.isAutoSaving && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-md bg-background/95 border shadow-sm px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Saving...</p>
        </div>
      )}

      <div className="mx-2 sm:mx-4 md:mx-6 max-w-6xl pt-13 pb-8">
        <HeroSection />

        <div className="bg-card rounded-lg">
          <WizardLayout
            steps={steps}
            sidebarWidget={sidebarWidgetComponent}
            isWidgetExpanded={state.isWidgetVisible}
            currentStepIndex={state.currentStepIndex}
            onStepChange={handleStepChange}
          />
        </div>
      </div>
    </>
  );
}
