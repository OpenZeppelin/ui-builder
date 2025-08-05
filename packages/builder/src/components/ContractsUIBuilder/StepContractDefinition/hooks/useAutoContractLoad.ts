import { useEffect } from 'react';

import type { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';

interface UseAutoContractLoadProps {
  debouncedValues: FormValues;
  formIsValid: boolean;
  needsContractDefinitionLoad: boolean;
  contractDefinitionJson: string | null;
  contractDefinitionError: string | null;
  contractSchema: ContractSchema | null;
  canAttemptLoad: (values: FormValues) => boolean;
  markAttempted: (values: FormValues) => void;
  loadContract: (values: FormValues) => Promise<void>;
}

/**
 * Handles automatic contract loading based on form state changes
 */
export function useAutoContractLoad({
  debouncedValues,
  formIsValid,
  needsContractDefinitionLoad,
  contractDefinitionJson,
  contractDefinitionError,
  contractSchema,
  canAttemptLoad,
  markAttempted,
  loadContract,
}: UseAutoContractLoadProps) {
  useEffect(() => {
    const attemptAutomaticLoad = async () => {
      if (!formIsValid || !canAttemptLoad(debouncedValues)) {
        return;
      }

      const hasAddress = Boolean(debouncedValues.contractAddress);
      const hasManualABI = Boolean(
        typeof debouncedValues.contractDefinition === 'string' &&
          debouncedValues.contractDefinition.trim()
      );

      const shouldLoad =
        hasAddress &&
        (needsContractDefinitionLoad ||
          (!contractDefinitionJson && !contractDefinitionError) ||
          (contractDefinitionJson && !contractSchema) || // Need to regenerate schema from saved definition
          (hasManualABI && needsContractDefinitionLoad));

      if (shouldLoad) {
        markAttempted(debouncedValues);
        await loadContract(debouncedValues);
      }
    };

    void attemptAutomaticLoad();
  }, [
    debouncedValues,
    formIsValid,
    loadContract,
    needsContractDefinitionLoad,
    contractDefinitionJson,
    contractDefinitionError,
    contractSchema,
    canAttemptLoad,
    markAttempted,
  ]);
}
