import React, { useSyncExternalStore } from 'react';

import { UIBuilderState, uiBuilderStore } from '../uiBuilderStore';

/**
 * Optimized store selector hook that only re-renders when the selected slice changes.
 *
 * @param selector - Function to select data from the store state
 * @returns Selected data from the store
 *
 * @example
 * ```tsx
 * const title = useBuilderStoreSelector(state => state.formConfig?.title);
 * const formData = useBuilderStoreSelector(storeSelectors.formConfig);
 * ```
 *
 * @see {@link packages/builder/docs/state-management.md | Complete Documentation}
 */
export function useBuilderStoreSelector<T>(selector: (state: UIBuilderState) => T): T {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => uiBuilderStore.subscribe(onStoreChange),
    []
  );

  const getSnapshot = React.useCallback(() => selector(uiBuilderStore.getState()), [selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Pre-built selectors for common store slices.
 * Use these instead of creating inline selectors for better performance.
 *
 * @see {@link packages/builder/docs/state-management.md | Selector Documentation}
 */
export const storeSelectors = {
  // Form configuration selectors
  formConfig: (state: UIBuilderState) => state.formConfig,
  formTitle: (state: UIBuilderState) => state.formConfig?.title,
  formDescription: (state: UIBuilderState) => state.formConfig?.description,
  formFields: (state: UIBuilderState) => state.formConfig?.fields,

  // Auto-save related selectors
  autoSaveData: (state: UIBuilderState) => ({
    selectedFunction: state.selectedFunction,
    formTitle: state.formConfig?.title,
    formDescription: state.formConfig?.description,
    formFields: state.formConfig?.fields,
    executionConfig: state.formConfig?.executionConfig,
    uiKitConfig: state.formConfig?.uiKitConfig,
  }),

  // Loading states
  loadingStates: (state: UIBuilderState) => ({
    isLoadingConfiguration: state.isLoadingConfiguration,
    isAutoSaving: state.isAutoSaving,
  }),

  // Core configuration
  coreConfig: (state: UIBuilderState) => ({
    selectedEcosystem: state.selectedEcosystem,
    selectedNetworkConfigId: state.selectedNetworkConfigId,
    contractAddress: state.contractAddress,
    selectedFunction: state.selectedFunction,
  }),

  // Contract schema and related data
  contractData: (state: UIBuilderState) => ({
    contractSchema: state.contractSchema,
    contractAddress: state.contractAddress,
    contractFormValues: state.contractFormValues,
  }),
};
