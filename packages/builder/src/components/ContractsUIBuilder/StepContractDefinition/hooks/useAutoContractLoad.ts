import { useEffect } from 'react';

import type { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';

import { contractDefinitionService } from '../../../../services/ContractDefinitionService';

interface UseAutoContractLoadProps {
  debouncedValues: FormValues;
  formIsValid: boolean;
  needsContractDefinitionLoad: boolean;
  networkId?: string | null;
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
  networkId,
  contractDefinitionJson,
  contractDefinitionError,
  contractSchema,
  canAttemptLoad,
  markAttempted,
  loadContract,
}: UseAutoContractLoadProps) {
  useEffect(() => {
    const attemptAutomaticLoad = async () => {
      // Avoid duplicate loads: when the store indicates a load is needed,
      // let the centralized store effect handle it instead of this hook.
      if (needsContractDefinitionLoad) {
        return;
      }

      // If the centralized service is currently loading this address, do NOT trigger a parallel load
      const address =
        typeof debouncedValues.contractAddress === 'string'
          ? debouncedValues.contractAddress.trim()
          : undefined;
      if (networkId && address) {
        const state = contractDefinitionService.getLoadingState(networkId, address);
        if (state.isLoading) {
          return;
        }
      }

      if (!formIsValid || !canAttemptLoad(debouncedValues)) {
        return;
      }

      const hasAddress = Boolean(debouncedValues.contractAddress);

      const shouldLoad =
        (hasAddress && !contractDefinitionJson && !contractDefinitionError) || // No definition yet, safe to load once
        (contractDefinitionJson && !contractSchema); // Need to regenerate schema from saved definition

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
    networkId,
    contractDefinitionJson,
    contractDefinitionError,
    contractSchema,
    canAttemptLoad,
    markAttempted,
  ]);
}
