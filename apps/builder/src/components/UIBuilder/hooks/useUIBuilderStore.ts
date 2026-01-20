import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { UIBuilderActions, UIBuilderState, uiBuilderStoreVanilla } from './uiBuilderStore';

export function useUIBuilderStore<T>(
  selector: (state: UIBuilderState & UIBuilderActions) => T,
  equalityFn: (a: T, b: T) => boolean = shallow
): T {
  return useStoreWithEqualityFn(uiBuilderStoreVanilla, selector, equalityFn);
}
