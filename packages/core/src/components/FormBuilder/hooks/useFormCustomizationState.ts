import { useCallback, useState } from 'react';

import type { BuilderFormConfig, ExecutionConfig } from '../../../core/types/FormTypes';

/**
 * Hook for managing form customization state in the Transaction Form Builder.
 * Used in the fourth step of the form building process.
 */
export function useFormCustomizationState() {
  const [formConfig, setFormConfig] = useState<BuilderFormConfig | null>(null);
  const [isExecutionStepValid, setIsExecutionStepValid] = useState(false);

  const handleFormConfigUpdated = useCallback((config: BuilderFormConfig) => {
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
      const existingExecutionConfig = prevConfig?.executionConfig;
      return { ...config, executionConfig: existingExecutionConfig };
    });
  }, []);

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
