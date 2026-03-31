import { useMemo } from 'react';

import { useWalletState } from '@openzeppelin/ui-react';

import { BuilderAdapter, BuilderRuntime, toBuilderAdapter } from '../core/runtimeAdapter';

export interface BuilderWalletState {
  activeAdapter: BuilderAdapter | null;
  activeRuntime: BuilderRuntime | null;
  activeNetworkConfig: ReturnType<typeof useWalletState>['activeNetworkConfig'];
  isAdapterLoading: boolean;
  isRuntimeLoading: boolean;
  walletFacadeHooks: ReturnType<typeof useWalletState>['walletFacadeHooks'];
  reconfigureActiveAdapterUiKit: ReturnType<typeof useWalletState>['reconfigureActiveUiKit'];
  reconfigureActiveUiKit: ReturnType<typeof useWalletState>['reconfigureActiveUiKit'];
  setActiveNetworkId: ReturnType<typeof useWalletState>['setActiveNetworkId'];
}

export function useBuilderWalletState(): BuilderWalletState {
  const walletState = useWalletState();

  const activeAdapter = useMemo(
    () => toBuilderAdapter(walletState.activeRuntime as BuilderRuntime | null),
    [walletState.activeRuntime]
  );

  return {
    activeAdapter,
    activeRuntime: walletState.activeRuntime as BuilderRuntime | null,
    activeNetworkConfig: walletState.activeNetworkConfig,
    isAdapterLoading: walletState.isRuntimeLoading,
    isRuntimeLoading: walletState.isRuntimeLoading,
    walletFacadeHooks: walletState.walletFacadeHooks,
    reconfigureActiveAdapterUiKit: walletState.reconfigureActiveUiKit,
    reconfigureActiveUiKit: walletState.reconfigureActiveUiKit,
    setActiveNetworkId: walletState.setActiveNetworkId,
  };
}
