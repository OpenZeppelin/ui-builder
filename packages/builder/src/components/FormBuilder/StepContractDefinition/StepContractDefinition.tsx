import { AlertTriangle, CheckCircle } from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/transaction-form-renderer';
import type { ContractSchema, FormValues } from '@openzeppelin/transaction-form-types';
import { Alert, AlertDescription, AlertTitle } from '@openzeppelin/transaction-form-ui';
import { logger } from '@openzeppelin/transaction-form-utils';

import { loadContractDefinition } from '../../../services/ContractLoader';
import { ActionBar } from '../../Common/ActionBar';
import { useDebounce } from '../hooks';

import { ContractPreview } from './components/ContractPreview';

import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  onContractSchemaLoaded,
  adapter,
  networkConfig,
  existingContractSchema = null,
  existingFormValues = null,
  onToggleContractState,
  isWidgetExpanded,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSchema, setLoadedSchema] = useState<ContractSchema | null>(existingContractSchema);
  const loadingRef = useRef(false);
  const [lastAttempted, setLastAttempted] = useState<string | null>(null);
  const previousNetworkIdRef = useRef<string | null>(networkConfig?.id || null);

  const contractDefinitionInputs = useMemo(
    () => (adapter ? adapter.getContractDefinitionInputs() : []),
    [adapter]
  );

  const { control, reset, watch, formState } = useForm<FormValues>({
    mode: 'onChange',
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 500);

  // Restore form values when existingContractSchema and existingFormValues are provided
  useEffect(() => {
    if (existingContractSchema && existingFormValues) {
      setLoadedSchema(existingContractSchema);
      reset(existingFormValues);
      logger.info(
        'StepContractDefinition',
        'Restored form values from parent state:',
        existingFormValues
      );
    }
  }, [existingContractSchema, existingFormValues, reset]);

  // Only reset form when network actually changes
  useEffect(() => {
    const currentNetworkId = networkConfig?.id || null;
    const hasNetworkChanged = previousNetworkIdRef.current !== currentNetworkId;

    if (hasNetworkChanged && previousNetworkIdRef.current !== null) {
      // Network has actually changed, reset everything
      logger.info('StepContractDefinition', 'Network changed, resetting form state');
      setLoadedSchema(null);
      setError(null);
      setLastAttempted(null);
      reset({});
    }

    previousNetworkIdRef.current = currentNetworkId;
  }, [networkConfig?.id, reset]);

  const handleClearContract = useCallback(() => {
    setLoadedSchema(null);
    reset({});
    onContractSchemaLoaded(null);
  }, [onContractSchemaLoaded, reset]);

  const handleLoadContract = useCallback(
    async (data: FormValues) => {
      if (!adapter || loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      const attempt = JSON.stringify(data);
      setLastAttempted(attempt);

      try {
        logger.info('StepContractDefinition', 'Attempting to load contract with artifacts:', data);
        const schema = await loadContractDefinition(adapter, data);
        // Pass both the schema and the form values up to the parent
        onContractSchemaLoaded(schema, data);
        setLoadedSchema(schema);
        logger.info(
          'StepContractDefinition',
          'Contract loaded successfully, form values passed to parent'
        );
      } catch (err) {
        logger.error('StepContractDefinition', 'Failed to load contract:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        handleClearContract();
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [adapter, onContractSchemaLoaded, handleClearContract]
  );

  useEffect(() => {
    const attemptAutomaticLoad = async () => {
      // Only auto-load if all fields are valid and it's not a manual submission
      if (!adapter || !formState.isValid || loadingRef.current) {
        return;
      }

      const currentAttempt = JSON.stringify(debouncedValues);
      if (currentAttempt === lastAttempted || currentAttempt === '{}') {
        return;
      }

      await handleLoadContract(debouncedValues);
    };

    void attemptAutomaticLoad();
  }, [debouncedValues, adapter, formState.isValid, lastAttempted, handleLoadContract]);

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
        contractAddress={loadedSchema?.address}
        onToggleContractState={onToggleContractState}
        isWidgetExpanded={isWidgetExpanded}
      />

      <div className="space-y-4">
        {contractDefinitionInputs.map((field) => (
          <DynamicFormField key={field.id} field={field} control={control} adapter={adapter} />
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading contract...</p>}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contract Loading Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loadedSchema && !error && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="flex items-center text-green-800">
            <CheckCircle className="mr-2 size-5" />
            Contract loaded successfully! Click &ldquo;Next&rdquo; to continue.
          </p>
        </div>
      )}

      <ContractPreview contractSchema={loadedSchema} />
    </div>
  );
}
