import { useEffect } from 'react';

import type { ContractAdapter, ContractSchema, FormValues } from '@openzeppelin/ui-types';
import { hasMissingRequiredContractInputs } from '@openzeppelin/ui-utils';

import { contractDefinitionService } from '../../../../services/ContractDefinitionService';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

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
  adapter?: ContractAdapter | null;
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
  adapter,
}: UseAutoContractLoadProps) {
  useEffect(() => {
    const attemptAutomaticLoad = async () => {
      // Avoid duplicate loads during initial typing: if the store indicates a load is needed
      // and the form isn't valid yet, let the centralized store effect handle it later.
      // Once the form is valid (all required fields present), this hook should proceed
      // to trigger the load with full, current form values.
      if (needsContractDefinitionLoad && !formIsValid) {
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

      // Block auto-loads until adapter-declared required inputs are present
      if (
        !formIsValid ||
        (adapter && hasMissingRequiredContractInputs(adapter, debouncedValues)) ||
        !canAttemptLoad(debouncedValues)
      ) {
        return;
      }

      const { contractState } = uiBuilderStore.getState();
      if (contractState.requiredInputSnapshot) {
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
    adapter,
  ]);
}
