import {
  CommonFormProperties,
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

export interface BuilderFormConfig extends CommonFormProperties {
  functionId: string;
  contractAddress: string;
  title?: string;
  description?: string;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
}

export interface UIBuilderState {
  // Network and adapter state
  selectedNetworkConfigId: string | null;
  selectedEcosystem: Ecosystem | null;

  // Wizard state
  currentStepIndex: number;

  // Generic bucket for transient UI state that needs to persist across re-mounts
  uiState: Record<string, unknown>;

  // Step-specific data
  contractSchema: ContractSchema | null;
  contractAddress: string | null;
  contractFormValues: FormValues | null;
  selectedFunction: string | null;
  formConfig: BuilderFormConfig | null;
  isExecutionStepValid: boolean;
}

let state: UIBuilderState = {
  selectedNetworkConfigId: null,
  selectedEcosystem: 'evm',
  currentStepIndex: 0,
  uiState: {},
  contractSchema: null,
  contractAddress: null,
  contractFormValues: null,
  selectedFunction: null,
  formConfig: null,
  isExecutionStepValid: false,
};

const listeners = new Set<() => void>();

const emitChange = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const uiBuilderStore = {
  setInitialState(initialState: Partial<UIBuilderState>) {
    state = { ...state, ...initialState };
    // No need to emit change here as it's for initial setup
  },

  getState(): UIBuilderState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  updateState(updater: (currentState: UIBuilderState) => Partial<UIBuilderState>) {
    const changes = updater(state);
    state = { ...state, ...changes };
    emitChange();
  },

  resetDownstreamSteps(
    fromStep: 'network' | 'contract' | 'function',
    preserveFunctionConfig: boolean = false
  ) {
    let resetState: Partial<UIBuilderState> = {};
    if (fromStep === 'network') {
      resetState = {
        ...resetState,
        contractSchema: null,
        contractAddress: null,
        contractFormValues: null,
      };
    }
    if (fromStep === 'network' || fromStep === 'contract') {
      resetState = { ...resetState, selectedFunction: null };
    }
    if (fromStep === 'network' || fromStep === 'contract' || fromStep === 'function') {
      // Only reset formConfig if not preserving or if it's for a different function
      if (!preserveFunctionConfig) {
        resetState = { ...resetState, formConfig: null, isExecutionStepValid: false };
      }
    }
    this.updateState(() => resetState);
  },
};
