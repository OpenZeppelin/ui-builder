import { toast } from 'sonner';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import {
  contractUIStorage,
  useContractUIStorage,
} from '@openzeppelin/contracts-ui-builder-storage';
import {
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { loadContractDefinition } from '../../../services/ContractLoader';

import { type BuilderFormConfig, uiBuilderStore } from './uiBuilderStore';
import { useCompleteStepState } from './useCompleteStepState';
import { useContractWidgetState } from './useContractWidgetState';

// Step indices for the wizard navigation
const STEP_INDICES = {
  CHAIN_SELECT: 0,
  CONTRACT_DEFINITION: 1,
  FUNCTION_SELECTOR: 2,
  FORM_CUSTOMIZATION: 3,
  COMPLETE: 4,
} as const;

/**
 * Coordinating hook that uses an external store to manage builder state.
 * This ensures state persists across component re-mounts.
 */
export function useUIBuilderState() {
  const state = useSyncExternalStore(uiBuilderStore.subscribe, uiBuilderStore.getState);
  const {
    setActiveNetworkId,
    activeNetworkConfig,
    activeAdapter,
    isAdapterLoading,
    reconfigureActiveAdapterUiKit,
  } = useWalletState();

  // Add storage hook for saving operations
  const { saveContractUI, updateContractUI } = useContractUIStorage();

  // Refs for debouncing auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedConfigIdRef = useRef<string | null>(null);
  const isLoadingSavedConfigRef = useRef<boolean>(false);

  /**
   * Generic auto-save function that captures the complete application state.
   * This function is triggered by ANY configuration change to ensure all user
   * modifications are persisted automatically.
   *
   * Auto-save is triggered when:
   * - Form configuration changes (fields, layout, validation, etc.)
   * - Execution configuration changes (EOA, Relayer settings)
   * - UI Kit configuration changes (wallet UI preferences)
   * - Function selection changes
   * - Any other configuration that affects the final exported form
   *
   * The save is debounced by 1.5 seconds to avoid excessive saves during rapid changes.
   * All configuration data is captured in a single save operation to ensure consistency.
   */
  const triggerAutoSave = useCallback(() => {
    // Don't auto-save while loading a saved configuration
    if (isLoadingSavedConfigRef.current) {
      logger.info('Skipping auto-save during configuration loading', 'Loading in progress');
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set up debounced auto-save (1.5 seconds delay)
    autoSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        const currentState = uiBuilderStore.getState();

        // Use the ref first, then fall back to store's loadedConfigurationId
        const configId = savedConfigIdRef.current || currentState.loadedConfigurationId;

        // If we have a saved config ID, update it regardless of completeness
        const shouldUpdate = configId !== null;

        // Only create a new config if we have meaningful data (at least function selected)
        const shouldCreate =
          !configId &&
          currentState.selectedEcosystem &&
          currentState.selectedNetworkConfigId &&
          currentState.selectedFunction && // Require function to be selected
          currentState.formConfig; // Require form config to exist

        if (shouldUpdate || shouldCreate) {
          try {
            // Set auto-saving state
            uiBuilderStore.updateState(() => ({ isAutoSaving: true }));

            // Convert BuilderFormConfig to RenderFormSchema format
            const formConfig = {
              ...currentState.formConfig,
              id: currentState.formConfig?.functionId || 'new',
              title: currentState.formConfig?.title || 'Contract UI Form',
              functionId: currentState.selectedFunction || '',
              contractAddress: currentState.contractAddress || '',
              fields: currentState.formConfig?.fields || [],
              layout: currentState.formConfig?.layout || {
                columns: 1 as const,
                spacing: 'normal' as const,
                labelPosition: 'top' as const,
              },
              validation: currentState.formConfig?.validation || {
                mode: 'onChange' as const,
                showErrors: 'inline' as const,
              },
              submitButton: {
                text: 'Submit',
                loadingText: 'Processing...',
                position: 'right' as const,
              },
              theme: currentState.formConfig?.theme || {},
              description: currentState.formConfig?.description || '',
            };

            const configToSave = {
              title:
                currentState.formConfig?.title ||
                `${currentState.contractAddress?.slice(0, 6) || 'New'}...${currentState.contractAddress?.slice(-4) || 'UI'} - ${currentState.selectedFunction || 'Contract'}`,
              ecosystem: currentState.selectedEcosystem || 'evm',
              networkId: currentState.selectedNetworkConfigId || '',
              contractAddress: currentState.contractAddress || '',
              functionId: currentState.selectedFunction || '',
              formConfig,
              executionConfig: currentState.formConfig?.executionConfig,
              uiKitConfig: currentState.formConfig?.uiKitConfig,
            };

            if (configId) {
              // Update existing configuration
              logger.info(
                'Auto-save: Updating existing configuration',
                `ID: ${configId}, Title: ${configToSave.title}`
              );
              await updateContractUI(configId, configToSave);
              logger.info('Auto-save updated', `ID: ${configId}`);
              // Ensure both ref and store are in sync
              savedConfigIdRef.current = configId;
              if (currentState.loadedConfigurationId !== configId) {
                uiBuilderStore.updateState(() => ({ loadedConfigurationId: configId }));
              }
              // Show subtle success feedback - only for updates, not initial save
              toast.success('Configuration saved', {
                duration: 2000,
                description: 'Your changes have been automatically saved.',
              });
            } else {
              // Save new configuration
              logger.info(
                'Auto-save: Creating new configuration',
                `No savedConfigIdRef found. Title: ${configToSave.title}, Function: ${currentState.selectedFunction}`
              );
              const id = await saveContractUI(configToSave);
              savedConfigIdRef.current = id;
              uiBuilderStore.updateState(() => ({ loadedConfigurationId: id }));
              logger.info('Auto-save created', `ID: ${id}`);
              // Don't show toast for initial auto-save to avoid noise
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Auto-save failed', errorMessage);
            // Show error feedback to user
            toast.error('Auto-save failed', {
              description: 'Your changes could not be saved. Please try again.',
            });
          } finally {
            // Clear auto-saving state
            uiBuilderStore.updateState(() => ({ isAutoSaving: false }));
          }
        }
      })();
    }, 1500); // 1.5 second debounce
  }, [saveContractUI, updateContractUI]);

  // Initialize the store with the active network from the wallet context on first load.
  useEffect(() => {
    uiBuilderStore.setInitialState({ selectedNetworkConfigId: activeNetworkConfig?.id || null });
  }, []); // Run only once

  const onStepChange = useCallback(
    (index: number) => {
      uiBuilderStore.updateState(() => ({ currentStepIndex: index }));

      // Clear network selection when going back to the first step
      if (index === STEP_INDICES.CHAIN_SELECT) {
        setActiveNetworkId(null);
        uiBuilderStore.updateState(() => ({ selectedNetworkConfigId: null }));
        uiBuilderStore.resetDownstreamSteps('network');
        // Only reset saved configuration ID when starting fresh, not when loading
        if (!isLoadingSavedConfigRef.current) {
          savedConfigIdRef.current = null;
          uiBuilderStore.updateState(() => ({ loadedConfigurationId: null }));
        }
      }

      // Note: We don't clear function selection when going back to step 2
      // to preserve user progress. The UI will visually hide the selection
      // but keep the data intact.
    },
    [setActiveNetworkId]
  );

  const handleNetworkSelect = useCallback(
    async (ecosystem: Ecosystem, networkId: string | null) => {
      const previousNetworkId = state.selectedNetworkConfigId;
      const isChangingNetwork = previousNetworkId !== null && previousNetworkId !== networkId;

      uiBuilderStore.updateState(() => ({
        selectedNetworkConfigId: networkId,
        selectedEcosystem: ecosystem,
        pendingNetworkId: networkId,
        networkToSwitchTo: networkId, // Mark for network switch
      }));

      // Only reset downstream steps if we're actually changing networks
      if (isChangingNetwork) {
        uiBuilderStore.resetDownstreamSteps('network');
      }

      // Set the network ID and trigger adapter loading
      setActiveNetworkId(networkId);
    },
    [setActiveNetworkId]
  );

  // Auto-advance to next step when adapter is ready after network selection
  // This effect coordinates the timing between:
  // 1. Network selection (sets pendingNetworkId)
  // 2. Adapter loading (async operation)
  // 3. Step navigation (happens after adapter is ready)
  // 4. Wallet network switching (handled by NetworkSwitchManager in the component)
  useEffect(() => {
    const currentState = uiBuilderStore.getState();

    logger.info(
      'useUIBuilderState',
      `Auto-advance effect check - pendingNetworkId: ${currentState.pendingNetworkId}, activeAdapter: ${!!activeAdapter}, isAdapterLoading: ${isAdapterLoading}, adapterId: ${activeAdapter?.networkConfig?.id}, currentStep: ${currentState.currentStepIndex}`
    );

    if (
      currentState.pendingNetworkId &&
      activeAdapter &&
      !isAdapterLoading &&
      activeAdapter.networkConfig.id === currentState.pendingNetworkId &&
      currentState.currentStepIndex === STEP_INDICES.CHAIN_SELECT
    ) {
      logger.info(
        'useUIBuilderState',
        `Auto-advancing to next step after adapter ready for network: ${currentState.pendingNetworkId}`
      );

      // Clear the pending network and advance to next step
      uiBuilderStore.updateState(() => ({
        pendingNetworkId: null,
        currentStepIndex: STEP_INDICES.CONTRACT_DEFINITION,
      }));
    }
  }, [activeAdapter, isAdapterLoading]);

  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      const currentState = uiBuilderStore.getState();

      uiBuilderStore.updateState(() => ({
        contractSchema: schema,
        contractAddress: schema?.address ?? null,
        contractFormValues: formValues || null,
      }));

      // Only reset downstream steps if we're not loading a saved configuration
      // (i.e., if there's no selected function already)
      if (!currentState.selectedFunction) {
        uiBuilderStore.resetDownstreamSteps('contract');
      }
    },
    []
  );

  const handleFunctionSelected = useCallback(
    (functionId: string | null) => {
      const currentState = uiBuilderStore.getState();
      const previousFunctionId = currentState.selectedFunction;
      const isSameFunctionWithExistingConfig =
        previousFunctionId === functionId && functionId !== null && !!currentState.formConfig;

      // Update the store
      uiBuilderStore.updateState((s) => {
        const newState = { ...s, selectedFunction: functionId };
        return newState;
      });

      // Only reset downstream steps if we're selecting a different function
      // Preserve form config if it's the same function
      if (functionId !== null) {
        uiBuilderStore.resetDownstreamSteps('function', isSameFunctionWithExistingConfig);

        // Auto-advance to form customization step when a function is selected
        if (currentState.currentStepIndex === STEP_INDICES.FUNCTION_SELECTOR) {
          logger.info(
            'useUIBuilderState',
            `Auto-advancing to form customization after function selected: ${functionId}`
          );
          uiBuilderStore.updateState(() => ({
            currentStepIndex: STEP_INDICES.FORM_CUSTOMIZATION,
          }));
        }

        // Trigger auto-save when a function is selected
        // This ensures we save as soon as the user makes a meaningful selection
        triggerAutoSave();
      }
    },
    [triggerAutoSave]
  );

  const handleFormConfigUpdated = useCallback(
    (config: Partial<BuilderFormConfig>) => {
      // Update the state immediately
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig ? { ...s.formConfig, ...config } : (config as BuilderFormConfig),
      }));

      // Trigger the generic auto-save
      triggerAutoSave();
    },
    [triggerAutoSave]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isValid: boolean) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig
          ? { ...s.formConfig, executionConfig: execConfig }
          : s.selectedFunction && s.contractAddress
            ? {
                functionId: s.selectedFunction,
                contractAddress: s.contractAddress,
                fields: [],
                layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
                validation: { mode: 'onChange', showErrors: 'inline' },
                executionConfig: execConfig,
              }
            : s.formConfig,
        isExecutionStepValid: isValid,
      }));

      // Trigger auto-save whenever execution config changes
      triggerAutoSave();
    },
    [triggerAutoSave]
  );

  const handleUiKitConfigUpdated = useCallback(
    (uiKitConfig: UiKitConfiguration) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig ? { ...s.formConfig, uiKitConfig } : null,
      }));
      // Also trigger the global reconfiguration to update the header, etc.
      reconfigureActiveAdapterUiKit(uiKitConfig);

      // Trigger auto-save whenever UI kit config changes
      triggerAutoSave();
    },
    [reconfigureActiveAdapterUiKit, triggerAutoSave]
  );

  // Load contract schema when adapter is ready and needsContractSchemaLoad is true
  useEffect(() => {
    const loadSchemaIfNeeded = async () => {
      if (
        activeAdapter &&
        state.needsContractSchemaLoad &&
        state.contractFormValues &&
        state.selectedNetworkConfigId === activeAdapter.networkConfig.id
      ) {
        try {
          logger.info('useUIBuilderState', `Loading contract schema for saved configuration`);

          const schema = await loadContractDefinition(activeAdapter, state.contractFormValues);
          if (schema) {
            handleContractSchemaLoaded(schema, state.contractFormValues);
          }

          // Clear the flag after loading
          uiBuilderStore.updateState(() => ({ needsContractSchemaLoad: false }));
        } catch (error) {
          logger.error('useUIBuilderState', 'Failed to load contract schema:', error);
          toast.error('Failed to load contract', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
          // Clear the flag even on error to prevent infinite retries
          uiBuilderStore.updateState(() => ({ needsContractSchemaLoad: false }));
        }
      }
    };

    void loadSchemaIfNeeded();
  }, [
    activeAdapter,
    state.needsContractSchemaLoad,
    state.contractFormValues,
    state.selectedNetworkConfigId,
    handleContractSchemaLoaded,
  ]);

  // Other hooks that manage transient/UI state can remain here
  const contractWidget = useContractWidgetState();
  const completeStep = useCompleteStepState();

  const sidebarWidget =
    state.contractSchema && state.contractAddress && activeAdapter && activeNetworkConfig
      ? contractWidget.createWidgetProps(
          state.contractSchema,
          state.contractAddress,
          activeAdapter,
          activeNetworkConfig
        )
      : null;

  const handleExportApp = useCallback(() => {
    if (!activeNetworkConfig || !activeAdapter || !state.selectedFunction) return;
    void completeStep.exportApp(
      state.formConfig,
      activeNetworkConfig,
      state.selectedFunction,
      state.contractSchema
    );
  }, [completeStep, state, activeNetworkConfig, activeAdapter]);

  const clearNetworkToSwitchTo = useCallback(() => {
    uiBuilderStore.updateState(() => ({ networkToSwitchTo: null }));
  }, []);

  const handleLoadContractUI = useCallback(
    async (id: string) => {
      try {
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
        }, 1000);
      }
    },
    [setActiveNetworkId]
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

    logger.info('Creating new Contract UI', 'Wizard reset to initial state');
  }, [setActiveNetworkId]);

  return {
    ...state,
    selectedNetwork: activeNetworkConfig,
    selectedAdapter: activeAdapter,
    adapterLoading: isAdapterLoading,
    sidebarWidget,
    exportLoading: completeStep.loading,
    isWidgetVisible: contractWidget.isWidgetVisible,
    onStepChange,
    handleNetworkSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    toggleWidget: contractWidget.toggleWidget,
    exportApp: handleExportApp,
    clearNetworkToSwitchTo,
    handleUiKitConfigUpdated,
    handleLoadContractUI,
    handleCreateNewContractUI,
    isLoadingConfiguration: state.isLoadingConfiguration,
    isAutoSaving: state.isAutoSaving,
  };
}
