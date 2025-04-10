import { useEffect, useState } from 'react';
import { useForm, UseFormReturn, WatchObserver } from 'react-hook-form';

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
  onUpdateConfig: (config: ExecutionConfig | undefined) => void;
}

interface UseExecutionMethodStateReturn {
  formMethods: UseFormReturn<ExecutionMethodFormData>;
  supportedMethods: ExecutionMethodDetail[];
  watchedMethodType: ExecutionMethodType | undefined;
  watchedEoaOption: 'any' | 'specific' | undefined;
  // Add validation state later if needed
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
        currentConfig?.method === 'eoa' ? (currentConfig.allowAny ? 'any' : 'specific') : undefined,
      specificEoaAddress: currentConfig?.method === 'eoa' ? currentConfig.specificAddress : '',
    },
  });

  const { control, watch, reset, setValue } = formMethods;

  const watchedMethodType = watch('executionMethodType');
  const watchedEoaOption = watch('eoaOption');

  const [supportedMethods, setSupportedMethods] = useState<ExecutionMethodDetail[]>([]);

  // Fetch supported methods from adapter
  useEffect(() => {
    let isMounted = true;
    if (adapter) {
      adapter
        .getSupportedExecutionMethods()
        .then((methods: ExecutionMethodDetail[]) => {
          if (isMounted) {
            setSupportedMethods(methods);
            const currentMethodType = control._defaultValues.executionMethodType;
            if (
              !currentMethodType ||
              !methods.some((m: ExecutionMethodDetail) => m.type === currentMethodType)
            ) {
              const defaultMethod =
                methods.find((m: ExecutionMethodDetail) => m.type === 'eoa') || methods[0];
              if (defaultMethod) {
                setValue('executionMethodType', defaultMethod.type as ExecutionMethodType);
              }
            }
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to fetch supported execution methods:', error);
          if (isMounted) setSupportedMethods([]);
        });
    } else {
      setSupportedMethods([]);
      reset({
        executionMethodType: undefined,
        eoaOption: undefined,
        specificEoaAddress: undefined,
      });
      onUpdateConfig(undefined);
    }
    return () => {
      isMounted = false;
    };
  }, [adapter, control, setValue, reset, onUpdateConfig]);

  // Update parent config when local RHF state changes
  useEffect(() => {
    const watchCallback: WatchObserver<ExecutionMethodFormData> = (
      value, // value is the full form state
      { name, type } // name/type of the field that triggered the change
    ) => {
      // Use 'value' directly as it contains the latest form data
      const formData = value as ExecutionMethodFormData;

      // Clear dependent fields first
      if (name === 'eoaOption' && formData.eoaOption === 'any') {
        setValue('specificEoaAddress', '');
      }
      if (name === 'executionMethodType' && formData.executionMethodType !== 'eoa') {
        setValue('eoaOption', undefined);
        setValue('specificEoaAddress', '');
      }

      // Construct the ExecutionConfig
      let newConfig: ExecutionConfig | undefined = undefined;
      if (formData.executionMethodType === 'eoa') {
        const allowAny = formData.eoaOption === 'any';
        const specificAddress = allowAny ? undefined : formData.specificEoaAddress || undefined;
        newConfig = {
          method: 'eoa',
          allowAny: allowAny,
          specificAddress: specificAddress,
        };
      } else if (formData.executionMethodType) {
        newConfig = { method: formData.executionMethodType } as ExecutionConfig;
      }

      onUpdateConfig(newConfig);
      // TODO: Trigger final adapter validation logic here
    };

    // Type the subscription based on its expected shape
    const subscription: { unsubscribe: () => void } = watch(watchCallback);

    return () => subscription.unsubscribe();
  }, [watch, onUpdateConfig, setValue]);

  return {
    formMethods,
    supportedMethods,
    watchedMethodType,
    watchedEoaOption,
  };
}
