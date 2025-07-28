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
}

let state: UIBuilderState = {
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
};

const listeners = new Set<() => void>();

// Optimized batching mechanism
let updateQueue: Array<(state: UIBuilderState) => Partial<UIBuilderState>> = [];
let isProcessingQueue = false;
let batchTimeout: NodeJS.Timeout | null = null;

const processUpdateQueue = () => {
  if (isProcessingQueue || updateQueue.length === 0) return;

  isProcessingQueue = true;

  // Clear any existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  // Use microtask for immediate batching without frame delay
  void Promise.resolve().then(() => {
    const updates = updateQueue;
    updateQueue = [];

    // Apply all updates at once with optimization
    let newState = state;
    const hasChanges = updates.length > 0;

    if (hasChanges) {
      for (const updater of updates) {
        const changes = updater(newState);
        if (Object.keys(changes).length > 0) {
          newState = { ...newState, ...changes };
        }
      }

      // Only update state and emit if there are actual changes
      if (newState !== state) {
        state = newState;

        // Emit change once for all batched updates
        emitChange();
      }
    }

    isProcessingQueue = false;

    // Process any new updates that came in while we were processing
    if (updateQueue.length > 0) {
      processUpdateQueue();
    }
  });
};

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

  /**
   * Subscribe to specific state slices for better performance.
   * Only triggers the listener when the selected value changes.
   */
  subscribeWithSelector<T>(
    selector: (state: UIBuilderState) => T,
    listener: (value: T) => void
  ): () => void {
    let previousValue = selector(state);

    const wrappedListener = () => {
      const currentValue = selector(state);
      // Only trigger if the selected value actually changed
      if (currentValue !== previousValue) {
        previousValue = currentValue;
        listener(currentValue);
      }
    };

    listeners.add(wrappedListener);
    return () => listeners.delete(wrappedListener);
  },

  updateState(updater: (currentState: UIBuilderState) => Partial<UIBuilderState>) {
    updateQueue.push(updater);

    // Debounce rapid successive updates to prevent performance issues
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        // Use microtask for immediate processing (avoid requestIdleCallback complexity)
        void Promise.resolve().then(() => {
          processUpdateQueue();
        });
      }, 0);
    }
  },

  /**
   * Update state immediately without batching. Use sparingly for critical updates.
   */
  updateStateImmediate(updater: (currentState: UIBuilderState) => Partial<UIBuilderState>) {
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
        pendingNetworkId: null, // Clear pending network when network changes
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

  resetWizard() {
    // Reset to initial state while preserving loading states
    this.updateState(() => ({
      selectedNetworkConfigId: null,
      selectedEcosystem: 'evm',
      pendingNetworkId: null,
      networkToSwitchTo: null,
      currentStepIndex: 0,
      contractSchema: null,
      contractAddress: null,
      contractFormValues: null,
      selectedFunction: null,
      formConfig: null,
      isExecutionStepValid: false,
      // Preserve UI state and loading states
      uiState: {},
      isLoadingConfiguration: false,
      isAutoSaving: false,
      needsContractSchemaLoad: false,
      loadedConfigurationId: null,
    }));
  },

  loadContractUI(
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
  ) {
    // Reset the state and then load the saved configuration
    this.updateState(() => ({
      // Network state
      selectedEcosystem: savedConfig.ecosystem,
      selectedNetworkConfigId: savedConfig.networkId,
      networkToSwitchTo: savedConfig.networkId, // Mark for network switch

      // Contract state
      contractAddress: savedConfig.contractAddress,
      selectedFunction: savedConfig.functionId,

      // Form configuration with all settings
      formConfig: {
        ...savedConfig.formConfig,
        executionConfig: savedConfig.executionConfig,
        uiKitConfig: savedConfig.uiKitConfig,
      },

      // Navigate to form customization step
      currentStepIndex: 3, // STEP_INDICES.FORM_CUSTOMIZATION

      // Mark execution config as valid if it exists
      isExecutionStepValid: !!savedConfig.executionConfig,

      // Store contract form values for loading schema
      contractFormValues: {
        contractAddress: savedConfig.contractAddress,
        // Add any other necessary form values here
      },

      // Set flag to load contract schema after adapter is ready
      needsContractSchemaLoad: true,

      // Contract schema will be loaded after adapter is ready
      contractSchema: null,

      // Store the loaded configuration ID
      loadedConfigurationId: id,
    }));
  },
};
