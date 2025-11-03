import { createStore } from 'zustand/vanilla';

import {
  ContractDefinitionMetadata,
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  ProxyInfo,
  UiKitConfiguration,
} from '@openzeppelin/ui-builder-types';

import { BuilderFormConfig } from '../../../core/types/FormTypes';
import { contractDefinitionService } from '../../../services/ContractDefinitionService';
import { STEP_INDICES } from '../constants/stepIndices';

export interface ContractState {
  schema: ContractSchema | null;
  address: string | null;
  formValues: FormValues | null;
  definitionJson: string | null; // TODO: might need to rename this, cause other adapters might have non-json definitions
  definitionOriginal: string | null;
  source: 'fetched' | 'manual' | null;
  metadata: ContractDefinitionMetadata | null;
  proxyInfo: ProxyInfo | null;
  error: string | null;
  contractDefinitionArtifacts: Record<string, unknown> | null;
  requiredInputSnapshot: Record<string, unknown> | null;
  requiresManualReload: boolean;
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

  // UI-only flag: true if loaded config contains only a trimmed ZIP (no original)
  isTrimmedArtifactsLoaded: boolean;
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
      contractDefinitionSource?: 'fetched' | 'manual';
      contractDefinitionMetadata?: ContractDefinitionMetadata;
      contractDefinitionArtifacts?: Record<string, unknown>;
    }
  ) => void;
  setManualContractDefinition: (definition: string) => void;
  clearManualContractDefinition: () => void;
  setContractDefinitionResult: (result: {
    schema: ContractSchema;
    formValues: FormValues;
    source: 'fetched' | 'manual';
    metadata: ContractDefinitionMetadata;
    original: string;
    proxyInfo?: ProxyInfo | null;
    contractDefinitionArtifacts?: Record<string, unknown> | null;
    requiredInputSnapshot?: Record<string, unknown> | null;
  }) => void;
  setContractDefinitionError: (error: string) => void;
  acceptCurrentContractDefinition: () => void;
  markManualReloadRequired: () => void;
}

const initialContractState: ContractState = {
  schema: null,
  address: null,
  formValues: null,
  definitionJson: null,
  definitionOriginal: null,
  source: null,
  metadata: null,
  proxyInfo: null,
  error: null,
  contractDefinitionArtifacts: null,
  requiredInputSnapshot: null,
  requiresManualReload: false,
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
  isTrimmedArtifactsLoaded: false,
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
      // Clear any previous contract load state so new wizard starts fresh
      contractDefinitionService.reset();

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
        contractDefinitionSource?: 'fetched' | 'manual';
        contractDefinitionMetadata?: ContractDefinitionMetadata;
        contractDefinitionArtifacts?: Record<string, unknown>;
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

      let targetStepIndex = determineStepFromSavedConfig(savedConfig);

      // If saved record contains only trimmed artifacts (no original ZIP), force user to
      // start at the contract definition step to re-upload the original ZIP.
      const isTrimmedOnly = !!(
        savedConfig.contractDefinitionArtifacts &&
        typeof savedConfig.contractDefinitionArtifacts === 'object' &&
        (savedConfig.contractDefinitionArtifacts as Record<string, unknown>).trimmedZipBase64 &&
        !(savedConfig.contractDefinitionArtifacts as Record<string, unknown>).originalZipData
      );
      if (isTrimmedOnly) {
        // If a function was previously selected, go directly to the form step
        // so the UI renders for that function. Otherwise require re-upload.
        targetStepIndex = savedConfig.functionId
          ? STEP_INDICES.FORM_CUSTOMIZATION
          : STEP_INDICES.CONTRACT_DEFINITION;
      }

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
          contractDefinitionArtifacts: (savedConfig.contractDefinitionArtifacts || null) as Record<
            string,
            unknown
          > | null,
          requiredInputSnapshot: null,
          requiresManualReload: false,
          formValues: (() => {
            const formValues: FormValues = {
              contractAddress: savedConfig.contractAddress,
            };
            if (
              savedConfig.contractDefinitionSource === 'manual' &&
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
            // Rehydrate contract definition artifacts into form values
            // Only map originalZipData into contractArtifactsZip. If only a
            // trimmed ZIP exists, we intentionally DO NOT prefill the file
            // input to force re-upload of the full ZIP.
            const artifacts = savedConfig.contractDefinitionArtifacts;
            if (artifacts && typeof artifacts === 'object') {
              const mapped: Record<string, unknown> = { ...(artifacts as Record<string, unknown>) };
              if (typeof mapped.contractArtifactsZip === 'undefined') {
                const original = mapped.originalZipData as string | undefined;
                const trimmed = mapped.trimmedZipBase64 as string | undefined;
                if (original && typeof original === 'string') {
                  mapped.contractArtifactsZip = original;
                } else if (trimmed && typeof trimmed === 'string' && savedConfig.functionId) {
                  // Allow auto-load from trimmed ZIP only if a function was selected
                  mapped.contractArtifactsZip = trimmed;
                }
              }
              Object.assign(formValues, mapped);
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
        needsContractDefinitionLoad: (() => {
          if (!!savedConfig.contractDefinition) return true;
          const a = savedConfig.contractDefinitionArtifacts as Record<string, unknown> | undefined;
          if (!a) return false;
          const hasOriginal = typeof a.originalZipData === 'string' && !!a.originalZipData;
          const hasTrimmed = typeof a.trimmedZipBase64 === 'string' && !!a.trimmedZipBase64;
          // Auto-load if we have original, or if we have trimmed and a function was saved
          // NOTE: For trimmed-only with functionId, we jump to FORM_CUSTOMIZATION but still need
          // the contract definition to be parsed to populate the schema
          return hasOriginal || (hasTrimmed && !!savedConfig.functionId);
        })(),
        loadedConfigurationId: id,
        isInNewUIMode: false,
        isTrimmedArtifactsLoaded: !!(
          savedConfig.contractDefinitionArtifacts &&
          typeof savedConfig.contractDefinitionArtifacts === 'object' &&
          (savedConfig.contractDefinitionArtifacts as Record<string, unknown>).trimmedZipBase64 &&
          !(savedConfig.contractDefinitionArtifacts as Record<string, unknown>).originalZipData
        ),
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
          requiredInputSnapshot: null,
          requiresManualReload: false,
        },
        needsContractDefinitionLoad: true,
      }));
    },

    clearManualContractDefinition: () => {
      const currentState = get();
      const { address } = currentState.contractState;
      const networkId = currentState.selectedNetworkConfigId;

      // Reset the service state to allow re-fetching
      if (networkId && address) {
        contractDefinitionService.reset(networkId, address);
      }

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
          requiredInputSnapshot: null,
          requiresManualReload: false,
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
          proxyInfo: result.proxyInfo || null,
          error: null,
          definitionOriginal:
            // Preserve existing definitionOriginal when in loaded config mode for comparison
            currentState.loadedConfigurationId && currentState.contractState.definitionOriginal
              ? currentState.contractState.definitionOriginal // Keep stored baseline for comparison
              : result.original, // Normal case: use fresh as baseline
          definitionJson: result.original,
          contractDefinitionArtifacts: result.contractDefinitionArtifacts || null,
          requiredInputSnapshot:
            typeof result.requiredInputSnapshot !== 'undefined'
              ? result.requiredInputSnapshot
              : currentState.contractState.requiredInputSnapshot,
          requiresManualReload: false,
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

    acceptCurrentContractDefinition: () => {
      set((state) => ({
        contractState: {
          ...state.contractState,
          definitionOriginal: state.contractState.definitionJson,
        },
      }));
    },

    markManualReloadRequired: () => {
      const currentState = get();
      if (!currentState.contractState.requiredInputSnapshot) {
        return;
      }

      if (currentState.contractState.requiresManualReload) {
        return;
      }

      set({
        contractState: {
          ...currentState.contractState,
          requiresManualReload: true,
        },
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

// Helper to detect if artifacts are trimmed-only (no original ZIP available)
export const isTrimmedOnlyArtifacts = (state: UIBuilderState): boolean => {
  const artifacts = state.contractState.contractDefinitionArtifacts;
  if (!artifacts || typeof artifacts !== 'object') return false;
  const hasTrimmed = !!(artifacts as Record<string, unknown>)?.['trimmedZipBase64'];
  const hasOriginal = !!(artifacts as Record<string, unknown>)?.['originalZipData'];
  return hasTrimmed && !hasOriginal;
};

export const uiBuilderStore = {
  getState,
  subscribe,
  subscribeWithSelector,
  isTrimmedOnlyArtifacts,
  setInitialState: uiBuilderStoreVanilla.getState().setInitialState,
  updateState: uiBuilderStoreVanilla.getState().updateState,
  resetDownstreamSteps: uiBuilderStoreVanilla.getState().resetDownstreamSteps,
  resetWizard: uiBuilderStoreVanilla.getState().resetWizard,
  loadContractUI: uiBuilderStoreVanilla.getState().loadContractUI,
  setManualContractDefinition: uiBuilderStoreVanilla.getState().setManualContractDefinition,
  clearManualContractDefinition: uiBuilderStoreVanilla.getState().clearManualContractDefinition,
  setContractDefinitionResult: uiBuilderStoreVanilla.getState().setContractDefinitionResult,
  setContractDefinitionError: uiBuilderStoreVanilla.getState().setContractDefinitionError,
  acceptCurrentContractDefinition: uiBuilderStoreVanilla.getState().acceptCurrentContractDefinition,
  markManualReloadRequired: uiBuilderStoreVanilla.getState().markManualReloadRequired,
};
