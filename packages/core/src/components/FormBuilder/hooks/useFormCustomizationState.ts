import { useCallback, useState } from 'react';

import type {
  BuilderFormConfig,
  EoaExecutionConfig,
  ExecutionConfig,
} from '../../../core/types/FormTypes';

/**
 * Hook for managing form customization state in the Transaction Form Builder.
 * Used in the fourth step of the form building process.
 */
export function useFormCustomizationState() {
  const [formConfig, setFormConfig] = useState<BuilderFormConfig | null>(null);
  const [isExecutionStepValid, setIsExecutionStepValid] = useState(false);

  const handleFormConfigUpdated = useCallback(
    (config: BuilderFormConfig) => {
      // Only update state if the config actually changed
      setFormConfig((prevConfig) => {
        // If the new config is exactly the same object, don't update
        if (prevConfig === config) {
          return prevConfig;
        }

        // If the new config has the same values, don't update
        if (
          prevConfig &&
          prevConfig.functionId === config.functionId &&
          JSON.stringify(prevConfig) === JSON.stringify(config)
        ) {
          return prevConfig;
        }

        // Define the default EOA config
        const defaultEoaConfig: EoaExecutionConfig = { method: 'eoa', allowAny: true };

        // Check if prevConfig exists and if it already has an executionConfig
        const existingExecutionConfig = prevConfig?.executionConfig;
        const finalExecutionConfig = existingExecutionConfig ?? defaultEoaConfig;

        // If we're setting the default config, mark the step as valid
        if (!existingExecutionConfig) {
          setIsExecutionStepValid(true);
        }

        return { ...config, executionConfig: finalExecutionConfig };
      });
    },
    [setIsExecutionStepValid]
  );

  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isValid: boolean) => {
      setFormConfig((prevConfig) => {
        if (!prevConfig) return null;
        if (JSON.stringify(prevConfig.executionConfig) === JSON.stringify(execConfig)) {
          return prevConfig;
        }
        return { ...prevConfig, executionConfig: execConfig };
      });
      setIsExecutionStepValid(isValid);
    },
    []
  );

  const resetFormConfig = useCallback(() => {
    setFormConfig(null);
    setIsExecutionStepValid(false);
  }, []);

  return {
    formConfig,
    isExecutionStepValid,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    resetFormConfig,
  };
}
