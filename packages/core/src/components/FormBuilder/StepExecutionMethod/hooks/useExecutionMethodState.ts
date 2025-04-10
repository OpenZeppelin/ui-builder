import { useEffect, useState } from 'react';
import { useForm, UseFormReturn, WatchObserver } from 'react-hook-form';

import { ensureCompleteConfig, useExecutionMethodValidation } from './useExecutionMethodValidation';

import type { ContractAdapter } from '../../../../adapters';
import type {
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '../../../../core/types/FormTypes';
import type { ExecutionMethodFormData } from '../types';

interface UseExecutionMethodStateArgs {
  currentConfig?: ExecutionConfig;
  adapter: ContractAdapter | null;
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

  const { control, watch, reset, setValue, getValues } = formMethods;

  const watchedMethodType = watch('executionMethodType');
  const watchedEoaOption = watch('eoaOption');

  const [supportedMethods, setSupportedMethods] = useState<ExecutionMethodDetail[]>([]);

  const {
    isValid,
    validationError,
    validate: validateExecutionConfig,
  } = useExecutionMethodValidation({ adapter, onUpdateConfig });

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

            const configForInitialValidation = ensureCompleteConfig({
              method: methodToValidate,
              allowAny: getValues('eoaOption') === 'any',
              specificAddress: getValues('specificEoaAddress') || undefined,
            });
            void validateExecutionConfig(configForInitialValidation);
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to fetch supported execution methods:', error);
          if (isMounted) {
            setSupportedMethods([]);
            void validateExecutionConfig(undefined);
          }
        });
    } else {
      setSupportedMethods([]);
      reset({
        executionMethodType: undefined,
        eoaOption: undefined,
        specificEoaAddress: undefined,
      });
      void validateExecutionConfig(undefined);
    }
    return () => {
      isMounted = false;
    };
  }, [adapter, control, getValues, onUpdateConfig, reset, setValue, validateExecutionConfig]);

  useEffect(() => {
    const watchCallback: WatchObserver<ExecutionMethodFormData> = (value, { name, type }) => {
      if (type === undefined && name === undefined) {
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

  return {
    formMethods,
    supportedMethods,
    watchedMethodType,
    watchedEoaOption,
    isValid,
    validationError,
  };
}
