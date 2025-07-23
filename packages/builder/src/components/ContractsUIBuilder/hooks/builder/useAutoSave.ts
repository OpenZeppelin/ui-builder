import { toast } from 'sonner';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  contractUIStorage,
  useContractUIStorage,
} from '@openzeppelin/contracts-ui-builder-storage';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { uiBuilderStore } from '../uiBuilderStore';

/**
 * Global state for auto-save functionality across all hook instances.
 * This prevents race conditions and duplicate operations when multiple components use the hook.
 */
let globalAutoSaveInProgress = false;
let globalLastSavedFunction: string | null = null;
let globalAutoSavePaused = false;
let globalAutoSaveTimer: NodeJS.Timeout | null = null;
let globalSkipNextCycle = false;

/**
 * Hook that provides reactive auto-save functionality for the UI builder state.
 *
 * Features:
 * - Prevents duplicate saves across multiple hook instances using global locks
 * - Provides pause/resume API to control auto-save during loading operations
 * - Debounces auto-save operations to prevent excessive API calls
 * - Handles both creation of new configurations and updates to existing ones
 *
 * @param isLoadingSavedConfigRef - Ref to track if a saved configuration is being loaded
 * @returns Object with pause, resume functions and current pause state
 */
export function useAutoSave(isLoadingSavedConfigRef: React.RefObject<boolean>) {
  const { saveContractUI, updateContractUI } = useContractUIStorage();

  // Subscribe to UI builder store state changes
  const state = useSyncExternalStore(
    uiBuilderStore.subscribe,
    uiBuilderStore.getState,
    uiBuilderStore.getState
  );

  /**
   * Performs the actual auto-save operation with comprehensive guards and error handling.
   */
  const autoSave = useCallback(async () => {
    // Early exit if auto-save is paused
    if (globalAutoSavePaused) {
      logger.info('builder', 'Auto-save paused, skipping');
      return;
    }

    // Atomic lock - only one auto-save can run at a time
    if (globalAutoSaveInProgress) {
      return;
    }
    globalAutoSaveInProgress = true;

    try {
      const currentState = uiBuilderStore.getState();

      // Multiple guards to prevent auto-save during loading operations
      if (
        isLoadingSavedConfigRef.current ||
        currentState.isLoadingConfiguration ||
        (currentState.loadedConfigurationId && !currentState.selectedNetworkConfigId)
      ) {
        return;
      }

      const configId = currentState.loadedConfigurationId;
      const shouldUpdate = configId !== null;
      const shouldCreate =
        !configId &&
        currentState.selectedEcosystem &&
        currentState.selectedNetworkConfigId &&
        currentState.selectedFunction &&
        currentState.formConfig;

      // Prevent duplicate creation for the same function
      if (shouldCreate && globalLastSavedFunction === currentState.selectedFunction) {
        logger.info(
          'builder',
          `Skipping duplicate auto-save for function: ${currentState.selectedFunction}`
        );
        return;
      }

      if (!shouldUpdate && !shouldCreate) {
        return;
      }

      // Update UI to show saving state
      uiBuilderStore.updateState(() => ({ isAutoSaving: true }));

      // Determine title to use (preserve manual renames)
      let titleToUse: string;
      if (shouldUpdate && configId) {
        const existingConfig = await contractUIStorage.get(configId);
        const isManuallyRenamed = existingConfig?.metadata?.isManuallyRenamed === true;
        titleToUse =
          isManuallyRenamed && existingConfig?.title
            ? existingConfig.title
            : generateDefaultTitle(currentState);
      } else {
        titleToUse = generateDefaultTitle(currentState);
      }

      // Prepare configuration object
      const configToSave = buildConfigurationObject(currentState, titleToUse);

      // Perform save or update operation
      if (configId) {
        logger.info('Auto-save: Updating existing configuration', `ID: ${configId}`);
        await updateContractUI(configId, configToSave);

        if (currentState.loadedConfigurationId !== configId) {
          uiBuilderStore.updateState(() => ({ loadedConfigurationId: configId }));
        }

        toast.success('Configuration saved', {
          duration: 2000,
          description: 'Your changes have been automatically saved.',
        });
      } else {
        logger.info('Auto-save: Creating new configuration', 'Creating new record');
        const id = await saveContractUI(configToSave);
        uiBuilderStore.updateState(() => ({ loadedConfigurationId: id }));
        globalLastSavedFunction = currentState.selectedFunction;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Auto-save failed', errorMessage);
      toast.error('Auto-save failed', {
        description: 'Your changes could not be saved. Please try again.',
      });
    } finally {
      uiBuilderStore.updateState(() => ({ isAutoSaving: false }));
      globalAutoSaveInProgress = false;
    }
  }, [isLoadingSavedConfigRef, saveContractUI, updateContractUI]);

  /**
   * Effect that handles auto-save scheduling with debouncing and various guards.
   */
  useEffect(() => {
    // Only schedule auto-save if we have required state
    if (!state.selectedFunction || !state.formConfig || globalAutoSavePaused) {
      return;
    }

    // Skip one scheduling cycle after resuming from load to prevent immediate auto-save
    if (globalSkipNextCycle) {
      logger.info('builder', 'Skipping auto-save cycle - just resumed from load');
      globalSkipNextCycle = false;
      return;
    }

    // Clear any existing timer
    if (globalAutoSaveTimer) {
      clearTimeout(globalAutoSaveTimer);
      globalAutoSaveTimer = null;
    }

    // Skip if this function was already saved (prevents duplicate creation)
    const currentState = uiBuilderStore.getState();
    const isAlreadySaved =
      !currentState.loadedConfigurationId && globalLastSavedFunction === state.selectedFunction;

    if (isAlreadySaved) {
      return;
    }

    // Schedule debounced auto-save
    globalAutoSaveTimer = setTimeout(() => {
      void autoSave();
    }, 1500);
  }, [state.selectedFunction, state.formConfig, autoSave]);

  /**
   * Reset tracking when function changes to allow new saves.
   */
  useEffect(() => {
    if (state.selectedFunction !== globalLastSavedFunction && globalLastSavedFunction !== null) {
      globalLastSavedFunction = null;
      globalAutoSaveInProgress = false;
    }
  }, [state.selectedFunction]);

  /**
   * Cleanup timer on unmount.
   */
  useEffect(() => {
    return () => {
      if (globalAutoSaveTimer) {
        clearTimeout(globalAutoSaveTimer);
        globalAutoSaveTimer = null;
      }
    };
  }, []);

  /**
   * Pauses auto-save and clears any pending timers.
   * Use this when loading configurations to prevent auto-save corruption.
   */
  const pause = useCallback(() => {
    logger.info('builder', 'Auto-save paused');
    globalAutoSavePaused = true;

    if (globalAutoSaveTimer) {
      clearTimeout(globalAutoSaveTimer);
      globalAutoSaveTimer = null;
      logger.info('builder', 'Cleared existing auto-save timer');
    }
  }, []);

  /**
   * Resumes auto-save functionality.
   * Sets a flag to skip the next scheduling cycle to prevent immediate auto-save.
   */
  const resume = useCallback(() => {
    logger.info('builder', 'Auto-save resumed');
    globalAutoSavePaused = false;
    globalSkipNextCycle = true; // Prevent immediate auto-save after resume
  }, []);

  return {
    pause,
    resume,
    isPaused: globalAutoSavePaused,
  };
}

/**
 * Generates a default title for the configuration based on current state.
 */
function generateDefaultTitle(state: ReturnType<typeof uiBuilderStore.getState>): string {
  return (
    state.formConfig?.title ||
    `${state.contractAddress?.slice(0, 6) || 'New'}...${
      state.contractAddress?.slice(-4) || 'UI'
    } - ${state.selectedFunction || 'Contract'}`
  );
}

/**
 * Builds a complete configuration object for saving.
 */
function buildConfigurationObject(
  state: ReturnType<typeof uiBuilderStore.getState>,
  title: string
) {
  const formConfig = {
    ...state.formConfig,
    id: state.formConfig?.functionId || 'new',
    title: state.formConfig?.title || 'Contract UI Form',
    functionId: state.selectedFunction || '',
    contractAddress: state.contractAddress || '',
    fields: state.formConfig?.fields || [],
    layout: state.formConfig?.layout || {
      columns: 1 as const,
      spacing: 'normal' as const,
      labelPosition: 'top' as const,
    },
    validation: state.formConfig?.validation || {
      mode: 'onChange' as const,
      showErrors: 'inline' as const,
    },
    submitButton: {
      text: 'Submit',
      loadingText: 'Processing...',
      position: 'right' as const,
    },
    theme: state.formConfig?.theme || {},
    description: state.formConfig?.description || '',
  };

  return {
    title,
    ecosystem: state.selectedEcosystem || 'evm',
    networkId: state.selectedNetworkConfigId || '',
    contractAddress: state.contractAddress || '',
    functionId: state.selectedFunction || '',
    formConfig,
    executionConfig: state.formConfig?.executionConfig,
    uiKitConfig: state.formConfig?.uiKitConfig,
  };
}
