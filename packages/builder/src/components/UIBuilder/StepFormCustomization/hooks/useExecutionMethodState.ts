import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn, WatchObserver } from 'react-hook-form';

import type {
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { ExecutionMethodFormData } from '../types';
import {
  ensureCompleteConfig,
  executionMethodValidatorMap,
  generateDefaultExecutionMethodFormValues,
  mapFormDataToExecutionConfig,
} from '../utils';

//---------------------------------------------------------------------------
// Hook Definition
//---------------------------------------------------------------------------

interface UseExecutionMethodStateArgs {
  currentConfig?: ExecutionConfig;
  adapter: ContractAdapter | null;
  // Combined callback for config and validity
  onUpdateConfig: (config: ExecutionConfig | undefined, isValid: boolean) => void;
}

interface UseExecutionMethodStateReturn {
  formMethods: UseFormReturn<ExecutionMethodFormData>;
  supportedMethods: ExecutionMethodDetail[];
  watchedMethodType: ExecutionMethodType | undefined;
  watchedEoaOption: 'any' | 'specific' | undefined;
  isValid: boolean;
  validationError: string | null;
  // Expose validator for testing
  validateExecutionConfig: (config: ExecutionConfig | undefined) => void;
}

export function useExecutionMethodState({
  currentConfig,
  adapter,
  onUpdateConfig,
}: UseExecutionMethodStateArgs): UseExecutionMethodStateReturn {
  //---------------------------------------------------------------------------
  // State & Form Management
  //---------------------------------------------------------------------------
  const formMethods = useForm<ExecutionMethodFormData>({
    mode: 'onChange',
    defaultValues: generateDefaultExecutionMethodFormValues(currentConfig),
  });
  const { watch, reset, setValue, getValues } = formMethods;

  const watchedMethodType = watch('executionMethodType');
  const watchedEoaOption = watch('eoaOption');
  const watchedSelectedRelayerDetails = watch('selectedRelayerDetails');
  const watchedTransactionOptions = watch('transactionOptions');

  const [supportedMethods, setSupportedMethods] = useState<ExecutionMethodDetail[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  //---------------------------------------------------------------------------
  // Validation Logic (for Builder UI)
  //---------------------------------------------------------------------------
  const validateExecutionConfigForBuilder = useCallback(
    (configToValidate: ExecutionConfig | undefined): void => {
      let errorForBuilder: string | null = null;

      if (!adapter) {
        errorForBuilder = 'Adapter is not available.';
      } else if (!configToValidate) {
        errorForBuilder = 'Please select an execution method.';
      } else {
        const validator = executionMethodValidatorMap[configToValidate.method];
        if (validator) {
          errorForBuilder = validator(configToValidate, adapter);
        } else {
          errorForBuilder = `Unknown execution method: ${configToValidate.method}`;
        }
      }

      setIsValid(!errorForBuilder);
      setValidationError(errorForBuilder);

      onUpdateConfig(configToValidate, !errorForBuilder);
    },
    [adapter, onUpdateConfig]
  );

  // Debounced version for user input changes to prevent excessive re-renders
  const debouncedValidateConfig = useMemo(
    () =>
      debounce((config: ExecutionConfig | undefined) => {
        validateExecutionConfigForBuilder(config);
      }, 300),
    [validateExecutionConfigForBuilder]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedValidateConfig.cancel();
    };
  }, [debouncedValidateConfig]);

  //---------------------------------------------------------------------------
  // Effects
  //---------------------------------------------------------------------------

  // Effect 1: Fetch supported methods and set defaults when adapter changes
  useEffect(() => {
    let isMounted = true;
    if (adapter) {
      adapter
        .getSupportedExecutionMethods()
        .then((methods: ExecutionMethodDetail[]) => {
          if (isMounted) {
            setSupportedMethods(methods);
            const currentFormValues = getValues();
            let methodToValidate = currentFormValues.executionMethodType;
            if (!methodToValidate || !methods.some((m) => m.type === methodToValidate)) {
              const defaultMethod = methods.find((m) => m.type === 'eoa') || methods[0];
              if (defaultMethod) {
                methodToValidate = defaultMethod.type;
                setValue('executionMethodType', methodToValidate, {
                  shouldValidate: false,
                  shouldDirty: false,
                });
                setValue('eoaOption', 'any', { shouldValidate: false });
                setValue('specificEoaAddress', '', { shouldValidate: false });
              }
            }
          }
        })
        .catch((error: unknown) => {
          logger.error(
            'useExecutionMethodState',
            'Failed to fetch supported execution methods:',
            error
          );
          if (isMounted) {
            setSupportedMethods([]);
          }
        });
    } else {
      setSupportedMethods([]);
      reset({
        executionMethodType: 'eoa', // Default to 'eoa' even when no adapter
        eoaOption: 'any', // Default to 'any'
        specificEoaAddress: '', // Reset to empty string
      });
      onUpdateConfig(undefined, false); // Update parent config
    }
    return () => {
      isMounted = false;
    };
  }, [adapter, getValues, onUpdateConfig, reset, setValue]);

  // Effect 2: Perform initial validation when config or validator changes
  // Use a stable reference to currentConfig to avoid expensive JSON.stringify
  const currentConfigKey = useMemo(() => {
    if (!currentConfig) return 'empty';
    // Create a simple key from the most important config properties
    const method = currentConfig.method;
    const allowAny = method === 'eoa' ? currentConfig.allowAny : false;
    return `${method}-${allowAny}`;
  }, [currentConfig?.method, currentConfig?.method === 'eoa' ? currentConfig.allowAny : false]);

  useEffect(() => {
    let configToValidate = ensureCompleteConfig(currentConfig || {});

    if (!configToValidate) {
      configToValidate = ensureCompleteConfig({ method: 'eoa', allowAny: true });
    }

    validateExecutionConfigForBuilder(configToValidate);
  }, [currentConfigKey, validateExecutionConfigForBuilder]);

  // Effect 3: Watch for user form input changes and trigger debounced validation
  useEffect(() => {
    const watchCallback: WatchObserver<ExecutionMethodFormData> = (value, { type }) => {
      if (type === undefined) {
        return;
      }
      const mappedConfig = mapFormDataToExecutionConfig(value as ExecutionMethodFormData);
      const newConfig = ensureCompleteConfig(mappedConfig);
      // Use debounced validation for user input to prevent excessive re-renders
      debouncedValidateConfig(newConfig);
    };
    const subscription = watch(watchCallback);
    return () => subscription.unsubscribe();
  }, [watch, debouncedValidateConfig]);

  // Effect 4: Watch specifically for selectedRelayerDetails and transactionOptions changes
  useEffect(() => {
    if (watchedMethodType === 'relayer' && watchedSelectedRelayerDetails) {
      // Build the relayer config with the updated details
      const currentValues = getValues();
      const configData = {
        method: 'relayer' as const,
        serviceUrl: currentValues.relayerServiceUrl || '',
        relayer: watchedSelectedRelayerDetails,
        transactionOptions: currentValues.transactionOptions || {},
      };

      const newConfig = ensureCompleteConfig(configData);
      validateExecutionConfigForBuilder(newConfig);
    }
  }, [
    watchedSelectedRelayerDetails,
    watchedTransactionOptions,
    watchedMethodType,
    getValues,
    validateExecutionConfigForBuilder,
  ]);

  //---------------------------------------------------------------------------
  // Return Value
  //---------------------------------------------------------------------------
  return {
    formMethods,
    supportedMethods,
    watchedMethodType,
    watchedEoaOption,
    isValid,
    validationError,
    // Expose validator for testing - this should now be the builder-specific one
    validateExecutionConfig: validateExecutionConfigForBuilder,
  };
}
