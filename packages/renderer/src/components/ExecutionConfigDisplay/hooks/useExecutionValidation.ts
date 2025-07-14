import { useCallback, useEffect, useState } from 'react';

import type { ContractAdapter, ExecutionConfig } from '@openzeppelin/contracts-ui-builder-types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UseExecutionValidationProps {
  executionConfig: ExecutionConfig;
  adapter?: ContractAdapter;
  runtimeApiKey?: string;
}

export const useExecutionValidation = ({
  executionConfig,
  adapter,
  runtimeApiKey,
}: UseExecutionValidationProps): ValidationResult => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
  });

  const validateConfig = useCallback(async () => {
    if (!adapter) {
      setValidationResult({
        isValid: false,
        error: 'No adapter available for validation',
      });
      return;
    }

    try {
      const result = await adapter.validateExecutionConfig(executionConfig);

      if (result === true) {
        // Additional validation for runtime requirements
        let runtimeError: string | undefined;

        // Check if relayer method requires API key
        if (
          executionConfig.method === 'relayer' &&
          (!runtimeApiKey || runtimeApiKey.trim() === '')
        ) {
          runtimeError = 'Relayer API key is required for transaction execution';
        }

        setValidationResult({
          isValid: !runtimeError,
          error: runtimeError,
        });
      } else {
        setValidationResult({
          isValid: false,
          error: result,
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }, [executionConfig, adapter, runtimeApiKey]);

  useEffect(() => {
    validateConfig();
  }, [validateConfig]);

  return validationResult;
};
