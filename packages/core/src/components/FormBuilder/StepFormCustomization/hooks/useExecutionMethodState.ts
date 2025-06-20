import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn, WatchObserver, useForm } from 'react-hook-form';

import type {
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '@openzeppelin/transaction-form-types';

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
    defaultValues: {
      executionMethodType: currentConfig?.method,
      eoaOption:
        currentConfig?.method === 'eoa' && currentConfig.allowAny === false
          ? 'specific'
          : currentConfig?.method === 'eoa' // Default to 'any' if EOA, else undefined
            ? 'any'
            : undefined,
      // Always provide a string, defaults to empty string
      specificEoaAddress:
        currentConfig?.method === 'eoa' && currentConfig.specificAddress
          ? currentConfig.specificAddress
          : '',
    },
  });
  const { watch, reset, setValue, getValues } = formMethods;

  const watchedMethodType = watch('executionMethodType');
  const watchedEoaOption = watch('eoaOption');

  const [supportedMethods, setSupportedMethods] = useState<ExecutionMethodDetail[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  //---------------------------------------------------------------------------
  // Validation Logic (for Builder UI)
  //---------------------------------------------------------------------------
  const validateExecutionConfigForBuilder = useCallback(
    // Removed async as we are not calling adapter.validateExecutionConfig here
    (configToValidate: ExecutionConfig | undefined): void => {
      let isValidForBuilder = false;
      let errorForBuilder: string | null = null;

      if (!adapter) {
        errorForBuilder = 'Adapter not available.';
      } else if (!configToValidate) {
        errorForBuilder = 'Please select an execution method.';
      } else if (configToValidate.method === 'eoa') {
        const eoaConfig = configToValidate;
        if (!eoaConfig.allowAny) {
          if (!eoaConfig.specificAddress) {
            errorForBuilder = 'Please provide the specific EOA address.';
          } else if (!adapter.isValidAddress(eoaConfig.specificAddress)) {
            errorForBuilder = `Invalid EOA address format: ${eoaConfig.specificAddress}`;
          }
        }
      } else if (configToValidate.method === 'relayer') {
        // Placeholder: For builder UI, relayer is valid if selected (further details might be validated later)
        errorForBuilder = null;
      } else if (configToValidate.method === 'multisig') {
        // Placeholder: For builder UI, multisig is valid if selected
        errorForBuilder = null;
      }

      if (!errorForBuilder) {
        isValidForBuilder = true;
      }

      setIsValid(isValidForBuilder);
      setValidationError(errorForBuilder);

      onUpdateConfig(configToValidate, isValidForBuilder);
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
        executionMethodType: undefined, // Or a sensible default like 'eoa' if always one selected
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
  useEffect(() => {
    let configToValidate = ensureCompleteConfig(currentConfig || {});

    if (!configToValidate) {
      configToValidate = ensureCompleteConfig({ method: 'eoa', allowAny: true });
    }

    validateExecutionConfigForBuilder(configToValidate);
    // Depend on the serialized value of currentConfig to prevent infinite loops
    // from object reference changes.
  }, [JSON.stringify(currentConfig), validateExecutionConfigForBuilder]);

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
        // Ensure specificEoaAddress is undefined if empty string, to match ExecutionConfig type if needed
        // Or ensure ExecutionConfig specificAddress can be an empty string if that's acceptable
        // For now, let's keep it as is, as ensureCompleteConfig might handle it.
        // The key is that RHF field should not be undefined.
        specificAddress: formData.specificEoaAddress, // Keep as string from form
      });
      validateExecutionConfigForBuilder(newConfig);
    };
    const subscription = watch(watchCallback);
    return () => subscription.unsubscribe();
  }, [watch, validateExecutionConfigForBuilder]);

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
