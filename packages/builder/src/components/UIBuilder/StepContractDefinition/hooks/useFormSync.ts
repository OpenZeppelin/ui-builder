import { useEffect } from 'react';

import type { ContractAdapter, FormValues } from '@openzeppelin/ui-builder-types';
import {
  buildRequiredInputSnapshot,
  hasMissingRequiredContractInputs,
  normalizeAddress,
  requiredSnapshotsEqual,
} from '@openzeppelin/ui-builder-utils';

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
    const normalizedInput = normalizeAddress(contractAddressValue);
    const normalizedCurrent = normalizeAddress(currentContractAddress);

    if (normalizedInput) {
      // Only treat as changed if the normalized values differ
      if (normalizedCurrent !== normalizedInput) {
        if (networkId && currentContractAddress) {
          contractDefinitionService.reset(networkId, currentContractAddress);
        }

        uiBuilderStore.updateState((s) => {
          const nextFormValues: FormValues = {
            ...(s.contractState.formValues || {}),
            contractAddress: contractAddressValue ?? '',
          } as FormValues;

          if (!s.contractState.requiredInputSnapshot) {
            return {
              contractState: {
                ...s.contractState,
                address: contractAddressValue ?? null,
                schema: null,
                error: null,
                definitionJson: null,
                definitionOriginal: null,
                source: null,
                metadata: null,
                formValues: nextFormValues,
                requiredInputSnapshot: null,
                requiresManualReload: false,
              },
              needsContractDefinitionLoad: true,
            };
          }

          return {
            contractState: {
              ...s.contractState,
              address: contractAddressValue ?? null,
              error: null,
              formValues: nextFormValues,
            },
          };
        });

        const state = uiBuilderStore.getState();
        if (state.contractState.requiredInputSnapshot) {
          uiBuilderStore.markManualReloadRequired();
        } else {
          uiBuilderStore.resetDownstreamSteps('contract');
        }
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
          requiredInputSnapshot: null,
          requiresManualReload: false,
        },
        needsContractDefinitionLoad: false,
      }));

      // Also reset downstream when address is cleared entirely
      uiBuilderStore.resetDownstreamSteps('contract');
    }
  }, [contractAddressValue, currentContractAddress, networkId]);

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

      // Merge with existing artifacts to preserve fields like originalZipData that come from loading
      const mergedArtifacts = { ...prev, ...artifacts };

      const changed = JSON.stringify(prev) !== JSON.stringify(mergedArtifacts);
      if (changed) {
        uiBuilderStore.updateState((s) => ({
          contractState: {
            ...s.contractState,
            contractDefinitionArtifacts: mergedArtifacts,
          },
        }));

        // Transition-based gating: only set needsContractDefinitionLoad when
        // required adapter inputs change from missing -> present
        const nowHasAll = adapter
          ? !hasMissingRequiredContractInputs(adapter, {
              ...(uiBuilderStore.getState().contractState.formValues || {}),
              ...artifacts,
            } as FormValues)
          : false;

        const prevHadAll = adapter
          ? !hasMissingRequiredContractInputs(adapter, {
              ...(uiBuilderStore.getState().contractState.formValues || {}),
              ...(prev as Record<string, unknown>),
            } as FormValues)
          : false;

        if (
          !prevHadAll &&
          nowHasAll &&
          !uiBuilderStore.getState().contractState.requiredInputSnapshot
        ) {
          uiBuilderStore.updateState((s) => ({
            ...s,
            needsContractDefinitionLoad: true,
          }));
        }
      }
    } catch {
      // no-op on adapter errors
    }
  }, [adapter, debouncedValues]);

  useEffect(() => {
    if (!adapter || !debouncedValues) return;
    const state = uiBuilderStore.getState();
    const snapshot = state.contractState.requiredInputSnapshot;
    if (!snapshot) return;

    const currentSnapshot = buildRequiredInputSnapshot(adapter, debouncedValues);
    if (!currentSnapshot) return;

    if (!requiredSnapshotsEqual(snapshot, currentSnapshot)) {
      uiBuilderStore.markManualReloadRequired();
    }
  }, [adapter, debouncedValues]);
}
