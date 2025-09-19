import { toast } from 'sonner';
import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { contractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';
import { ContractSchema, type Ecosystem } from '@openzeppelin/contracts-ui-builder-types';
import { logger, parseDeepLink, routerService } from '@openzeppelin/contracts-ui-builder-utils';

import { resolveNetworkIdFromDeepLink } from '@/core/deeplink/resolveNetwork';
import { getNetworkById } from '@/core/ecosystemManager';
import { BuilderFormConfig } from '@/core/types/FormTypes';

import { uiBuilderStore } from '../uiBuilderStore';

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
          // Pass stored contract definition data (map from storage to UI field names)
          contractDefinition: savedUI.contractDefinition, // Storage uses 'contractDefinition', UI expects 'contractDefinition'
          contractDefinitionOriginal: savedUI.contractDefinitionOriginal,
          contractDefinitionSource: savedUI.contractDefinitionSource,
          contractDefinitionMetadata: savedUI.contractDefinitionMetadata,
        });

        // Set the active network to trigger wallet connection and network switch
        setActiveNetworkId(savedUI.networkId);

        logger.info('Contract UI loaded', `Title: ${savedUI.title}`);
        return savedUI;
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

      // Default to new UI mode if nothing is loaded
      if (!currentState.loadedConfigurationId && !currentState.isInNewUIMode) {
        uiBuilderStore.updateState(() => ({ isInNewUIMode: true, loadedConfigurationId: null }));
        logger.info('Page state initialized', 'Set to new UI mode');
      }

      // Deep-link handling: ecosystem (required) + networkId/chainId + identifier (address) + optional service
      const params = parseDeepLink();
      const urlEcosystem = (params.ecosystem || '').trim();
      const urlNetworkId = params.networkId || params.networkid || null;
      const urlAddress = params.contractAddress || params.address || params.identifier || null;
      const urlForcedService = typeof params.service === 'string' ? params.service : null;
      const urlChainId = params.chainId || null;

      // Require ecosystem for deep link to be considered
      if (!urlEcosystem) {
        logger.info('Deep link', 'ecosystem parameter missing; skipping deep-link handling');
        return;
      }

      // Resolve network using utility (ecosystem-aware, chain-agnostic)
      const resolvedNetworkId = await resolveNetworkIdFromDeepLink(
        urlEcosystem as Ecosystem,
        urlNetworkId,
        urlChainId
      );

      if (resolvedNetworkId && urlAddress) {
        const network = await getNetworkById(resolvedNetworkId);
        if (network) {
          // Select network and set to switch; also set pendingNetworkId so the
          // auto-advance effect moves from CHAIN_SELECT to CONTRACT_DEFINITION
          uiBuilderStore.updateState(() => ({
            selectedNetworkConfigId: network.id,
            networkToSwitchTo: network.id,
            pendingNetworkId: network.id,
          }));
          setActiveNetworkId(network.id);

          // Prefill contract address and trigger loading
          uiBuilderStore.updateState((s) => ({
            contractState: {
              ...s.contractState,
              address: urlAddress,
              // Persist forced provider hint (service) into form values so adapter can honor precedence
              formValues: {
                ...(s.contractState.formValues || {}),
                contractAddress: urlAddress,
                ...(urlForcedService ? { service: urlForcedService } : {}),
              },
              error: null,
            },
            needsContractDefinitionLoad: true,
          }));

          logger.info('Deep link', `Applied deep link for ${network.id} @ ${urlAddress}`);

          // As soon as we consume deep-link params, clear them from the URL
          if (typeof window !== 'undefined' && window.location.search) {
            routerService.navigate(window.location.pathname);
          }
        } else {
          const badId = urlNetworkId || urlChainId || urlEcosystem || 'unknown';
          toast.error('Unsupported network from deep link', {
            description: `Network '${badId}' is not available in this app configuration. Please select a supported network.`,
          });
        }
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
