import {
  CommonFormProperties,
  ContractSchema,
  Ecosystem,
  ExecutionConfig,
  FormValues,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';

export interface BuilderFormConfig extends CommonFormProperties {
  functionId: string;
  contractAddress: string;
  title?: string;
  description?: string;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
}

export interface FormBuilderState {
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

let state: FormBuilderState = {
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

export const formBuilderStore = {
  setInitialState(initialState: Partial<FormBuilderState>) {
    state = { ...state, ...initialState };
    // No need to emit change here as it's for initial setup
  },

  getState(): FormBuilderState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  updateState(updater: (currentState: FormBuilderState) => Partial<FormBuilderState>) {
    const changes = updater(state);
    state = { ...state, ...changes };
    emitChange();
  },

  resetDownstreamSteps(fromStep: 'network' | 'contract' | 'function') {
    let resetState: Partial<FormBuilderState> = {};
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
      resetState = { ...resetState, formConfig: null, isExecutionStepValid: false };
    }
    this.updateState(() => resetState);
  },
};
