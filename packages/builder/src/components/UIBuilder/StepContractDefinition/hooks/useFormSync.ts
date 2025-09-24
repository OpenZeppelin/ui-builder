import { useEffect } from 'react';

import { contractDefinitionService } from '../../../../services/ContractDefinitionService';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

interface UseFormSyncProps {
  debouncedManualDefinition: string | undefined;
  contractAddressValue: string | undefined;
  currentContractAddress: string | null;
  networkId?: string | null;
}

/**
 * Handles synchronization between form state and the Zustand store
 */
export function useFormSync({
  debouncedManualDefinition,
  contractAddressValue,
  currentContractAddress,
  networkId,
}: UseFormSyncProps) {
  // Sync manual definition changes to the store
  useEffect(() => {
    if (typeof debouncedManualDefinition === 'string') {
      if (debouncedManualDefinition.trim().length > 0) {
        uiBuilderStore.setManualContractDefinition(debouncedManualDefinition);
      } else {
        uiBuilderStore.clearManualContractDefinition();
      }
    }
  }, [debouncedManualDefinition]);

  // Sync contract address to store for auto-save
  useEffect(() => {
    if (contractAddressValue && typeof contractAddressValue === 'string') {
      // Only update if address changed to prevent unnecessary updates
      if (currentContractAddress !== contractAddressValue) {
        // Reset dedup state for the previous address so re-typing it will reload
        if (networkId && currentContractAddress) {
          contractDefinitionService.reset(networkId, currentContractAddress);
        }
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            // Update the active address and clear any loaded schema/error to force a reload
            address: contractAddressValue,
            schema: null,
            error: null,
            // Clear contract definition fields so storage doesn't compare against previous contract
            definitionJson: null,
            definitionOriginal: null,
            source: null,
            metadata: null,
          },
          // Mark that we need to (re)load the contract definition for the new address
          needsContractDefinitionLoad: true,
        }));

        // Reset function selection and form config to avoid ABI mismatch with the new address
        uiBuilderStore.resetDownstreamSteps('contract');
      }
    } else if (currentContractAddress) {
      // If the input was cleared, reflect that in the store and stop loading attempts
      if (networkId && currentContractAddress) {
        contractDefinitionService.reset(networkId, currentContractAddress);
      }
      uiBuilderStore.updateState((s) => ({
        contractState: {
          ...s.contractState,
          address: null,
          schema: null,
          error: null,
          // Clear contract definition fields when address is cleared
          definitionJson: null,
          definitionOriginal: null,
          source: null,
          metadata: null,
          // Ensure form defaults also reflect the cleared input so it isn't reinstated by a reset
          formValues: { contractAddress: '' },
        },
        needsContractDefinitionLoad: false,
      }));

      // Also reset downstream when address is cleared entirely
      uiBuilderStore.resetDownstreamSteps('contract');
    }
  }, [contractAddressValue, currentContractAddress]);
}
