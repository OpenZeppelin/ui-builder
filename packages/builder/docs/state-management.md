# State Management Architecture

## Overview

The UI Builder uses a robust and performant state management system built on [Zustand](https://github.com/pmndrs/zustand). This approach provides excellent performance, type safety, and a first-class developer experience with a minimal API.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Usage Patterns](#usage-patterns)
- [Performance Best Practices](#performance-best-practices)
- [API Reference](#api-reference)
- [Migration Guides](#migration-guides)

## Architecture Overview

### State Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│   Zustand Store  │───▶│   Storage       │
│   (React UI)    │    │   (In-memory)    │    │   (IndexedDB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
     Reactivity           State Management        Data Persistence
```

### Key Principles

1.  **Single Source of Truth**: All UI state flows through the central Zustand store.
2.  **Optimized Subscriptions**: Components only re-render when their selected data changes.
3.  **Automatic Batching**: Zustand automatically batches multiple state changes for optimal performance.
4.  **Type Safety**: Full TypeScript support throughout the system.
5.  **Minimal API**: A simple and intuitive API for state management.

### Layer Separation

- **Store Layer**: `uiBuilderStore` - A vanilla Zustand store for central state management.
- **Hook Layer**: `useUIBuilderStore` - The primary React hook for component subscriptions.
- **Business Logic Layer**: `useBuilder*` hooks - Business logic and state coordination.
- **Storage Layer**: `@openzeppelin/ui-storage` - Data persistence.

## Core Components

### 1. UIBuilderStore (`uiBuilderStore.ts`)

A vanilla Zustand store that manages all application state. It is created with `createStore` from `zustand/vanilla` to allow for use outside of React components.

```typescript
interface UIBuilderState {
  // UI state that doesn't persist across sessions
  uiState: Record<string, unknown>;

  // Network and adapter state
  selectedNetworkConfigId: string | null;
  selectedEcosystem: Ecosystem | null;

  // ... and other state properties
}
```

**Key Features:**

- **Automatic Batching**: Batches multiple state changes by default.
- **Framework Agnostic**: Can be used in any JavaScript environment.
- **Type Safety**: Full TypeScript interface with strict typing.

### 2. Store Hook (`useUIBuilderStore.ts`)

The primary hook for subscribing to state changes from React components.

```typescript
function useUIBuilderStore<T>(selector: (state: UIBuilderState) => T): T;
```

**Benefits:**

- **Selective Updates**: Components only re-render when the data they've selected changes.
- **Memory Efficiency**: Reduces unnecessary React reconciliation cycles.
- **Type Inference**: Automatic TypeScript type inference for selected data.
- **Performance**: Built on Zustand's highly optimized subscription model.

## Usage Patterns

### Basic Usage

```typescript
// Simple value selection
function MyComponent() {
  const selectedFunction = useUIBuilderStore(state => state.selectedFunction);
  const isLoading = useUIBuilderStore(state => state.isLoadingConfiguration);

  if (isLoading) return <div>Loading...</div>;
  return <div>Selected: {selectedFunction}</div>;
}
```

### Complex Object Selection

When selecting multiple values, it is best practice to use a single `useUIBuilderStore` call with a memoized selector or a shallow equality check to prevent unnecessary re-renders.

```typescript
import { shallow } from 'zustand/shallow';

// Select multiple related values
function FormComponent() {
  const { title, description, fields } = useUIBuilderStore(
    (state) => ({
      title: state.formConfig?.title,
      description: state.formConfig?.description,
      fields: state.formConfig?.fields,
    }),
    shallow, // Use a shallow equality check
  );

  return (
    <form>
      <input value={title || ''} />
      <textarea value={description || ''} />
    </form>
  );
}
```

### Updating State

State is updated through actions on the store, which can be called from anywhere, including hooks and components.

```typescript
// Update state through the store API
function updateConfiguration() {
  uiBuilderStore.getState().updateFormConfig({
    title: 'New Title',
    description: 'Updated description',
  });
}
```

### Transient UI State

The `useWizardStepUiState` hook is still the best practice for managing step-specific, transient UI state.

```typescript
// Use for step-specific UI state that doesn't need persistence
function WizardStep() {
  const { stepUiState, setStepUiState } = useWizardStepUiState('contract-selection', {
    searchQuery: '',
    selectedTab: 'recent',
  });

  return (
    <div>
      <input
        value={stepUiState.searchQuery}
        onChange={(e) => setStepUiState({ searchQuery: e.target.value })}
      />
    </div>
  );
}
```

## Performance Best Practices

### ✅ DO: Select Minimal Data

```typescript
// Good - only selects what's needed
const title = useUIBuilderStore((state) => state.formConfig?.title);
```

### ❌ DON'T: Select the Entire Store Object

```typescript
// Bad - will re-render on any store change
const state = useUIBuilderStore((state) => state);
```

### ✅ DO: Use Shallow Equality for Objects

```typescript
import { shallow } from 'zustand/shallow';

// Good - only re-renders if the selected properties change
const { title, description } = useUIBuilderStore(
  (state) => ({
    title: state.formConfig?.title,
    description: state.formConfig?.description,
  }),
  shallow
);
```

### ❌ DON'T: Create New Objects Without an Equality Check

```typescript
// Bad - creates new object on every render, causing a re-render
const data = useUIBuilderStore((state) => ({
  title: state.formConfig?.title,
  description: state.formConfig?.description,
}));
```

## API Reference

### UIBuilderStore Actions

The store exposes a set of actions for updating state. These are available on `uiBuilderStore.getState()`.

```typescript
interface UIBuilderActions {
  setInitialState: (initialState: Partial<UIBuilderState>) => void;
  updateState: (updater: (currentState: UIBuilderState) => Partial<UIBuilderState>) => void;
  resetWizard: () => void;
  // ... and other actions
}
```

### useUIBuilderStore Hook

```typescript
function useUIBuilderStore<T>(
  selector: (state: UIBuilderState) => T,
  equalityFn?: (a: T, b: T) => boolean
): T;
```

**Parameters:**

- `selector`: A function that extracts specific data from the state.
- `equalityFn` (optional): A function to compare the old and new state. Defaults to `Object.is`. Use `shallow` from `zustand/shallow` for objects.

**Returns:**

- Selected data with automatic type inference.

### useWizardStepUiState Hook

```typescript
function useWizardStepUiState<T>(
  stepId: string,
  initialValues: T
): { stepUiState: T; setStepUiState: (newState: Partial<T>) => void };
```

**Parameters:**

- `stepId`: A unique identifier for the step's state slice.
- `initialValues`: The default state for the step.

**Returns:**

- An object containing the current state and an update function.

## Migration Guides

### From `useSyncExternalStore` or `useBuilderStoreSelector`

The migration path from the old hooks is straightforward.

```typescript
// Old approach
function OldComponent() {
  const title = useBuilderStoreSelector(state => state.formConfig?.title);
  return <div>{title}</div>;
}

// New approach
function NewComponent() {
  const title = useUIBuilderStore(state => state.formConfig?.title);
  return <div>{title}</div>;
}
```

### Adding New State Fields

1.  **Update the `UIBuilderState` Interface:**

    ```typescript
    interface UIBuilderState {
      // ... existing fields ...
      newFeature: NewFeatureType | null;
    }
    ```

2.  **Update the Initial State:**

    ```typescript
    const initialState: UIBuilderState = {
      // ... existing state ...
      newFeature: null,
    };
    ```

3.  **Use in Components:**

    ```typescript
    function MyComponent() {
      const newFeature = useUIBuilderStore((state) => state.newFeature);
      // ... component logic
    }
    ```
