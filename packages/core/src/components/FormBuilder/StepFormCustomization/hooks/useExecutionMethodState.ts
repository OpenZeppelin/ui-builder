import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn, WatchObserver, useForm } from 'react-hook-form';

import type {
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '@openzeppelin/transaction-form-types/adapters';

import type { ExecutionMethodFormData } from '../types';
import { ensureCompleteConfig } from '../utils';

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
  validateExecutionConfig: (config: ExecutionConfig | undefined) => Promise<void>;
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
    defaultValues: {
      executionMethodType: currentConfig?.method,
      eoaOption:
        currentConfig?.method === 'eoa'
          ? currentConfig.allowAny === false
            ? 'specific'
            : 'any'
          : undefined,
      specificEoaAddress: currentConfig?.method === 'eoa' ? currentConfig.specificAddress : '',
    },
  });
  const { watch, reset, setValue, getValues } = formMethods;

  const watchedMethodType = watch('executionMethodType');
  const watchedEoaOption = watch('eoaOption');

  const [supportedMethods, setSupportedMethods] = useState<ExecutionMethodDetail[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  //---------------------------------------------------------------------------
  // Validation Logic
  //---------------------------------------------------------------------------
  const validateExecutionConfig = useCallback(
    async (configToValidate: ExecutionConfig | undefined): Promise<void> => {
      let isValidResult = false;
      let errorResult: string | null = null;

      if (!adapter) {
        errorResult = 'Adapter not available.';
      } else if (!configToValidate) {
        errorResult = 'Please select an execution method.';
      } else if (configToValidate.method === 'eoa') {
        if (!configToValidate.allowAny && !configToValidate.specificAddress) {
          errorResult = 'Please provide the specific EOA address.';
        }
      } else if (configToValidate.method === 'relayer') {
        errorResult = null; // Placeholder
      } else if (configToValidate.method === 'multisig') {
        errorResult = null; // Placeholder
      }

      if (!errorResult && adapter && configToValidate) {
        try {
          const adapterValidationResult = await adapter.validateExecutionConfig(configToValidate);
          if (adapterValidationResult === true) {
            isValidResult = true;
            errorResult = null;
          } else {
            isValidResult = false;
            errorResult = adapterValidationResult;
          }
        } catch (error) {
          isValidResult = false;
          errorResult = 'An unexpected error occurred during validation.';
          console.error('Validation error:', error);
        }
      } else {
        isValidResult = false;
      }

      setIsValid(isValidResult);
      setValidationError(errorResult);

      onUpdateConfig(configToValidate, isValidResult);
    },
    [adapter, onUpdateConfig]
  );

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
          console.error('Failed to fetch supported execution methods:', error);
          if (isMounted) {
            setSupportedMethods([]);
          }
        });
    } else {
      setSupportedMethods([]);
      reset({
        executionMethodType: undefined,
        eoaOption: undefined,
        specificEoaAddress: undefined,
      });
      onUpdateConfig(undefined, false); // Update parent config
    }
    return () => {
      isMounted = false;
    };
  }, [adapter, getValues, onUpdateConfig, reset, setValue]);

  // Effect 2: Perform initial validation when config or validator changes
  useEffect(() => {
    let configToValidate = ensureCompleteConfig(currentConfig || {});

    // If no config exists yet, create a default one (EOA)
    if (!configToValidate) {
      configToValidate = ensureCompleteConfig({ method: 'eoa', allowAny: true });
    }

    void validateExecutionConfig(configToValidate);
  }, [currentConfig, validateExecutionConfig]);

  // Effect 3: Watch for user form input changes and trigger validation
  useEffect(() => {
    const watchCallback: WatchObserver<ExecutionMethodFormData> = (value, { type }) => {
      if (type === undefined) {
        return;
      }
      const formData = value as ExecutionMethodFormData;
      const newConfig = ensureCompleteConfig({
        method: formData.executionMethodType,
        allowAny: formData.eoaOption === 'any',
        specificAddress: formData.specificEoaAddress || undefined,
      });
      void validateExecutionConfig(newConfig);
    };
    const subscription = watch(watchCallback);
    return () => subscription.unsubscribe();
  }, [watch, validateExecutionConfig]);

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
    validateExecutionConfig,
  };
}
