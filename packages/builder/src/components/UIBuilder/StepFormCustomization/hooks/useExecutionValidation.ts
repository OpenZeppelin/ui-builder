import { useCallback, useEffect, useRef } from 'react';

import type { ExecutionConfig } from '@openzeppelin/ui-types';

/**
 * Custom hook to manage combined validation state for execution config and form fields.
 * Tracks both execution validation and field validation errors, providing a callback
 * to notify the parent when the combined validation state changes.
 *
 * @param fieldValidationErrors - Map of field IDs to their validation error states
 * @param currentExecutionConfig - The current execution configuration
 * @param onExecutionConfigUpdated - Callback to notify parent of validation changes
 */
export function useExecutionValidation(
  fieldValidationErrors: Map<string, boolean>,
  currentExecutionConfig: ExecutionConfig | undefined,
  onExecutionConfigUpdated?: (execConfig: ExecutionConfig | undefined, isValid: boolean) => void
) {
  const executionValidRef = useRef<boolean>(true);

  /**
   * Handler for when execution config changes
   * Combines execution validation with field validation for overall validity
   */
  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isExecutionValid: boolean) => {
      executionValidRef.current = isExecutionValid;
      const combinedIsValid =
        isExecutionValid &&
        Array.from(fieldValidationErrors.values()).every((hasError) => !hasError);
      onExecutionConfigUpdated?.(execConfig, combinedIsValid);
    },
    [fieldValidationErrors, onExecutionConfigUpdated]
  );

  /**
   * Update combined validation whenever field validation changes
   */
  useEffect(() => {
    if (onExecutionConfigUpdated) {
      const combinedIsValid =
        executionValidRef.current &&
        Array.from(fieldValidationErrors.values()).every((hasError) => !hasError);
      onExecutionConfigUpdated(currentExecutionConfig, combinedIsValid);
    }
  }, [fieldValidationErrors, currentExecutionConfig, onExecutionConfigUpdated]);

  return { handleExecutionConfigUpdated, executionValidRef };
}
