import { useEffect, useMemo, useRef, useState } from 'react';

import { ContractStateWidget } from '@openzeppelin/contracts-ui-builder-renderer';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { NetworkSwitchManager } from '../Common/Wallet/components/NetworkSwitchManager';
import type { WizardStep } from '../Common/WizardLayout';
import { WizardLayout } from '../Common/WizardLayout';

import { ChainSelector } from './StepChainSelection/index';
import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { HeroSection } from './HeroSection';
import { StepComplete } from './StepComplete';
import { StepContractDefinition } from './StepContractDefinition';
import { useUIBuilderState } from './hooks';

/**
 * Main builder app wizard component.
 * This component renders the multi-step wizard for building transaction apps..
 */
export function ContractsUIBuilder() {
  const {
    selectedNetworkConfigId,
    selectedNetwork,
    selectedAdapter,
    selectedEcosystem,
    contractSchema,
    contractFormValues,
    selectedFunction,
    formConfig,
    isExecutionStepValid,
    isWidgetVisible,
    sidebarWidget: widgetData,
    exportLoading,
    currentStepIndex,
    onStepChange,

    handleNetworkSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    toggleWidget,
    exportApp,
    handleUiKitConfigUpdated,
  } = useUIBuilderState();

  // Track network switching state
  const [networkToSwitchTo, setNetworkToSwitchTo] = useState<string | null>(null);
  const [isAdapterReady, setIsAdapterReady] = useState(false);

  // Store the latest selected network ID
  const latestNetworkIdRef = useRef<string | null>(null);

  // Track if we've initialized the network switch for the first time
  const hasInitializedNetworkRef = useRef(false);

  // Custom handler for network selection that directly signals a network switch
  const handleNetworkSelection = (networkId: string | null) => {
    logger.info('ContractsUIBuilder', `🔀 Network selected: ${networkId}`);

    // If there's a previous network and we're selecting a new one, set it as the network to switch to
    // OR if this is the first network selection (initial load)
    if (
      networkId &&
      (latestNetworkIdRef.current !== networkId || !hasInitializedNetworkRef.current)
    ) {
      setNetworkToSwitchTo(networkId);
      setIsAdapterReady(false); // Reset the adapter ready flag
      logger.info('ContractsUIBuilder', `🎯 Setting network to switch to: ${networkId}`);

      // Mark that we've initialized if this is the first selection
      if (!hasInitializedNetworkRef.current) {
        hasInitializedNetworkRef.current = true;
        logger.info(
          'ContractsUIBuilder',
          '🚀 Initial network selection - triggering wallet switch'
        );
      }
    }

    // Update our cached latest network ID
    latestNetworkIdRef.current = networkId;

    // Call the original handler
    handleNetworkSelect(networkId);

    // Auto-advance to next step when a network is selected
    if (networkId && currentStepIndex === 0) {
      onStepChange(1);
    }
  };

  // Watch for adapter changes that match our network to switch to
  useEffect(() => {
    if (!selectedAdapter || !networkToSwitchTo || !selectedNetworkConfigId) {
      // If networkToSwitchTo is cleared (e.g., switch complete), ensure isAdapterReady is false.
      if (!networkToSwitchTo && isAdapterReady) {
        logger.info(
          'ContractsUIBuilder',
          'Target network cleared, ensuring isAdapterReady is false.'
        );
        setIsAdapterReady(false);
      }
      return;
    }

    // If the adapter is now loaded for the network we want to switch to, mark it as ready.
    if (selectedNetworkConfigId === networkToSwitchTo) {
      logger.info(
        'ContractsUIBuilder',
        `✅ Adapter available for target network ${selectedNetworkConfigId}. (Current selectedAdapter ID: ${selectedAdapter.networkConfig.id}). Setting isAdapterReady.`
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
          'ContractsUIBuilder',
          `Mismatch: selectedNetwork (${selectedNetworkConfigId}) vs target (${networkToSwitchTo}). Resetting isAdapterReady.`
        );
        setIsAdapterReady(false);
      }
    }
  }, [selectedAdapter, networkToSwitchTo, selectedNetworkConfigId, isAdapterReady]);

  // Reset the network to switch to when switching is complete
  const handleNetworkSwitchComplete = () => {
    logger.info('ContractsUIBuilder', '🔄 Network switch completed, resetting target');
    setNetworkToSwitchTo(null);
    setIsAdapterReady(false);
  };

  // Memoize the mounting conditions to prevent unnecessary re-renders
  const shouldMountNetworkSwitcher = useMemo(() => {
    const decision = !!(
      selectedAdapter &&
      networkToSwitchTo &&
      isAdapterReady && // Indicates the switching process has been initiated
      selectedAdapter.networkConfig.id === networkToSwitchTo // Ensures the adapter in current render scope is correct
    );
    if (decision) {
      logger.info(
        'ContractsUIBuilder',
        `MOUNTING NetworkSwitchManager. Adapter ID: ${selectedAdapter.networkConfig.id}, Target: ${networkToSwitchTo ?? 'null'}`
      );
    }
    return decision;
  }, [selectedAdapter, networkToSwitchTo, isAdapterReady]);

  // Create sidebar widget when we have contract data
  const sidebarWidget = widgetData ? (
    <div className="sticky top-4">
      <ContractStateWidget
        contractSchema={widgetData.contractSchema}
        contractAddress={widgetData.contractAddress}
        adapter={widgetData.adapter}
        isVisible={widgetData.isVisible}
        onToggle={widgetData.onToggle}
      />
    </div>
  ) : null;

  const steps: WizardStep[] = [
    {
      id: 'chain-select',
      title: 'Select Blockchain',
      component: (
        <ChainSelector
          onNetworkSelect={handleNetworkSelection}
          initialEcosystem={selectedNetwork?.ecosystem ?? selectedEcosystem ?? 'evm'}
          selectedNetworkId={selectedNetworkConfigId}
        />
      ),
      isValid: !!selectedNetworkConfigId,
    },
    {
      id: 'contract-definition',
      title: 'Load Contract',
      component: (
        <StepContractDefinition
          onContractSchemaLoaded={handleContractSchemaLoaded}
          adapter={selectedAdapter}
          networkConfig={selectedNetwork}
          existingContractSchema={contractSchema}
          existingFormValues={contractFormValues}
          onToggleContractState={toggleWidget}
          isWidgetExpanded={isWidgetVisible}
        />
      ),
      isValid: !!contractSchema,
    },
    {
      id: 'function-selector',
      title: 'Select Function',
      component: (
        <StepFunctionSelector
          contractSchema={contractSchema}
          onFunctionSelected={handleFunctionSelected}
          networkConfig={selectedNetwork}
          onToggleContractState={toggleWidget}
          isWidgetExpanded={isWidgetVisible}
        />
      ),
      isValid: !!selectedFunction,
    },
    {
      id: 'form-customization',
      title: 'Customize',
      component: (
        <StepFormCustomization
          contractSchema={contractSchema}
          selectedFunction={selectedFunction}
          networkConfig={selectedNetwork}
          onFormConfigUpdated={handleFormConfigUpdated}
          onExecutionConfigUpdated={handleExecutionConfigUpdated}
          currentExecutionConfig={formConfig?.executionConfig}
          onToggleContractState={toggleWidget}
          isWidgetExpanded={isWidgetVisible}
          onUiKitConfigUpdated={handleUiKitConfigUpdated}
          currentUiKitConfig={formConfig?.uiKitConfig}
          currentFormConfig={formConfig}
        />
      ),
      isValid: isExecutionStepValid,
    },
    {
      id: 'complete',
      title: 'Complete',
      component: (
        <StepComplete
          networkConfig={selectedNetwork}
          formConfig={formConfig}
          contractSchema={contractSchema}
          onExport={() => {
            void exportApp();
          }}
          exportLoading={exportLoading}
          functionDetails={
            contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null
          }
          onToggleContractState={toggleWidget}
          isWidgetExpanded={isWidgetVisible}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl py-8">
      {/* Network switch manager to handle wallet network switching 
          Only mount when adapter is ready and matches the networkToSwitchTo */}
      {shouldMountNetworkSwitcher && selectedAdapter && networkToSwitchTo && (
        <NetworkSwitchManager
          adapter={selectedAdapter}
          targetNetworkId={networkToSwitchTo}
          onNetworkSwitchComplete={handleNetworkSwitchComplete}
        />
      )}

      <HeroSection
        currentStepIndex={currentStepIndex}
        selectedFunction={selectedFunction}
        contractSchema={contractSchema}
      />

      <div className="bg-card rounded-lg border shadow-sm">
        <WizardLayout
          steps={steps}
          sidebarWidget={sidebarWidget}
          isWidgetExpanded={isWidgetVisible}
          currentStepIndex={currentStepIndex}
          onStepChange={onStepChange}
        />
      </div>
    </div>
  );
}
