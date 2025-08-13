import { useStore } from 'zustand/react';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useMemo, useState } from 'react';

import { ActionBar } from '../../Common/ActionBar';
import { uiBuilderStoreVanilla, type UIBuilderState } from '../hooks/uiBuilderStore';
import { ContractFormFields, ContractLoadingErrors, ContractSuccessStatus } from './components';
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
}: StepContractDefinitionProps) {
  const [ignoreProxy, setIgnoreProxy] = useState(false);

  const { contractState, needsContractDefinitionLoad } = useStore(
    uiBuilderStoreVanilla,
    useShallow((state: UIBuilderState) => ({
      contractState: state.contractState,
      needsContractDefinitionLoad: state.needsContractDefinitionLoad,
    }))
  );

  const {
    schema: contractSchema,
    definitionJson: contractDefinitionJson,
    error: contractDefinitionError,
    source: contractDefinitionSource,
  } = contractState;

  const contractDefinitionInputs = useMemo(
    () => (adapter ? adapter.getContractDefinitionInputs() : []),
    [adapter]
  );

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
  });

  // Automatic contract loading
  useAutoContractLoad({
    debouncedValues,
    formIsValid: formState.isValid,
    needsContractDefinitionLoad,
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

      <ContractFormFields
        contractDefinitionInputs={contractDefinitionInputs}
        control={control}
        adapter={adapter}
        isLoading={isLoading}
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
        />
      )}
    </div>
  );
}
