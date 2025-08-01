import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from 'zustand/react';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/contracts-ui-builder-renderer';
import type { FormValues } from '@openzeppelin/contracts-ui-builder-types';
import { Alert, AlertDescription, AlertTitle } from '@openzeppelin/contracts-ui-builder-ui';

import { loadContractDefinitionWithMetadata } from '../../../services/ContractLoader';
import { ActionBar } from '../../Common/ActionBar';
import { useDebounce } from '../hooks';
import {
  uiBuilderStore,
  uiBuilderStoreVanilla,
  type UIBuilderState,
} from '../hooks/uiBuilderStore';

import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  onContractSchemaLoaded,
  adapter,
  networkConfig,
  existingFormValues = null,
  loadedConfigurationId = null,
  onToggleContractState,
  isWidgetExpanded,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

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

  const loadingRef = useRef(false);
  const previousNetworkIdRef = useRef<string | null>(networkConfig?.id || null);
  const lastAttemptedRef = useRef<string>('');

  const circuitBreakerRef = useRef<{
    key: string;
    attempts: number;
    lastFailure: number;
  } | null>(null);

  const contractDefinitionInputs = useMemo(
    () => (adapter ? adapter.getContractDefinitionInputs() : []),
    [adapter]
  );

  const { control, reset, watch, formState } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: existingFormValues ?? {},
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 500);
  const manualContractDefinitionValue = watch('contractDefinition');
  const debouncedManualDefinition = useDebounce(manualContractDefinitionValue, 500);
  const contractAddressValue = watch('contractAddress');

  // Sync manual definition changes to the store
  useEffect(() => {
    if (typeof debouncedManualDefinition === 'string') {
      if (debouncedManualDefinition.trim().length > 0) {
        uiBuilderStore.setManualContractDefinition(debouncedManualDefinition);
      } else {
        uiBuilderStore.clearManualContractDefinition();
      }
    } else if (debouncedManualDefinition === undefined) {
      uiBuilderStore.clearManualContractDefinition();
    }
  }, [debouncedManualDefinition]);

  // Sync contract address to store for auto-save
  useEffect(() => {
    if (contractAddressValue && typeof contractAddressValue === 'string') {
      const currentState = uiBuilderStore.getState();
      // Only update if address changed
      if (currentState.contractState.address !== contractAddressValue) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            address: contractAddressValue,
            formValues: {
              ...s.contractState.formValues,
              contractAddress: contractAddressValue,
            },
          },
        }));
      }
    }
  }, [contractAddressValue]);

  // Restore form values when a configuration is loaded or network changes
  useEffect(() => {
    const currentNetworkId = networkConfig?.id || null;
    if (previousNetworkIdRef.current !== currentNetworkId) {
      reset({});
      previousNetworkIdRef.current = currentNetworkId;
      return;
    }

    // Only restore form values when loading a saved configuration
    // Skip if we don't have a loadedConfigurationId to prevent unwanted resets
    if (loadedConfigurationId && existingFormValues) {
      const valuesToRestore = { ...existingFormValues };
      if (contractDefinitionSource === 'manual' && contractDefinitionJson) {
        valuesToRestore.contractDefinition = contractDefinitionJson;
      }
      reset(valuesToRestore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadedConfigurationId,
    existingFormValues,
    contractDefinitionSource,
    // contractDefinitionJson is intentionally excluded to prevent form reset during manual editing
    networkConfig?.id,
    reset,
  ]);

  useEffect(() => {
    if (!adapter?.validateContractDefinition || typeof debouncedManualDefinition !== 'string') {
      setValidationError(null);
      return;
    }

    const trimmed = debouncedManualDefinition.trim();
    if (trimmed.length === 0) {
      setValidationError(null);
      return;
    }

    const validation = adapter.validateContractDefinition(trimmed);
    if (!validation.valid && validation.errors?.length) {
      const errorMsg =
        validation.errors.length === 1
          ? validation.errors[0]
          : `Contract definition has ${
              validation.errors.length
            } errors:\n• ${validation.errors.join('\n• ')}`;
      setValidationError(errorMsg);
      uiBuilderStore.setContractDefinitionError(errorMsg);
    } else {
      setValidationError(null);
      if (contractState.error) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            error: null,
          },
        }));
      }
    }
  }, [adapter, debouncedManualDefinition, contractState.error]);

  const handleLoadContract = useCallback(
    async (data: FormValues) => {
      if (!adapter || loadingRef.current || !data.contractAddress) return;

      const attemptKey = `${data.contractAddress}-${data.contractDefinition || 'no-abi'}`;
      const now = Date.now();

      if (circuitBreakerRef.current) {
        const { key, attempts, lastFailure } = circuitBreakerRef.current;
        const timeSinceLastFailure = now - lastFailure;

        if (key === attemptKey && attempts >= 3 && timeSinceLastFailure < 30000) {
          setCircuitBreakerActive(true);
          setTimeout(() => setCircuitBreakerActive(false), 5000);
          return;
        }
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const result = await loadContractDefinitionWithMetadata(adapter, data);

        circuitBreakerRef.current = null;

        uiBuilderStore.setContractDefinitionResult({
          schema: result.schema,
          formValues: data,
          source: result.source,
          metadata: result.metadata ?? {},
          original: result.contractDefinitionOriginal ?? '',
        });
        onContractSchemaLoaded(
          result.schema,
          data,
          result.source,
          result.metadata,
          result.contractDefinitionOriginal
        );
      } catch (err) {
        // Update circuit breaker
        if (circuitBreakerRef.current?.key === attemptKey) {
          circuitBreakerRef.current.attempts += 1;
          circuitBreakerRef.current.lastFailure = now;
        } else {
          circuitBreakerRef.current = {
            key: attemptKey,
            attempts: 1,
            lastFailure: now,
          };
        }

        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        uiBuilderStore.setContractDefinitionError(errorMessage);

        // Check if this is an unverified contract error and set appropriate metadata
        let metadata = undefined;
        if (errorMessage.includes('not verified on the block explorer')) {
          metadata = {
            verificationStatus: 'unverified' as const,
            fetchTimestamp: new Date(),
          };
        }

        onContractSchemaLoaded(null, data, undefined, metadata, undefined);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [adapter, onContractSchemaLoaded]
  );

  useEffect(() => {
    const attemptAutomaticLoad = async () => {
      if (!formState.isValid || loadingRef.current) {
        return;
      }

      const hasAddress = Boolean(debouncedValues.contractAddress);
      const hasManualABI = Boolean(
        typeof debouncedValues.contractDefinition === 'string' &&
          debouncedValues.contractDefinition.trim()
      );

      const shouldLoad =
        hasAddress &&
        (needsContractDefinitionLoad ||
          (!contractDefinitionJson && !contractDefinitionError) ||
          (contractDefinitionJson && !contractSchema) || // Need to regenerate schema from saved definition
          (hasManualABI && needsContractDefinitionLoad));

      if (shouldLoad) {
        const currentAttempt = JSON.stringify(debouncedValues);
        if (currentAttempt !== lastAttemptedRef.current) {
          lastAttemptedRef.current = currentAttempt;
          await handleLoadContract(debouncedValues);
        }
      }
    };

    void attemptAutomaticLoad();
  }, [
    debouncedValues,
    formState.isValid,
    handleLoadContract,
    needsContractDefinitionLoad,
    contractDefinitionJson,
    contractDefinitionError,
    contractSchema,
  ]);

  if (!adapter || !networkConfig) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please select a valid network first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActionBar
        network={networkConfig}
        contractAddress={contractSchema?.address}
        onToggleContractState={onToggleContractState}
        isWidgetExpanded={isWidgetExpanded}
      />

      <div className="space-y-4">
        {contractDefinitionInputs.map((field) => (
          <DynamicFormField key={field.id} field={field} control={control} adapter={adapter} />
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading contract...</p>}

      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contract Definition Error</AlertTitle>
          <AlertDescription style={{ whiteSpace: 'pre-line' }}>{validationError}</AlertDescription>
        </Alert>
      )}

      {contractDefinitionError && !validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contract Loading Error</AlertTitle>
          <AlertDescription>{contractDefinitionError}</AlertDescription>
        </Alert>
      )}

      {circuitBreakerActive && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Too Many Failed Attempts</AlertTitle>
          <AlertDescription>
            Multiple loading attempts have failed. Please check your input and try again in a
            moment.
            {loadedConfigurationId &&
              ' This saved configuration appears to be corrupted - consider deleting and recreating it.'}
          </AlertDescription>
        </Alert>
      )}

      {contractSchema && !contractDefinitionError && !validationError && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="flex items-center text-green-800">
            <CheckCircle className="mr-2 size-5" />
            {(() => {
              const functionCount = contractSchema.functions.length;
              const contractName = contractSchema.name;
              const source = contractDefinitionSource || 'fetched';

              if (source === 'manual' || source === 'hybrid') {
                return `Contract ${contractName} processed successfully with ${functionCount} functions. Click "Next" to continue.`;
              } else {
                return `Contract ${contractName} loaded successfully with ${functionCount} functions. Click "Next" to continue.`;
              }
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
