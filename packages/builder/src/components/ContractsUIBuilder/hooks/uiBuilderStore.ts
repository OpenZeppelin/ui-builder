import { createStore } from 'zustand/vanilla';

import {
  CommonFormProperties,
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

import { STEP_INDICES } from '../constants/stepIndices';

export interface BuilderFormConfig extends CommonFormProperties {
  functionId: string;
  contractAddress: string;
  title?: string;
  description?: string;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
}

export interface UIBuilderState {
  // UI state that doesn't persist across sessions
  uiState: Record<string, unknown>;

  // Network and adapter state
  selectedNetworkConfigId: string | null;
  selectedEcosystem: Ecosystem | null;
  pendingNetworkId: string | null; // Track network that's being loaded for auto-advance
  networkToSwitchTo: string | null; // Track network that needs wallet switch

  // Step navigation
  currentStepIndex: number;

  // Contract definition state
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  contractFormValues: FormValues | null;

  // Function selection state
  selectedFunction: string | null;
  formConfig: BuilderFormConfig | null;
  isExecutionStepValid: boolean;

  // Loading states
  isLoadingConfiguration: boolean;
  isAutoSaving: boolean;
  needsContractSchemaLoad: boolean;

  // Track the loaded configuration ID
  loadedConfigurationId: string | null;

  // Track if we're in new UI mode (creating new UI vs loading existing)
  isInNewUIMode: boolean;
}

// For clarity, we can define actions separately from the state.
export interface UIBuilderActions {
  setInitialState: (initialState: Partial<UIBuilderState>) => void;
  updateState: (updater: (currentState: UIBuilderState) => Partial<UIBuilderState>) => void;
  resetDownstreamSteps: (
    fromStep: 'network' | 'contract' | 'function',
    preserveFunctionConfig?: boolean
  ) => void;
  resetWizard: () => void;
  loadContractUI: (
    id: string,
    savedConfig: {
      ecosystem: Ecosystem;
      networkId: string;
      contractAddress: string;
      functionId: string;
      formConfig: BuilderFormConfig;
      executionConfig?: ExecutionConfig;
      uiKitConfig?: UiKitConfiguration;
    }
  ) => void;
}

const initialState: UIBuilderState = {
  selectedNetworkConfigId: null,
  selectedEcosystem: 'evm',
  pendingNetworkId: null,
  networkToSwitchTo: null,
  currentStepIndex: 0,
  uiState: {},
  contractSchema: null,
  contractAddress: null,
  contractFormValues: null,
  selectedFunction: null,
  formConfig: null,
  isExecutionStepValid: false,
  isLoadingConfiguration: false,
  isAutoSaving: false,
  needsContractSchemaLoad: false,
  loadedConfigurationId: null,
  isInNewUIMode: false,
};

/**
 * A vanilla Zustand store for the UI builder state.
 */
export const uiBuilderStoreVanilla = createStore<UIBuilderState & UIBuilderActions>()(
  (set, get) => ({
    ...initialState,

    setInitialState: (initialState) => {
      set(initialState);
    },

    updateState: (updater) => {
      set(updater(get()));
    },

    resetDownstreamSteps: (
      fromStep: 'network' | 'contract' | 'function',
      preserveFunctionConfig: boolean = false
    ) => {
      let resetState: Partial<UIBuilderState> = {};
      if (fromStep === 'network') {
        resetState = {
          ...resetState,
          contractSchema: null,
          contractAddress: null,
          contractFormValues: null,
          pendingNetworkId: null, // Clear pending network when network changes
        };
      }
      if (fromStep === 'network' || fromStep === 'contract') {
        resetState = { ...resetState, selectedFunction: null };
      }
      if (fromStep === 'network' || fromStep === 'contract' || fromStep === 'function') {
        // Only reset formConfig if not preserving or if it's for a different function
        if (!preserveFunctionConfig) {
          resetState = {
            ...resetState,
            formConfig: null,
            isExecutionStepValid: false,
          };
        }
      }
      set(resetState);
    },

    resetWizard: () => {
      // Reset to initial state while preserving loading states
      set({
        ...initialState,
        // Preserve UI state and loading states if needed, but a full reset is cleaner.
        uiState: {},
        isLoadingConfiguration: get().isLoadingConfiguration,
        isAutoSaving: get().isAutoSaving,
      });
    },

    loadContractUI: (
      id: string,
      savedConfig: {
        ecosystem: Ecosystem;
        networkId: string;
        contractAddress: string;
        functionId: string;
        formConfig: BuilderFormConfig;
        executionConfig?: ExecutionConfig;
        uiKitConfig?: UiKitConfiguration;
      }
    ) => {
      const determineStepFromSavedConfig = (config: typeof savedConfig): number => {
        const hasNetwork = config.ecosystem && config.networkId;
        const hasContract = config.contractAddress;
        const hasFunction = config.functionId;

        if (!hasNetwork) return STEP_INDICES.CHAIN_SELECT;
        if (!hasContract) return STEP_INDICES.CONTRACT_DEFINITION;
        if (!hasFunction) return STEP_INDICES.FUNCTION_SELECTOR;

        return STEP_INDICES.FORM_CUSTOMIZATION;
      };

      const targetStepIndex = determineStepFromSavedConfig(savedConfig);

      set({
        selectedEcosystem: savedConfig.ecosystem,
        selectedNetworkConfigId: savedConfig.networkId,
        networkToSwitchTo: savedConfig.networkId,
        contractAddress: savedConfig.contractAddress,
        selectedFunction: savedConfig.functionId,
        formConfig: {
          ...savedConfig.formConfig,
          executionConfig: savedConfig.executionConfig,
          uiKitConfig: savedConfig.uiKitConfig,
        },
        currentStepIndex: targetStepIndex,
        isExecutionStepValid: !!savedConfig.executionConfig,
        contractFormValues: {
          contractAddress: savedConfig.contractAddress,
        },
        needsContractSchemaLoad: true,
        contractSchema: null,
        loadedConfigurationId: id,
        isInNewUIMode: false,
      });
    },
  })
);

const { getState, subscribe } = uiBuilderStoreVanilla;

const subscribeWithSelector = <T>(
  selector: (state: UIBuilderState) => T,
  listener: (value: T) => void
) => {
  let lastState = selector(getState());
  const unsub = subscribe((state) => {
    const newState = selector(state);
    if (newState !== lastState) {
      lastState = newState;
      listener(newState);
    }
  });
  return unsub;
};

export const uiBuilderStore = {
  getState,
  subscribe,
  subscribeWithSelector,
  setInitialState: uiBuilderStoreVanilla.getState().setInitialState,
  updateState: uiBuilderStoreVanilla.getState().updateState,
  resetDownstreamSteps: uiBuilderStoreVanilla.getState().resetDownstreamSteps,
  resetWizard: uiBuilderStoreVanilla.getState().resetWizard,
  loadContractUI: uiBuilderStoreVanilla.getState().loadContractUI,
};
