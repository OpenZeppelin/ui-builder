import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { useStorageOperations } from '../../../../hooks/useStorageOperations';
import { uiBuilderStore } from '../uiBuilderStore';

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

export function useAutoSave(isLoadingSavedConfigRef: React.RefObject<boolean>): AutoSaveHookReturn {
  const { updateContractUI } = useContractUIStorage();
  const storageOperations = useStorageOperations();

  // Use ref to store the current auto-save function to avoid dependency issues
  const autoSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Subscribe to store state changes
  const state = useSyncExternalStore(
    uiBuilderStore.subscribe,
    uiBuilderStore.getState,
    uiBuilderStore.getState
  );

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

    try {
      const currentState = uiBuilderStore.getState();

      // Run all guard checks
      const { proceed, configId } = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        currentState
      );

      if (!proceed || !configId) {
        return;
      }

      // Update UI state
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

      // Save configuration
      logger.info('Auto-save: Updating existing configuration', `ID: ${configId}`);
      await updateContractUI(configId, configToSave);

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
      const currentState = uiBuilderStore.getState();
      const configId = currentState.loadedConfigurationId;

      uiBuilderStore.updateStateImmediate(() => ({ isAutoSaving: false }));
      if (configId) {
        storageOperations.setSaving(configId, false);
      }
      globalAutoSaveState.releaseLock();
    }
  }, [isLoadingSavedConfigRef, updateContractUI, storageOperations]);

  // Update the ref whenever autoSave changes
  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  /**
   * Effect to schedule auto-save operations
   * Fixed: Removed autoSave from dependencies to prevent infinite loop
   */
  useEffect(() => {
    if (globalAutoSaveState.paused || globalAutoSaveState.shouldSkipCycle()) {
      return;
    }

    globalAutoSaveState.setTimer(() => {
      if (autoSaveRef.current) {
        void autoSaveRef.current();
      }
    });
  }, [
    state.selectedFunction,
    state.formConfig?.title,
    state.formConfig?.description,
    state.formConfig?.fields,
    state.formConfig?.executionConfig,
    state.formConfig?.uiKitConfig,
    // Removed autoSave from here to prevent infinite loop
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
