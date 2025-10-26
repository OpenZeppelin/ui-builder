import { toast } from 'sonner';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { useCallback, useEffect, useRef } from 'react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';
import {
  contractUIStorage,
  ContractUIStorage,
  type ContractUIRecord,
} from '@openzeppelin/ui-builder-storage';
import type { ContractAdapter } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { useContractUIStorage } from '../../../../contexts/useContractUIStorage';
import { useStorageOperations } from '../../../../hooks/useStorageOperations';
import { uiBuilderStore, type UIBuilderState } from '../uiBuilderStore';
import { useUIBuilderStore } from '../useUIBuilderStore';
import {
  autoSaveCache,
  AutoSaveGuards,
  AutoSaveHookReturn,
  buildConfigurationObject,
  generateDefaultTitle,
  globalAutoSaveState,
} from './autoSave';

/**
 * Auto-save hook with debouncing and duplicate operation prevention.
 * See documentation for complete usage patterns and architecture details.
 *
 * @see {@link packages/builder/docs/state-management.md | Auto-save Documentation}
 */
/**
 * Handle auto-save errors with consistent logging and user feedback
 */
function handleAutoSaveError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('Auto-save failed', errorMessage);
  toast.error('Auto-save failed', {
    description: 'Your changes could not be saved. Please try again.',
  });
}

/**
 * Prepare record with definition while preserving original for comparison
 * This ensures that the original contract definition is preserved when updating
 * a loaded configuration, which is critical for ABI comparison functionality.
 *
 * Also respects adapter persistence policy to defer heavy artifacts.
 */
async function prepareRecordWithDefinition(
  currentState: UIBuilderState,
  configToSave: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'>,
  configId: string,
  adapter?: ContractAdapter
): Promise<Partial<ContractUIRecord>> {
  const existingConfig = await contractUIStorage.get(configId);

  const storedOriginal = existingConfig?.contractDefinitionOriginal;
  const freshOriginal = currentState.contractState.definitionOriginal;

  const shouldPreserveStoredDefinition =
    existingConfig && // Has stored config
    storedOriginal && // Has stored original definition
    currentState.loadedConfigurationId === configId && // We're in loaded config mode
    freshOriginal !== storedOriginal; // Fresh vs stored are different

  if (shouldPreserveStoredDefinition) {
    logger.info('Auto-save', 'Preserving stored contract definition for ABI comparison');
  } else {
    logger.info('Auto-save', 'Saving fresh contract definition');
  }

  // Check if adapter wants to defer heavy artifacts
  let artifactsToSave = currentState.contractState.contractDefinitionArtifacts || undefined;

  // Filter out unprocessed ZIP file objects that can't be serialized
  if (artifactsToSave) {
    const hasUnprocessedZip =
      (artifactsToSave as Record<string, unknown>).contractArtifactsZip &&
      !(artifactsToSave as Record<string, unknown>).originalZipData;

    if (hasUnprocessedZip) {
      logger.info(
        'Auto-save',
        'Removing unprocessed File object from artifacts (will be converted by adapter)'
      );
      // Remove the File object but keep other fields like privateStateId
      const { contractArtifactsZip: _, ...rest } = artifactsToSave as Record<string, unknown>;
      artifactsToSave = Object.keys(rest).length > 0 ? rest : undefined;
    }
  }

  if (adapter && typeof adapter.getArtifactPersistencePolicy === 'function' && artifactsToSave) {
    const policy = adapter.getArtifactPersistencePolicy();
    if (policy?.mode === 'deferredUntilFunctionSelected') {
      const threshold = policy.sizeThresholdBytes || 15 * 1024 * 1024;
      const originalZipData = (artifactsToSave as Record<string, unknown>).originalZipData as
        | string
        | undefined;

      if (originalZipData && typeof originalZipData === 'string') {
        // Estimate size from base64 (roughly 4/3 of original)
        const estimatedSize = (originalZipData.length * 3) / 4;

        if (estimatedSize >= threshold && !currentState.selectedFunction) {
          logger.info(
            'Auto-save',
            `Deferring heavy artifact persistence (${Math.round(estimatedSize / 1024 / 1024)}MB) until function selected`
          );
          // Omit originalZipData and contractArtifactsZip (File object) from what we persist
          const {
            originalZipData: _o,
            contractArtifactsZip: _z,
            ...rest
          } = artifactsToSave as Record<string, unknown>;
          artifactsToSave = Object.keys(rest).length > 0 ? rest : undefined;
        }
      }
    }
  }

  return ContractUIStorage.prepareRecordWithDefinition(
    configToSave,
    currentState.contractState.definitionJson || undefined, // Use fresh definition for UI
    currentState.contractState.source ?? undefined,
    currentState.contractState.metadata || undefined,
    shouldPreserveStoredDefinition
      ? storedOriginal
      : currentState.contractState.definitionOriginal || undefined,
    artifactsToSave
  );
}

export function useAutoSave(isLoadingSavedConfigRef: React.RefObject<boolean>): AutoSaveHookReturn {
  const { updateContractUI, saveContractUI } = useContractUIStorage();
  const storageOperations = useStorageOperations();
  const { activeAdapter } = useWalletState();

  // Subscribe to store state changes with our new, clean hook
  const state = useUIBuilderStore((s) => s);

  // Use ref to store the current auto-save function to avoid dependency issues
  const autoSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);

  /**
   * Core auto-save operation - simplified with extracted modules
   */
  const autoSave = useCallback(async () => {
    // Early exit if paused
    if (globalAutoSaveState.paused) {
      logger.info('builder', 'Auto-save paused, skipping');
      return;
    }

    // Acquire lock to prevent concurrent operations
    if (!globalAutoSaveState.acquireLock()) {
      return;
    }

    let operationConfigId: string | null = null;

    try {
      const currentState = uiBuilderStore.getState();

      // Skip auto-save only for validation errors, not for unverified contract errors
      if (
        currentState.contractState.error &&
        !currentState.contractState.error.includes('not verified on the block explorer')
      ) {
        logger.info('builder', 'Skipping auto-save due to contract definition validation error');
        return;
      }

      // Run all guard checks
      const { proceed, configId, needsRecordCreation } = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        currentState
      );
      operationConfigId = configId;

      if (!proceed) {
        return;
      }

      // Handle record creation for new UI mode
      if (needsRecordCreation) {
        logger.info('builder', '[useAutoSave] Taking CREATE path - creating new record');
        // Update UI state for creation
        uiBuilderStore.updateState(() => ({ isAutoSaving: true }));

        // Yield to prevent blocking
        await Promise.resolve();

        // Build configuration for new record
        const titleToUse = generateDefaultTitle(currentState);
        const configToSave = buildConfigurationObject(currentState, titleToUse);

        // Prepare record with contract schema data if available
        const recordToSave = currentState.contractState.definitionJson
          ? ContractUIStorage.prepareRecordWithDefinition(
              {
                ...configToSave,
                metadata: {
                  isManuallyRenamed: false,
                },
                contractDefinitionSource: currentState.contractState.source || undefined,
              },
              currentState.contractState.definitionJson,
              currentState.contractState.source ?? undefined,
              currentState.contractState.metadata || undefined,
              currentState.contractState.definitionOriginal || undefined,
              currentState.contractState.contractDefinitionArtifacts || undefined
            )
          : ({
              ...configToSave,
              metadata: {
                isManuallyRenamed: false,
              },
              // Explicitly clear all contract definition fields when no definition exists
              contractDefinition: '',
              contractDefinitionMetadata: undefined,
              contractDefinitionOriginal: '',
              contractDefinitionSource: undefined,
              contractDefinitionArtifacts: undefined,
            } as const);

        // Create new record
        logger.info('builder', 'Auto-save: Creating new record for meaningful content');
        const newConfigId = await contractUIStorage.save(recordToSave);

        // Update state with new record ID and exit new UI mode
        uiBuilderStore.updateState(() => ({
          loadedConfigurationId: newConfigId,
          isInNewUIMode: false,
        }));

        // Update cache for new record
        autoSaveCache.updateConfigCache(newConfigId, configToSave);

        logger.info('Auto-save: New record created', `ID: ${newConfigId}`);
        return;
      }

      if (!configId) {
        return;
      }

      // Update UI state for existing record
      uiBuilderStore.updateState(() => ({ isAutoSaving: true }));
      storageOperations.setSaving(configId, true);

      // Yield to prevent blocking
      await Promise.resolve();

      // Get title information (cached)
      const { title: existingTitle, isManuallyRenamed } =
        await autoSaveCache.getTitleInfo(configId);
      const titleToUse =
        isManuallyRenamed && existingTitle ? existingTitle : generateDefaultTitle(currentState);

      // Build configuration
      const configToSave = buildConfigurationObject(currentState, titleToUse);

      // Check if config actually changed (cached comparison)
      if (!autoSaveCache.hasConfigChanged(configId, configToSave)) {
        logger.info('builder', 'Skipping unchanged auto-save');
        return;
      }

      // Prepare record with contract definition data if available
      const recordToSave = currentState.contractState.definitionJson
        ? await prepareRecordWithDefinition(
            currentState,
            configToSave,
            configId,
            activeAdapter ?? undefined
          )
        : ({
            ...configToSave,
            // Explicitly clear all contract definition fields when no definition exists
            contractDefinition: '',
            contractDefinitionMetadata: undefined,
            contractDefinitionOriginal: '',
            contractDefinitionSource: undefined,
            contractDefinitionArtifacts: undefined,
          } as const);

      // Save configuration
      logger.info('Auto-save: Updating existing configuration', `ID: ${configId}`);
      logger.info('Auto-save', 'Record data being saved:', recordToSave);
      await updateContractUI(configId, recordToSave);
      logger.info('Auto-save', 'Database update completed');

      // Update cache
      autoSaveCache.updateConfigCache(configId, configToSave);

      // Update loaded configuration ID if needed
      if (currentState.loadedConfigurationId !== configId) {
        uiBuilderStore.updateState(() => ({ loadedConfigurationId: configId }));
      }
    } catch (error) {
      handleAutoSaveError(error);
    } finally {
      // Cleanup
      uiBuilderStore.updateState(() => ({ isAutoSaving: false }));
      if (operationConfigId) {
        storageOperations.setSaving(operationConfigId, false);
      }
      globalAutoSaveState.releaseLock();
    }
  }, [isLoadingSavedConfigRef, updateContractUI, saveContractUI, storageOperations]);

  // Update the ref whenever autoSave changes
  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  // Single composite key to detect changes across the full formConfig and relevant contract state.
  // Perf note: JSON.stringify is O(n) in config size and acceptable for typical forms.
  // If profiling shows this hot, switch to a store-level numeric revision counter instead,
  // e.g. `formConfigRevision` incremented on any formConfig/definition change, and depend on that.
  const autoSaveKey = JSON.stringify({
    formConfig: state.formConfig,
    contractDefinitionJson: state.contractState.definitionJson,
    contractDefinitionSource: state.contractState.source,
    contractDefinitionMetadata: state.contractState.metadata,
    contractDefinitionArtifacts: state.contractState.contractDefinitionArtifacts,
  });

  /**
   * Effect to schedule auto-save operations
   *
   * It is debounced with a timeout to prevent excessive updates. It also includes guards to prevent
   * auto-saving in certain scenarios, such as when the form is pristine or when a load/reset has
   * just occurred.
   */
  useDeepCompareEffect(() => {
    // Schedule the auto-save operation after a delay
    globalAutoSaveState.setTimer(() => {
      if (autoSaveRef.current) {
        void autoSaveRef.current();
      }
    });
  }, [
    {
      selectedNetworkConfigId: state.selectedNetworkConfigId,
      contractAddress: state.contractState.address,
      selectedFunction: state.selectedFunction,
      // Single composite key capturing all relevant formConfig + contract definition changes
      autoSaveKey,
    },
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => globalAutoSaveState.cleanup();
  }, []);

  return {
    pause: globalAutoSaveState.pause.bind(globalAutoSaveState),
    resume: globalAutoSaveState.resume.bind(globalAutoSaveState),
    isPaused: globalAutoSaveState.paused,
  };
}
