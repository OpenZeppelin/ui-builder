import { useCallback, useState } from 'react';

import type { ContractAdapter } from '../../../../adapters';
import type { EoaExecutionConfig, ExecutionConfig } from '../../../../core/types/FormTypes';

interface UseExecutionMethodValidationArgs {
  adapter: ContractAdapter | null;
  onUpdateConfig: (config: ExecutionConfig | undefined, isValid: boolean) => void;
}

interface UseExecutionMethodValidationReturn {
  isValid: boolean;
  validationError: string | null;
  validate: (configToValidate: ExecutionConfig | undefined) => Promise<void>;
}

/**
 * Helper to ensure the config object has the correct structure based on the method.
 * Returns undefined if the config is fundamentally incomplete (e.g., method not set).
 */
function ensureCompleteConfig(
  partialConfig: Partial<ExecutionConfig>
): ExecutionConfig | undefined {
  if (!partialConfig.method) return undefined;

  if (partialConfig.method === 'eoa') {
    const config = partialConfig as Partial<EoaExecutionConfig>;
    return {
      method: 'eoa',
      allowAny: config.allowAny ?? true, // Default to allowAny if not specified
      specificAddress: config.specificAddress,
    };
  } else if (partialConfig.method === 'relayer') {
    // TODO: Implement structure for relayer
    return { method: 'relayer' };
  } else if (partialConfig.method === 'multisig') {
    // TODO: Implement structure for multisig
    return { method: 'multisig' };
  }
  return undefined; // Should not happen if method is valid
}

/**
 * Hook responsible for validating the ExecutionConfig.
 */
export function useExecutionMethodValidation({
  adapter,
  onUpdateConfig,
}: UseExecutionMethodValidationArgs): UseExecutionMethodValidationReturn {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback(
    async (configToValidate: ExecutionConfig | undefined) => {
      let currentIsValid = false;
      let currentError: string | null = null;

      if (!adapter) {
        currentError = 'Adapter not available.';
      } else if (!configToValidate) {
        currentError = 'Please select an execution method.';
      } else if (configToValidate.method === 'eoa') {
        // EOA-specific basic check
        if (!configToValidate.allowAny && !configToValidate.specificAddress) {
          currentError = 'Please provide the specific EOA address.';
        }
      } else if (configToValidate.method === 'relayer') {
        // Placeholder: No basic sync checks for now
        currentError = null;
      } else if (configToValidate.method === 'multisig') {
        // Placeholder: No basic sync checks for now
        currentError = null;
      }
      // Add other method basic checks here if needed

      // Only proceed to adapter validation if basic checks pass
      if (!currentError && adapter && configToValidate) {
        try {
          const result = await adapter.validateExecutionConfig(configToValidate);
          if (result === true) {
            currentIsValid = true;
            currentError = null;
          } else {
            currentError = result; // Adapter provides the error for relayer/multisig if invalid
          }
        } catch (error) {
          console.error('Validation error:', error);
          currentError = 'An unexpected error occurred during validation.';
        }
      } else {
        // Basic checks failed or no adapter/config
        currentIsValid = false;
      }

      setIsValid(currentIsValid);
      setValidationError(currentError);

      // Call parent update with the latest config and validity state
      onUpdateConfig(configToValidate, currentIsValid);
    },
    [adapter, onUpdateConfig]
  );

  return {
    isValid,
    validationError,
    validate,
  };
}

// Export helper for potential external use or testing, though not strictly necessary
export { ensureCompleteConfig };
