import { useEffect } from 'react';

import { uiBuilderStore } from '../../hooks/uiBuilderStore';

interface UseFormSyncProps {
  debouncedManualDefinition: string | undefined;
  contractAddressValue: string | undefined;
  currentContractAddress: string | null;
}

/**
 * Handles synchronization between form state and the Zustand store
 */
export function useFormSync({
  debouncedManualDefinition,
  contractAddressValue,
  currentContractAddress,
}: UseFormSyncProps) {
  // Sync manual definition changes to the store
  useEffect(() => {
    if (typeof debouncedManualDefinition === 'string') {
      if (debouncedManualDefinition.trim().length > 0) {
        uiBuilderStore.setManualContractDefinition(debouncedManualDefinition);
      } else {
        uiBuilderStore.clearManualContractDefinition();
      }
    } else if (debouncedManualDefinition === undefined) {
      uiBuilderStore.clearManualContractDefinition();
    }
  }, [debouncedManualDefinition]);

  // Sync contract address to store for auto-save
  useEffect(() => {
    if (contractAddressValue && typeof contractAddressValue === 'string') {
      // Only update if address changed to prevent unnecessary updates
      if (currentContractAddress !== contractAddressValue) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            address: contractAddressValue,
            formValues: {
              ...s.contractState.formValues,
              contractAddress: contractAddressValue,
            },
          },
        }));
      }
    }
  }, [contractAddressValue, currentContractAddress]);
}
