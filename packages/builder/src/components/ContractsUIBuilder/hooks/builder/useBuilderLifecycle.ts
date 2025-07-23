import { toast } from 'sonner';
import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { contractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { uiBuilderStore, type BuilderFormConfig } from '../uiBuilderStore';

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
          toast.info('Configuration already active', {
            description: 'This configuration is already loaded.',
            duration: 2000,
          });
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
        toast.success('Configuration loaded', {
          description: `Loaded "${savedUI.title}"`,
        });
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

  const handleCreateNewContractUI = useCallback(() => {
    // Reset the wizard to initial state
    uiBuilderStore.resetWizard();

    // Clear the active network
    setActiveNetworkId(null);

    // Clear the saved configuration ID so a new one will be created
    savedConfigIdRef.current = null;

    // Ensure the loading flag is not set
    isLoadingSavedConfigRef.current = false;

    // Resume auto-save if it was paused
    autoSave.resume();

    logger.info('Creating new Contract UI', 'Wizard reset to initial state');
  }, [setActiveNetworkId, isLoadingSavedConfigRef, savedConfigIdRef, autoSave]);

  return {
    load: handleLoadContractUI,
    createNew: handleCreateNewContractUI,
  };
}
