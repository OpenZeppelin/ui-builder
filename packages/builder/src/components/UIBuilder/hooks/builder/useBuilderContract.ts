import { useCallback, useMemo } from 'react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';
import { logger } from '@openzeppelin/ui-builder-utils';

import { STEP_INDICES } from '../../constants/stepIndices';
import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook to manage contract definition and function selection.
 * @returns An object with functions to handle definition loading and function selection.
 */
export function useBuilderContract() {
  const { activeAdapter } = useWalletState();

  const handleFunctionSelected = useCallback(
    async (functionId: string | null) => {
      const currentState = uiBuilderStore.getState();
      const previousFunctionId = currentState.selectedFunction;

      if (functionId !== null && functionId !== previousFunctionId) {
        const advancedToFormCustomization =
          currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR;
        uiBuilderStore.updateState(() => ({
          selectedFunction: functionId,
          formConfig: null,
          isExecutionStepValid: false,
          ...(advancedToFormCustomization && {
            currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
          }),
        }));

        // Trigger artifact trimming if adapter supports it AND artifacts were deferred
        if (
          activeAdapter &&
          typeof activeAdapter.prepareArtifactsForFunction === 'function' &&
          currentState.contractState.contractDefinitionArtifacts
        ) {
          // Only trim if we have the policy and the ZIP was actually deferred
          const policy =
            typeof activeAdapter.getArtifactPersistencePolicy === 'function'
              ? activeAdapter.getArtifactPersistencePolicy()
              : undefined;

          logger.info(
            'useBuilderContract',
            `Policy mode: ${policy?.mode}, threshold: ${policy?.sizeThresholdBytes}`
          );

          if (policy?.mode === 'deferredUntilFunctionSelected') {
            const artifacts = currentState.contractState.contractDefinitionArtifacts;
            const originalZipData = (artifacts as Record<string, unknown>).originalZipData as
              | string
              | undefined;

            logger.info(
              'useBuilderContract',
              `Has originalZipData: ${!!originalZipData}, keys: ${Object.keys(artifacts as Record<string, unknown>).join(', ')}`
            );

            // Check if ZIP is heavy enough to warrant trimming
            if (originalZipData && typeof originalZipData === 'string') {
              const threshold =
                policy.sizeThresholdBytes !== undefined
                  ? policy.sizeThresholdBytes
                  : 15 * 1024 * 1024;
              const estimatedSize = (originalZipData.length * 3) / 4;

              logger.info(
                'useBuilderContract',
                `ZIP size: ${Math.round(estimatedSize / 1024 / 1024)}MB, threshold: ${Math.round(threshold / 1024 / 1024)}MB`
              );

              if (estimatedSize >= threshold) {
                try {
                  logger.info(
                    'useBuilderContract',
                    `Preparing artifacts for function: ${functionId} (ZIP size: ${Math.round(estimatedSize / 1024 / 1024)}MB)`
                  );
                  const prepared = await activeAdapter.prepareArtifactsForFunction({
                    functionId,
                    currentArtifacts: currentState.contractState.contractDefinitionArtifacts,
                    definitionOriginal: currentState.contractState.definitionOriginal,
                  });

                  if (prepared.persistableArtifacts) {
                    logger.info('useBuilderContract', 'Updating state with trimmed artifacts');
                    uiBuilderStore.updateState((s) => ({
                      contractState: {
                        ...s.contractState,
                        contractDefinitionArtifacts: prepared.persistableArtifacts || null,
                      },
                    }));
                  }
                } catch (error) {
                  logger.error(
                    'useBuilderContract',
                    'Failed to prepare artifacts for function:',
                    error
                  );
                }
              } else {
                logger.info(
                  'useBuilderContract',
                  `ZIP is small (${Math.round(estimatedSize / 1024)}KB), skipping trimming`
                );
              }
            }
          }
        }
      } else if (functionId !== null && functionId === previousFunctionId) {
        // If the same function is re-selected, still navigate to form customization
        if (currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
          uiBuilderStore.updateState(() => ({
            currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
          }));
        }
      }
    },
    [activeAdapter]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      functionSelected: handleFunctionSelected,
    }),
    [handleFunctionSelected]
  );
}
