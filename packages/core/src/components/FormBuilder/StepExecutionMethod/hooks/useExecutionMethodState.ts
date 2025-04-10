import { useCallback, useEffect, useState } from 'react';
import { useForm, UseFormReturn, WatchObserver } from 'react-hook-form';

import type { ContractAdapter } from '../../../../adapters';
import type {
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '../../../../core/types/FormTypes';
import type { ExecutionMethodFormData } from '../types';

//---------------------------------------------------------------------------
// Helper Functions
//---------------------------------------------------------------------------

// Moved helper function here
function ensureCompleteConfig(
  partialConfig: Partial<ExecutionConfig>
): ExecutionConfig | undefined {
  if (!partialConfig.method) return undefined;
  if (partialConfig.method === 'eoa') {
    const config = partialConfig as Partial<EoaExecutionConfig>;
    return {
      method: 'eoa',
      allowAny: config.allowAny ?? true,
      specificAddress: config.specificAddress,
    };
  } else if (partialConfig.method === 'relayer') {
    return { method: 'relayer' };
  } else if (partialConfig.method === 'multisig') {
    return { method: 'multisig' };
  }
  return undefined;
}

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
      let currentIsValid = false;
      let currentError: string | null = null;

      if (!adapter) {
        currentError = 'Adapter not available.';
      } else if (!configToValidate) {
        currentError = 'Please select an execution method.';
      } else if (configToValidate.method === 'eoa') {
        if (!configToValidate.allowAny && !configToValidate.specificAddress) {
          currentError = 'Please provide the specific EOA address.';
        }
      } else if (configToValidate.method === 'relayer') {
        currentError = null; // Placeholder
      } else if (configToValidate.method === 'multisig') {
        currentError = null; // Placeholder
      }

      if (!currentError && adapter && configToValidate) {
        try {
          const result = await adapter.validateExecutionConfig(configToValidate);
          if (result === true) {
            currentIsValid = true;
            currentError = null;
          } else {
            currentError = result;
          }
        } catch (error) {
          console.error('Validation error:', error);
          currentError = 'An unexpected error occurred during validation.';
        }
      } else {
        currentIsValid = false;
      }

      // Update local state
      setIsValid(currentIsValid);
      setValidationError(currentError);

      // Call the combined callback prop
      onUpdateConfig(configToValidate, currentIsValid);
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
  };
}
