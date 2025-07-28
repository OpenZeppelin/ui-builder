# State Management Architecture

## Overview

The Contracts UI Builder uses a sophisticated custom state management system built on React's `useSyncExternalStore` hook. This system provides excellent performance, type safety, and developer experience while maintaining zero external dependencies.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Usage Patterns](#usage-patterns)
- [Performance Best Practices](#performance-best-practices)
- [API Reference](#api-reference)
- [Migration Guides](#migration-guides)
- [Future Considerations](#future-considerations)

## Architecture Overview

### State Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│   State Store    │───▶│   Storage       │
│   (React UI)    │    │   (In-memory)    │    │   (IndexedDB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
     Reactivity           State Management        Data Persistence
```

### Key Principles

1. **Single Source of Truth**: All UI state flows through the central store
2. **Optimized Subscriptions**: Components only re-render when their selected data changes
3. **Batched Updates**: Multiple state changes are batched for optimal performance
4. **Type Safety**: Full TypeScript support throughout the system
5. **Zero Dependencies**: Built using only React's native capabilities

### Layer Separation

- **Store Layer**: `uiBuilderStore` - Central state management with batching
- **Selector Layer**: `useBuilderStoreSelector` - Optimized component subscriptions
- **Hook Layer**: `useBuilder*` hooks - Business logic and state coordination
- **Storage Layer**: `@openzeppelin/contracts-ui-builder-storage` - Data persistence

## Core Components

### 1. UIBuilderStore (`uiBuilderStore.ts`)

The central state container that manages all application state.

```typescript
interface UIBuilderState {
  // UI state that doesn't persist across sessions
  uiState: Record<string, unknown>;

  // Network and adapter state
  selectedNetworkConfigId: string | null;
  selectedEcosystem: Ecosystem | null;

  // Contract definition state
  contractSchema: ContractSchema | null;
  contractAddress: string | null;

  // Form configuration
  formConfig: BuilderFormConfig | null;
  selectedFunction: string | null;

  // Loading states
  isLoadingConfiguration: boolean;
  isAutoSaving: boolean;

  // Auto-save coordination
  loadedConfigurationId: string | null;
}
```

**Key Features:**

- **Batched Updates**: Automatically batches multiple state changes for performance
- **Subscription Management**: Efficient listener system with automatic cleanup
- **Type Safety**: Full TypeScript interface with strict typing

### 2. Store Selector (`useBuilderStoreSelector.ts`)

Optimized hook for subscribing to specific slices of state.

```typescript
function useBuilderStoreSelector<T>(selector: (state: UIBuilderState) => T): T;
```

**Benefits:**

- **Selective Updates**: Components only re-render when their data changes
- **Memory Efficiency**: Reduces unnecessary React reconciliation cycles
- **Type Inference**: Automatic TypeScript type inference for selected data
- **Performance**: Uses React 18's `useSyncExternalStore` for optimal performance

### 3. Pre-built Selectors (`storeSelectors`)

Common selector patterns for consistent usage across components.

```typescript
export const storeSelectors = {
  formConfig: (state: UIBuilderState) => state.formConfig,
  autoSaveData: (state: UIBuilderState) => ({
    /* optimized selection */
  }),
  loadingStates: (state: UIBuilderState) => ({
    /* loading flags */
  }),
  coreConfig: (state: UIBuilderState) => ({
    /* essential config */
  }),
  contractData: (state: UIBuilderState) => ({
    /* contract info */
  }),
};
```

## Usage Patterns

### Basic Usage

```typescript
// Simple value selection
function MyComponent() {
  const selectedFunction = useBuilderStoreSelector(state => state.selectedFunction);
  const isLoading = useBuilderStoreSelector(state => state.isLoadingConfiguration);

  if (isLoading) return <div>Loading...</div>;
  return <div>Selected: {selectedFunction}</div>;
}
```

### Complex Object Selection

```typescript
// Select multiple related values
function FormComponent() {
  const formData = useBuilderStoreSelector(state => ({
    title: state.formConfig?.title,
    description: state.formConfig?.description,
    fields: state.formConfig?.fields,
  }));

  return (
    <form>
      <input value={formData.title || ''} />
      <textarea value={formData.description || ''} />
    </form>
  );
}
```

### Using Pre-built Selectors

```typescript
// Leverage pre-built selectors for consistency
function OptimizedComponent() {
  const formConfig = useBuilderStoreSelector(storeSelectors.formConfig);
  const loadingStates = useBuilderStoreSelector(storeSelectors.loadingStates);

  if (loadingStates.isLoadingConfiguration) {
    return <div>Loading...</div>;
  }

  return <div>{formConfig?.title}</div>;
}
```

### Updating State

```typescript
// Update state through the store API
function updateConfiguration() {
  uiBuilderStore.updateState((currentState) => ({
    formConfig: {
      ...currentState.formConfig,
      title: 'New Title',
      description: 'Updated description',
    },
  }));
}
```

### Transient UI State

```typescript
// Use for step-specific UI state that doesn't need persistence
function WizardStep() {
  const [stepState, setStepState] = useWizardStepUiState('contract-selection', {
    searchQuery: '',
    selectedTab: 'recent',
  });

  return (
    <div>
      <input
        value={stepState.searchQuery}
        onChange={(e) => setStepState({ searchQuery: e.target.value })}
      />
    </div>
  );
}
```

## Performance Best Practices

### ✅ DO: Select Minimal Data

```typescript
// Good - only selects what's needed
const title = useBuilderStoreSelector((state) => state.formConfig?.title);
```

### ❌ DON'T: Select Entire Store

```typescript
// Bad - will re-render on any store change
const state = useBuilderStoreSelector((state) => state);
```

### ✅ DO: Use Pre-built Selectors

```typescript
// Good - optimized and cached
const autoSaveData = useBuilderStoreSelector(storeSelectors.autoSaveData);
```

### ❌ DON'T: Create Objects in Render

```typescript
// Bad - creates new object on every render
const data = useBuilderStoreSelector((state) => ({
  title: state.formConfig?.title,
  description: state.formConfig?.description,
}));
```

### ✅ DO: Create Stable Selectors

```typescript
// Good - stable reference
const selectFormValidation = (state: UIBuilderState) => {
  const fields = state.formConfig?.fields || [];
  return {
    isValid: fields.every(field => !field.error),
    fieldCount: fields.length,
  };
};

function MyComponent() {
  const validation = useBuilderStoreSelector(selectFormValidation);
  return <div>Form is {validation.isValid ? 'valid' : 'invalid'}</div>;
}
```

## API Reference

### UIBuilderStore Methods

```typescript
interface UIBuilderStore {
  getState(): UIBuilderState;

  subscribe(listener: () => void): () => void;

  updateState(updater: (state: UIBuilderState) => Partial<UIBuilderState>): void;

  subscribeWithSelector<T>(
    selector: (state: UIBuilderState) => T,
    callback: (selectedState: T) => void
  ): () => void;

  setInitialState(initialState: Partial<UIBuilderState>): void;
}
```

### useBuilderStoreSelector Hook

```typescript
function useBuilderStoreSelector<T>(selector: (state: UIBuilderState) => T): T;
```

**Parameters:**

- `selector`: Function that extracts specific data from the state

**Returns:**

- Selected data with automatic type inference

### useWizardStepUiState Hook

```typescript
function useWizardStepUiState<T>(
  stepId: string,
  initialStepState: T
): [T, (newState: Partial<T>) => void];
```

**Parameters:**

- `stepId`: Unique identifier for the step's state slice
- `initialStepState`: Default state for the step

**Returns:**

- Tuple containing current state and update function

### Pre-built Selectors

```typescript
const storeSelectors = {
  formConfig: (state: UIBuilderState) => state.formConfig,
  formTitle: (state: UIBuilderState) => state.formConfig?.title,
  formDescription: (state: UIBuilderState) => state.formConfig?.description,
  formFields: (state: UIBuilderState) => state.formConfig?.fields,

  autoSaveData: (state: UIBuilderState) => ({
    selectedFunction: state.selectedFunction,
    formTitle: state.formConfig?.title,
    formDescription: state.formConfig?.description,
    formFields: state.formConfig?.fields,
    executionConfig: state.formConfig?.executionConfig,
    uiKitConfig: state.formConfig?.uiKitConfig,
  }),

  loadingStates: (state: UIBuilderState) => ({
    isLoadingConfiguration: state.isLoadingConfiguration,
    isAutoSaving: state.isAutoSaving,
  }),

  coreConfig: (state: UIBuilderState) => ({
    selectedEcosystem: state.selectedEcosystem,
    selectedNetworkConfigId: state.selectedNetworkConfigId,
    contractAddress: state.contractAddress,
    selectedFunction: state.selectedFunction,
  }),

  contractData: (state: UIBuilderState) => ({
    contractSchema: state.contractSchema,
    contractAddress: state.contractAddress,
    contractFormValues: state.contractFormValues,
  }),
};
```

## Migration Guides

### From Direct Store Access

```typescript
// Old approach
function OldComponent() {
  const [state, setState] = useState(uiBuilderStore.getState());

  useEffect(() => {
    const unsubscribe = uiBuilderStore.subscribe(() => {
      setState(uiBuilderStore.getState());
    });
    return unsubscribe;
  }, []);

  return <div>{state.formConfig?.title}</div>;
}

// New approach
function NewComponent() {
  const title = useBuilderStoreSelector(state => state.formConfig?.title);
  return <div>{title}</div>;
}
```

### From useSyncExternalStore

```typescript
// Old approach
function OldComponent() {
  const title = useSyncExternalStore(
    uiBuilderStore.subscribe,
    () => uiBuilderStore.getState().formConfig?.title,
    () => uiBuilderStore.getState().formConfig?.title
  );
  return <div>{title}</div>;
}

// New approach
function NewComponent() {
  const title = useBuilderStoreSelector(state => state.formConfig?.title);
  return <div>{title}</div>;
}
```

### Adding New State Fields

1. **Update the Interface:**

```typescript
interface UIBuilderState {
  // ... existing fields ...
  newFeature: NewFeatureType | null;
}
```

2. **Update Initial State:**

```typescript
let state: UIBuilderState = {
  // ... existing state ...
  newFeature: null,
};
```

3. **Create Selectors:**

```typescript
export const storeSelectors = {
  // ... existing selectors ...
  newFeature: (state: UIBuilderState) => state.newFeature,
};
```

4. **Use in Components:**

```typescript
function MyComponent() {
  const newFeature = useBuilderStoreSelector(storeSelectors.newFeature);
  // ... component logic
}
```

## Future Considerations

### Package Extraction Roadmap

**TODO: Consider extracting state management to separate package when reusability is needed**

When the state management system needs to be reused across multiple projects, consider:

#### 1. Create Dedicated Package

```
📦 @openzeppelin/contracts-ui-builder-state
├── src/
│   ├── store/
│   │   ├── createStore.ts          # Generic store factory
│   │   └── types.ts                # Core interfaces
│   ├── hooks/
│   │   ├── useStoreSelector.ts     # Generic selector hook
│   │   └── useStepState.ts         # Generic step state hook
│   ├── selectors/
│   │   └── createSelectors.ts      # Selector utilities
│   └── index.ts                    # Public API
└── package.json
```

#### 2. Generic Store Factory

```typescript
// Proposed API for reusable store
function createStore<TState>(initialState: TState) {
  return {
    getState: () => TState,
    subscribe: (listener: () => void) => () => void,
    updateState: (updater: (state: TState) => Partial<TState>) => void,
    // ... other methods
  };
}
```

#### 3. Migration Benefits

- **Reusability**: Use across multiple OpenZeppelin projects
- **Bundle Splitting**: Separate concerns for better tree-shaking
- **Testing**: Easier isolated testing of state logic
- **Documentation**: Dedicated docs for the state management library

#### 4. Backward Compatibility

Maintain existing API while providing migration path:

```typescript
// Current usage (unchanged)
const title = useBuilderStoreSelector((state) => state.formConfig?.title);

// Future generic usage
const title = useStoreSelector(builderStore, (state) => state.formConfig?.title);
```

### Potential Enhancements

#### Redux DevTools Integration

```typescript
// Add to uiBuilderStore.ts
const devToolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
const devTools = devToolsExtension?.connect({ name: 'UI Builder Store' });

// In emit function
devTools?.send('STATE_UPDATE', state);
```

#### State Persistence

```typescript
// Enhanced auto-save coordination
export const uiBuilderStore = {
  hydrate(savedState: Partial<UIBuilderState>) {
    state = { ...state, ...savedState };
  },

  serialize(): string {
    return JSON.stringify(state);
  },

  // ... existing methods
};
```

#### Debugging Integration

```typescript
// Enhanced debugging capabilities
const processUpdateQueue = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Processing ${updateQueue.length} state updates`);
  }

  // ... processing logic with optional debug logging
};
```

## Debugging

### Common Issues

#### 1. Component Re-rendering Too Often

**Problem**: Component re-renders on every state change
**Solution**: Check if selector creates new objects

```typescript
// Bad - creates new object every time
const data = useBuilderStoreSelector((state) => ({
  title: state.formConfig?.title,
  description: state.formConfig?.description,
}));

// Good - use pre-built selector
const data = useBuilderStoreSelector(storeSelectors.formConfig);
```

#### 2. State Updates Not Reflecting

**Problem**: State changes but component doesn't update
**Solution**: Ensure selector returns the changed data

```typescript
// Check that your selector actually selects the changing data
const relevantData = useBuilderStoreSelector((state) => {
  console.log('Selector called with:', state);
  return state.relevantField;
});
```

### React DevTools

- Use React DevTools Profiler to identify unnecessary re-renders
- Look for components that re-render without prop/state changes
- Check if selectors are stable and not creating new objects

### Performance Debugging

```typescript
// Add temporary logging to selectors
const debugSelector = (state: UIBuilderState) => {
  const result = state.formConfig?.title;
  console.log('Title selector called:', result);
  return result;
};

function DebugComponent() {
  const title = useBuilderStoreSelector(debugSelector);
  console.log('Component rendered with title:', title);
  return <div>{title}</div>;
}
```

## Best Practices Summary

1. **Use pre-built selectors** when possible for consistency
2. **Select minimal data** to optimize re-renders
3. **Create stable selectors** outside render functions
4. **Batch related updates** using single `updateState` call
5. **Use TypeScript** for better development experience
6. **Monitor performance** during development
7. **Document custom selectors** for team consistency
8. **Test state logic** independently from components

---

**Next Steps:**

- Review state management patterns in your components
- Consider adding Redux DevTools integration for better debugging
- Plan for potential package extraction when reusability is needed
- Continue optimizing selector patterns for better performance
