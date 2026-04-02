import { useWalletState } from '@openzeppelin/ui-react';

import type { BuilderRuntime } from '../core/runtimeAdapter';

export interface BuilderWalletState {
  activeRuntime: BuilderRuntime | null;
  activeNetworkConfig: ReturnType<typeof useWalletState>['activeNetworkConfig'];
  isRuntimeLoading: boolean;
  walletFacadeHooks: ReturnType<typeof useWalletState>['walletFacadeHooks'];
  reconfigureActiveUiKit: ReturnType<typeof useWalletState>['reconfigureActiveUiKit'];
  setActiveNetworkId: ReturnType<typeof useWalletState>['setActiveNetworkId'];
}

export function useBuilderWalletState(): BuilderWalletState {
  const walletState = useWalletState();

  return {
    activeRuntime: walletState.activeRuntime as BuilderRuntime | null,
    activeNetworkConfig: walletState.activeNetworkConfig,
    isRuntimeLoading: walletState.isRuntimeLoading,
    walletFacadeHooks: walletState.walletFacadeHooks,
    reconfigureActiveUiKit: walletState.reconfigureActiveUiKit,
    setActiveNetworkId: walletState.setActiveNetworkId,
  };
}
