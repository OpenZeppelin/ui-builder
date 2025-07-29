import { useStore } from 'zustand';

import { UIBuilderState, uiBuilderStoreVanilla } from './uiBuilderStore';

export function useUIBuilderStore<T>(selector: (state: UIBuilderState) => T): T {
  return useStore(uiBuilderStoreVanilla, selector);
}