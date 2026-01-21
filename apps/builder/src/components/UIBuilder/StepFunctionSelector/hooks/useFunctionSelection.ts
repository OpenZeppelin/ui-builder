import { useCallback } from 'react';

import type { ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStoreVanilla } from '../../hooks/uiBuilderStore';

interface UseFunctionSelectionResult {
  selectFunction: (functionId: string, modifiesState: boolean) => void;
}

export function useFunctionSelection(
  onFunctionSelected: (functionId: string | null) => void,
  contractSchema: ContractSchema | null
): UseFunctionSelectionResult {
  const selectFunction = useCallback(
    (functionId: string, modifiesState: boolean) => {
      // Allow selection of functions that modify state OR can execute locally (executable functions)
      // Chain-agnostic check: functions are executable if they modify state OR have stateMutability === 'pure'
      const functionDetails = contractSchema?.functions.find((fn) => fn.id === functionId);
      const canExecuteLocally = functionDetails?.stateMutability === 'pure';

      if (!modifiesState && !canExecuteLocally) {
        // Only block if it's not an executable function
        return;
      }

      // If loaded from a trimmed config (no original ZIP), block switching
      const state = uiBuilderStoreVanilla.getState();
      const artifacts = state.contractState.contractDefinitionArtifacts as Record<
        string,
        unknown
      > | null;
      const hasTrimmed = !!artifacts?.['trimmedZipBase64'];
      const hasOriginal = !!artifacts?.['originalZipData'];
      const isLoadedConfig = !!state.loadedConfigurationId;
      if (isLoadedConfig && hasTrimmed && !hasOriginal) {
        logger.info(
          'useFunctionSelection',
          'Selection blocked: trimmed artifacts require re-upload to change functions'
        );
        // Redirect to Contract Definition step where banner will be shown
        uiBuilderStoreVanilla.getState().updateState(() => ({
          currentStepIndex: STEP_INDICES.CONTRACT_DEFINITION,
        }));
        return; // Require re-upload to switch functions
      }

      onFunctionSelected(functionId);
    },
    [onFunctionSelected, contractSchema]
  );

  return {
    selectFunction,
  };
}
