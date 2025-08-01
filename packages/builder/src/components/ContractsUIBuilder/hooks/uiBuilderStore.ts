import { createStore } from 'zustand/vanilla';

import {
  ContractDefinitionMetadata,
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

import { BuilderFormConfig } from '../../../core/types/FormTypes';
import { contractDefinitionService } from '../../../services/ContractDefinitionService';
import { STEP_INDICES } from '../constants/stepIndices';

export interface ContractState {
  schema: ContractSchema | null;
  address: string | null;
  formValues: FormValues | null;
  definitionJson: string | null; // TODO: might need to rename this, cause other adapters might have non-json definitions
  definitionOriginal: string | null;
  source: 'fetched' | 'manual' | 'hybrid' | null;
  metadata: ContractDefinitionMetadata | null;
  error: string | null;
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

  // Contract state
  contractState: ContractState;

  // Function selection state
  selectedFunction: string | null;
  formConfig: BuilderFormConfig | null;
  isExecutionStepValid: boolean;

  // Loading states
  isLoadingConfiguration: boolean;
  isSchemaLoading: boolean;
  isAutoSaving: boolean;
  exportLoading: boolean;
  needsContractDefinitionLoad: boolean;

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
    fromStep: 'ecosystem' | 'network' | 'contract' | 'function',
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
      // Add contract definition fields
      contractDefinition?: string;
      contractDefinitionOriginal?: string;
      contractDefinitionSource?: 'fetched' | 'manual' | 'hybrid';
      contractDefinitionMetadata?: ContractDefinitionMetadata;
    }
  ) => void;
  setManualContractDefinition: (definition: string) => void;
  clearManualContractDefinition: () => void;
  setContractDefinitionResult: (result: {
    schema: ContractSchema;
    formValues: FormValues;
    source: 'fetched' | 'manual' | 'hybrid';
    metadata: ContractDefinitionMetadata;
    original: string;
  }) => void;
  setContractDefinitionError: (error: string) => void;
}

const initialContractState: ContractState = {
  schema: null,
  address: null,
  formValues: null,
  definitionJson: null,
  definitionOriginal: null,
  source: null,
  metadata: null,
  error: null,
};

const initialState: UIBuilderState = {
  selectedNetworkConfigId: null,
  selectedEcosystem: 'evm',
  pendingNetworkId: null,
  networkToSwitchTo: null,
  currentStepIndex: 0,
  uiState: {},
  contractState: initialContractState,
  selectedFunction: null,
  formConfig: null,
  isExecutionStepValid: false,
  isLoadingConfiguration: false,
  isSchemaLoading: false,
  isAutoSaving: false,
  exportLoading: false,
  needsContractDefinitionLoad: false,
  loadedConfigurationId: null,
  isInNewUIMode: false,
};

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
      fromStep: 'ecosystem' | 'network' | 'contract' | 'function',
      preserveFunctionConfig: boolean = false
    ) => {
      let resetState: Partial<UIBuilderState> = {};

      if (fromStep === 'ecosystem' || fromStep === 'network') {
        resetState = {
          ...resetState,
          contractState: initialContractState,
          pendingNetworkId: null,
        };
      }

      if (fromStep === 'ecosystem' || fromStep === 'network' || fromStep === 'contract') {
        resetState = { ...resetState, selectedFunction: null };
      }
      if (
        fromStep === 'ecosystem' ||
        fromStep === 'network' ||
        fromStep === 'contract' ||
        fromStep === 'function'
      ) {
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
      set({
        ...initialState,
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
        contractDefinition?: string;
        contractDefinitionOriginal?: string;
        contractDefinitionSource?: 'fetched' | 'manual' | 'hybrid';
        contractDefinitionMetadata?: ContractDefinitionMetadata;
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

      if (savedConfig.contractAddress && savedConfig.networkId) {
        contractDefinitionService.reset(savedConfig.networkId, savedConfig.contractAddress);
      }

      set({
        selectedEcosystem: savedConfig.ecosystem,
        selectedNetworkConfigId: savedConfig.networkId,
        networkToSwitchTo: savedConfig.networkId,
        contractState: {
          ...initialContractState,
          address: savedConfig.contractAddress,
          definitionJson: savedConfig.contractDefinition || null,
          definitionOriginal: savedConfig.contractDefinitionOriginal || null,
          source: savedConfig.contractDefinitionSource || null,
          metadata: savedConfig.contractDefinitionMetadata || null,
          formValues: (() => {
            const formValues: FormValues = {
              contractAddress: savedConfig.contractAddress,
            };
            if (
              (savedConfig.contractDefinitionSource === 'manual' ||
                savedConfig.contractDefinitionSource === 'hybrid') &&
              savedConfig.contractDefinition
            ) {
              try {
                formValues.contractDefinition = JSON.stringify(
                  JSON.parse(savedConfig.contractDefinition),
                  null,
                  2
                );
              } catch {
                formValues.contractDefinition = savedConfig.contractDefinition;
              }
            }
            return formValues;
          })(),
        },
        selectedFunction: savedConfig.functionId,
        formConfig: {
          ...savedConfig.formConfig,
          executionConfig: savedConfig.executionConfig,
          uiKitConfig: savedConfig.uiKitConfig,
        },
        currentStepIndex: targetStepIndex,
        isExecutionStepValid: !!savedConfig.executionConfig,
        needsContractDefinitionLoad: !!savedConfig.contractDefinition,
        loadedConfigurationId: id,
        isInNewUIMode: false,
      });
    },

    setManualContractDefinition: (definition: string) => {
      set((state) => ({
        contractState: {
          ...state.contractState,
          definitionJson: definition,
          source: 'manual',
          schema: null,
          error: null,
          formValues: {
            ...state.contractState.formValues,
            contractDefinition: definition,
          },
        },
        needsContractDefinitionLoad: true,
      }));
    },

    clearManualContractDefinition: () => {
      set((state) => ({
        contractState: {
          ...state.contractState,
          definitionJson: null,
          source: null,
          schema: null,
          error: null,
          formValues: {
            ...state.contractState.formValues,
            contractDefinition: undefined,
          },
        },
      }));
    },

    setContractDefinitionResult: (result) => {
      const currentState = get();
      let finalMetadata = result.metadata;

      if (
        result.source === 'manual' &&
        result.metadata.verificationStatus === 'unknown' &&
        currentState.contractState.metadata?.verificationStatus === 'unverified'
      ) {
        finalMetadata = { ...result.metadata, verificationStatus: 'unverified' };
      }

      set({
        contractState: {
          schema: result.schema,
          formValues: result.formValues,
          source: result.source,
          metadata: finalMetadata,
          address: result.schema?.address || null,
          error: null,
          definitionOriginal:
            result.source === 'fetched' || !currentState.contractState.definitionOriginal
              ? result.original
              : currentState.contractState.definitionOriginal,
          definitionJson: currentState.contractState.definitionJson, // Keep existing json
        },
        needsContractDefinitionLoad: false,
      });
    },

    setContractDefinitionError: (error: string) => {
      set((state) => ({
        contractState: {
          ...state.contractState,
          schema: null,
          error: error,
        },
        needsContractDefinitionLoad: false,
      }));
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
  setManualContractDefinition: uiBuilderStoreVanilla.getState().setManualContractDefinition,
  clearManualContractDefinition: uiBuilderStoreVanilla.getState().clearManualContractDefinition,
  setContractDefinitionResult: uiBuilderStoreVanilla.getState().setContractDefinitionResult,
  setContractDefinitionError: uiBuilderStoreVanilla.getState().setContractDefinitionError,
};
