import { toast } from 'sonner';
import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { contractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { uiBuilderStore, type BuilderFormConfig } from '../uiBuilderStore';

// Global lock to prevent multiple page initializations
let globalPageInitializationInProgress = false;

/**
 * @notice A hook to manage the lifecycle of a UI configuration.
 * @returns An object with functions to create a new contract UI or load an existing one.
 */
export function useBuilderLifecycle(
  isLoadingSavedConfigRef: React.RefObject<boolean>,
  savedConfigIdRef: React.RefObject<string | null>,
  autoSave: { pause: () => void; resume: () => void; isPaused: boolean }
) {
  const { setActiveNetworkId } = useWalletState();

  const handleLoadContractUI = useCallback(
    async (id: string) => {
      try {
        // Pause auto-save during loading to prevent corruption
        autoSave.pause();

        // Check if this configuration is already loaded
        const currentState = uiBuilderStore.getState();
        const currentLoadedId = savedConfigIdRef.current || currentState.loadedConfigurationId;

        if (currentLoadedId === id) {
          logger.info('Configuration already loaded', `ID: ${id}`);
          return;
        }

        // Set loading flags
        isLoadingSavedConfigRef.current = true;
        uiBuilderStore.updateState(() => ({ isLoadingConfiguration: true }));

        // Get the saved contract UI from storage
        const savedUI = await contractUIStorage.get(id);
        if (!savedUI) {
          logger.error('Contract UI not found', `ID: ${id}`);
          toast.error('Configuration not found', {
            description: 'The selected configuration could not be loaded.',
          });
          return;
        }

        // Track the loaded configuration ID for auto-save updates BEFORE any state changes
        savedConfigIdRef.current = id;
        logger.info('Setting savedConfigIdRef', `ID: ${id}`);

        // Create a proper BuilderFormConfig from the saved data
        const formConfig: BuilderFormConfig = {
          ...savedUI.formConfig,
          functionId: savedUI.functionId,
          contractAddress: savedUI.contractAddress,
          executionConfig: savedUI.executionConfig,
          uiKitConfig: savedUI.uiKitConfig,
        };

        // Load the configuration into the store
        uiBuilderStore.loadContractUI(id, {
          ecosystem: savedUI.ecosystem as ContractSchema['ecosystem'],
          networkId: savedUI.networkId,
          contractAddress: savedUI.contractAddress,
          functionId: savedUI.functionId,
          formConfig,
          executionConfig: savedUI.executionConfig,
          uiKitConfig: savedUI.uiKitConfig,
        });

        // Set the active network to trigger wallet connection and network switch
        setActiveNetworkId(savedUI.networkId);

        logger.info('Contract UI loaded', `Title: ${savedUI.title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to load Contract UI', errorMessage);
        toast.error('Failed to load configuration', {
          description: errorMessage,
        });
      } finally {
        // Clear loading state
        uiBuilderStore.updateState(() => ({ isLoadingConfiguration: false }));
        // Clear the loading flag after a delay to ensure all state updates are complete
        setTimeout(() => {
          isLoadingSavedConfigRef.current = false;
          // Resume auto-save after loading is complete
          autoSave.resume();
        }, 1000);
      }
    },
    [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef, autoSave]
  );

  const handleCreateNewContractUI = useCallback(async () => {
    try {
      // Reset the wizard to initial state
      uiBuilderStore.resetWizard();

      // Set up for new UI creation
      uiBuilderStore.updateState(() => ({
        isInNewUIMode: true,
      }));

      // Clear active network and references
      setActiveNetworkId(null);
      savedConfigIdRef.current = null;
      isLoadingSavedConfigRef.current = false;

      // Resume auto-save if it was paused
      autoSave.resume();

      logger.info('Creating new Contract UI', 'Entering new UI mode - no record created yet');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create new Contract UI', errorMessage);
      toast.error('Failed to create new configuration', {
        description: errorMessage,
      });
    }
  }, [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef, autoSave]);

  const handleInitializePageState = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (globalPageInitializationInProgress) {
      logger.info('Page initialization', 'Already in progress, skipping');
      return;
    }

    try {
      globalPageInitializationInProgress = true;

      // Check if we already have a loaded configuration or are in new UI mode
      const currentState = uiBuilderStore.getState();

      if (!currentState.loadedConfigurationId && !currentState.isInNewUIMode) {
        // If no configuration is loaded and we're not in new UI mode,
        // set new UI mode as the default state
        uiBuilderStore.updateState(() => ({
          isInNewUIMode: true,
          loadedConfigurationId: null,
        }));

        logger.info('Page state initialized', 'Set to new UI mode');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize page state', errorMessage);
      // Don't show toast for this - it's a background operation
    } finally {
      globalPageInitializationInProgress = false;
    }
  }, [savedConfigIdRef]);

  const handleResetAfterDelete = useCallback(() => {
    try {
      uiBuilderStore.resetWizard();
      setActiveNetworkId(null);
      savedConfigIdRef.current = null;
      isLoadingSavedConfigRef.current = false;
      autoSave.resume();
      logger.info(
        'Wizard reset after delete',
        'State cleared, initialization will handle new UI mode setup'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to reset after delete', errorMessage);
      toast.error('Failed to reset wizard', {
        description: errorMessage,
      });
    }
  }, [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef, autoSave]);

  return {
    load: handleLoadContractUI,
    createNew: handleCreateNewContractUI,
    resetAfterDelete: handleResetAfterDelete,
    initializePageState: handleInitializePageState,
  };
}
