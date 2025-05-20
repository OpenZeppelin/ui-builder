import { isRecordWithProperties } from '@openzeppelin/transaction-form-utils';

import { useWalletState } from './WalletStateContext';

// Define the expected return shape for the derived hook
export interface DerivedSwitchChainStatus {
  /** Function to initiate a network switch. Undefined if not available. */
  switchChain?: (args: { chainId: number }) => void;
  /** True if a network switch is currently in progress. */
  isSwitching: boolean;
  /** Error object if the last switch attempt failed, otherwise null. */
  error: Error | null;
}

const defaultSwitchChainStatus: DerivedSwitchChainStatus = {
  switchChain: undefined,
  isSwitching: false,
  error: null,
};

/**
 * A custom hook that consumes `useWalletState` to get `walletFacadeHooks`,
 * then calls the `useSwitchChain` facade hook (if available) and returns a structured,
 * safely-accessed status and control function for network switching.
 * Provides default values if the hook or its properties are unavailable.
 */
export function useDerivedSwitchChainStatus(): DerivedSwitchChainStatus {
  const { walletFacadeHooks } = useWalletState();

  const switchChainHookOutput = walletFacadeHooks?.useSwitchChain
    ? walletFacadeHooks.useSwitchChain()
    : undefined;

  if (isRecordWithProperties(switchChainHookOutput)) {
    const execSwitchFn =
      'switchChain' in switchChainHookOutput &&
      typeof switchChainHookOutput.switchChain === 'function'
        ? (switchChainHookOutput.switchChain as (args: { chainId: number }) => void)
        : defaultSwitchChainStatus.switchChain;

    const isPending =
      'isPending' in switchChainHookOutput && typeof switchChainHookOutput.isPending === 'boolean'
        ? switchChainHookOutput.isPending
        : defaultSwitchChainStatus.isSwitching;

    const err =
      'error' in switchChainHookOutput && switchChainHookOutput.error instanceof Error
        ? switchChainHookOutput.error
        : defaultSwitchChainStatus.error;

    return { switchChain: execSwitchFn, isSwitching: isPending, error: err };
  }

  return defaultSwitchChainStatus;
}
