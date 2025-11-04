import { useStore } from 'zustand/react';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useMemo, useState } from 'react';

import { ActionBar } from '../../Common/ActionBar';
import { STEP_INDICES } from '../constants/stepIndices';
import {
  isTrimmedOnlyArtifacts,
  uiBuilderStoreVanilla,
  type UIBuilderState,
} from '../hooks/uiBuilderStore';
import {
  ContractFormFields,
  ContractLoadingErrors,
  ContractSuccessStatus,
  TrimmedArtifactsBanner,
} from './components';
import { useAutoContractLoad, useContractForm, useContractLoader, useFormSync } from './hooks';
import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  adapter,
  networkConfig,
  existingFormValues = null,
  loadedConfigurationId = null,
  onToggleContractState,
  isWidgetExpanded,
  definitionComparison,
  isLoadingFromService = false,
}: StepContractDefinitionProps) {
  const [ignoreProxy, setIgnoreProxy] = useState(false);

  const { contractState, needsContractDefinitionLoad, artifactsAreTrimmed } = useStore(
    uiBuilderStoreVanilla,
    useShallow((state: UIBuilderState) => ({
      contractState: state.contractState,
      needsContractDefinitionLoad: state.needsContractDefinitionLoad,
      artifactsAreTrimmed: isTrimmedOnlyArtifacts(state),
    }))
  );

  const {
    schema: contractSchema,
    definitionJson: contractDefinitionJson,
    error: contractDefinitionError,
    source: contractDefinitionSource,
    requiresManualReload,
  } = contractState;

  const contractDefinitionInputs = useMemo(
    () => (adapter ? adapter.getContractDefinitionInputs() : []),
    [adapter]
  );

  // Get adapter name for banner
  const adapterName = useMemo(() => {
    return adapter?.networkConfig?.ecosystem || 'Contract';
  }, [adapter]);

  // Handler to navigate to saved function when user wants to view it
  const handleViewSavedFunction = useCallback(() => {
    uiBuilderStoreVanilla.getState().updateState(() => ({
      currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
    }));
  }, []);

  // Form management
  const {
    control,
    formState,
    debouncedValues,
    contractAddressValue,
    debouncedManualDefinition,
    validationError,
  } = useContractForm({
    adapter,
    existingFormValues,
    loadedConfigurationId,
    networkId: networkConfig?.id || null,
    contractDefinitionSource,
    contractDefinitionJson,
    contractError: contractState.error,
  });

  // Contract loading with circuit breaker
  const { isLoading, circuitBreakerActive, loadContract, canAttemptLoad, markAttempted } =
    useContractLoader({
      adapter,
      ignoreProxy,
    });

  // Form-store synchronization
  useFormSync({
    debouncedManualDefinition,
    contractAddressValue,
    currentContractAddress: contractState.address,
    networkId: networkConfig?.id,
    adapter,
    debouncedValues,
  });

  const handleManualReload = useCallback(() => {
    if (!debouncedValues) return;
    markAttempted(debouncedValues);
    void loadContract(debouncedValues);
  }, [debouncedValues, loadContract, markAttempted]);

  // Automatic contract loading
  useAutoContractLoad({
    debouncedValues,
    formIsValid: formState.isValid,
    needsContractDefinitionLoad,
    networkId: networkConfig?.id,
    contractDefinitionJson,
    contractDefinitionError,
    contractSchema,
    canAttemptLoad,
    markAttempted,
    loadContract,
  });

  const handleIgnoreProxy = useCallback(() => {
    setIgnoreProxy(true);
    // Trigger reload with proxy detection disabled
    const currentFormValues = contractState.formValues;
    if (currentFormValues && adapter) {
      void loadContract(currentFormValues, { skipProxyDetection: true });
    }
  }, [contractState.formValues, adapter, loadContract]);

  if (!adapter || !networkConfig) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please select a valid network first.
      </div>
    );
  }

  const hasNoErrors = !contractDefinitionError && !validationError;
  const hasContract = contractSchema && hasNoErrors;

  return (
    <div className="space-y-6">
      <ActionBar
        network={networkConfig}
        contractAddress={contractSchema?.address}
        onToggleContractState={onToggleContractState}
        isWidgetExpanded={isWidgetExpanded}
      />

      {/* Show banner if artifacts have been trimmed */}
      {artifactsAreTrimmed && loadedConfigurationId && (
        <TrimmedArtifactsBanner
          adapterName={adapterName}
          onViewSavedFunction={handleViewSavedFunction}
        />
      )}

      <ContractFormFields
        contractDefinitionInputs={contractDefinitionInputs}
        control={control}
        adapter={adapter}
        isLoading={isLoading || isLoadingFromService}
      />

      <ContractLoadingErrors
        validationError={validationError}
        contractDefinitionError={contractDefinitionError}
        circuitBreakerActive={circuitBreakerActive}
        loadedConfigurationId={loadedConfigurationId}
      />

      {hasContract && (
        <ContractSuccessStatus
          contractSchema={contractSchema}
          contractDefinitionSource={contractDefinitionSource}
          contractMetadata={contractState.metadata || {}}
          proxyInfo={contractState.proxyInfo}
          ignoreProxy={ignoreProxy}
          definitionComparison={definitionComparison}
          loadedConfigurationId={loadedConfigurationId}
          adapter={adapter}
          onIgnoreProxy={handleIgnoreProxy}
          requiresManualReload={requiresManualReload}
          onManualReload={handleManualReload}
          isReloading={isLoading}
        />
      )}
    </div>
  );
}
