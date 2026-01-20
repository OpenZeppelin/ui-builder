import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter, FormValues } from '@openzeppelin/ui-types';

import { useDebounce } from '../../hooks';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

interface UseContractFormProps {
  adapter: ContractAdapter | null;
  existingFormValues: FormValues | null;
  loadedConfigurationId: string | null;
  networkId: string | null;
  contractDefinitionSource: 'fetched' | 'manual' | null;
  contractDefinitionJson: string | null;
  contractError: string | null;
}

export function useContractForm({
  adapter,
  existingFormValues,
  loadedConfigurationId,
  networkId,
  contractDefinitionSource,
  contractDefinitionJson,
  contractError,
}: UseContractFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const previousNetworkIdRef = useRef<string | null>(networkId);
  const hasUserClearedManualDefinition = useRef(false);

  const { control, reset, watch, formState } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: existingFormValues ?? {},
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 500);
  const manualContractDefinitionValue = watch('contractDefinition');
  const debouncedManualDefinition = useDebounce(manualContractDefinitionValue, 500) as
    | string
    | undefined;
  const contractAddressValue = watch('contractAddress') as string | undefined;

  // Handle manual definition validation
  useEffect(() => {
    if (!adapter?.validateContractDefinition || typeof debouncedManualDefinition !== 'string') {
      setValidationError(null);
      return;
    }

    const trimmed = debouncedManualDefinition.trim();
    if (trimmed.length === 0) {
      setValidationError(null);
      // Mark that user has cleared the manual definition
      if (manualContractDefinitionValue === '') {
        hasUserClearedManualDefinition.current = true;
      }
      return;
    }

    // Reset the flag when user enters something
    hasUserClearedManualDefinition.current = false;

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
      if (contractError) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            error: null,
          },
        }));
      }
    }
  }, [adapter, debouncedManualDefinition, contractError, manualContractDefinitionValue]);

  // Handle form reset on network change or configuration load
  const handleFormReset = useCallback(() => {
    const currentNetworkId = networkId;
    if (previousNetworkIdRef.current !== currentNetworkId) {
      reset({});
      previousNetworkIdRef.current = currentNetworkId;
      hasUserClearedManualDefinition.current = false; // Reset flag on network change
      return true; // Indicates network change reset
    }

    // Only restore form values when loading a saved configuration
    if (loadedConfigurationId && existingFormValues) {
      // If user is actively editing the address, do not reset from storage snapshot
      if (
        typeof contractAddressValue === 'string' &&
        contractAddressValue !== existingFormValues.contractAddress
      ) {
        return false;
      }
      const valuesToRestore = { ...existingFormValues };
      // Only restore manual definition if user hasn't explicitly cleared it
      if (
        contractDefinitionSource === 'manual' &&
        contractDefinitionJson &&
        !hasUserClearedManualDefinition.current
      ) {
        valuesToRestore.contractDefinition = contractDefinitionJson;
      }
      reset(valuesToRestore);
      return true; // Indicates configuration reset
    }

    return false; // No reset needed
  }, [
    networkId,
    loadedConfigurationId,
    existingFormValues,
    contractDefinitionSource,
    contractDefinitionJson,
    contractAddressValue,
    reset,
  ]);

  // Execute form reset when needed
  useEffect(() => {
    // Don't reset if user has just cleared the manual definition
    if (!hasUserClearedManualDefinition.current) {
      handleFormReset();
    }
  }, [handleFormReset]);

  // Clear the flag after a delay to allow future resets
  useEffect(() => {
    if (hasUserClearedManualDefinition.current) {
      const timer = setTimeout(() => {
        hasUserClearedManualDefinition.current = false;
      }, 1000); // Clear flag after 1 second

      return () => clearTimeout(timer);
    }
  }, [manualContractDefinitionValue]); // Re-run when the value changes

  return {
    // Form controls
    control,
    formState,

    // Values
    debouncedValues,
    contractAddressValue,
    debouncedManualDefinition,

    // Validation
    validationError,
  };
}
