import { useEffect } from 'react';

import type { ContractAdapter, FormValues } from '@openzeppelin/ui-builder-types';

import { contractDefinitionService } from '../../../../services/ContractDefinitionService';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

interface UseFormSyncProps {
  debouncedManualDefinition: string | undefined;
  contractAddressValue: string | undefined;
  currentContractAddress: string | null;
  networkId?: string | null;
  adapter?: ContractAdapter | null;
  debouncedValues?: FormValues;
}

/**
 * Handles synchronization between form state and the Zustand store
 */
export function useFormSync({
  debouncedManualDefinition,
  contractAddressValue,
  currentContractAddress,
  networkId,
  adapter,
  debouncedValues,
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

  // Sync adapter-declared artifact inputs generically into contractDefinitionArtifacts
  useEffect(() => {
    if (!adapter || !debouncedValues) return;
    if (typeof adapter.getContractDefinitionInputs !== 'function') return;

    try {
      const inputs = adapter.getContractDefinitionInputs() || [];
      // Collect values for inputs other than the canonical ones stored elsewhere
      const artifacts: Record<string, unknown> = {};
      for (const field of inputs as Array<{ name?: string; id?: string }>) {
        const key = field.name || field.id || '';
        if (!key || key === 'contractAddress' || key === 'contractDefinition') continue;
        const value = (debouncedValues as Record<string, unknown>)[key];
        if (value !== undefined) artifacts[key] = value as unknown;
      }

      // Update only if changed
      const state = uiBuilderStore.getState();
      const prev = state.contractState.contractDefinitionArtifacts || {};
      const changed = JSON.stringify(prev) !== JSON.stringify(artifacts);
      if (changed) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            contractDefinitionArtifacts: artifacts,
          },
        }));
      }
    } catch {
      // no-op on adapter errors
    }
  }, [adapter, debouncedValues]);
}
