import { isRecordWithProperties } from '@openzeppelin/ui-builder-utils';

import { useWalletState } from './WalletStateContext';

export interface DerivedDisconnectStatus {
  /** Function to initiate disconnection. Undefined if not available. */
  disconnect?: () => void | Promise<void>; // Can be sync or async
  /** True if a disconnection attempt is in progress (if hook provides this). */
  isDisconnecting: boolean;
  /** Error object if the last disconnection attempt failed (if hook provides this). */
  error: Error | null;
}

const defaultDisconnectStatus: DerivedDisconnectStatus = {
  disconnect: undefined,
  isDisconnecting: false,
  error: null,
};

/**
 * A custom hook that consumes `useWalletState` to get `walletFacadeHooks`,
 * then calls the `useDisconnect` facade hook (if available) and returns a structured,
 * safely-accessed status and control function for wallet disconnection.
 */
export function useDerivedDisconnect(): DerivedDisconnectStatus {
  const { walletFacadeHooks } = useWalletState();

  const disconnectHookOutput = walletFacadeHooks?.useDisconnect
    ? walletFacadeHooks.useDisconnect()
    : undefined;

  if (isRecordWithProperties(disconnectHookOutput)) {
    const disconnectFn =
      'disconnect' in disconnectHookOutput && typeof disconnectHookOutput.disconnect === 'function'
        ? (disconnectHookOutput.disconnect as () => void | Promise<void>)
        : defaultDisconnectStatus.disconnect;

    // wagmi's useDisconnect doesn't have isPending/isLoading directly, but has error and variables (which is the connector it disconnected)
    // We will assume a simple isDisconnecting is not provided by current wagmi facade, but include for future flexibility
    const isPending =
      'isPending' in disconnectHookOutput && typeof disconnectHookOutput.isPending === 'boolean'
        ? disconnectHookOutput.isPending
        : 'isLoading' in disconnectHookOutput && typeof disconnectHookOutput.isLoading === 'boolean'
          ? disconnectHookOutput.isLoading
          : defaultDisconnectStatus.isDisconnecting;

    const err =
      'error' in disconnectHookOutput && disconnectHookOutput.error instanceof Error
        ? disconnectHookOutput.error
        : defaultDisconnectStatus.error;

    return { disconnect: disconnectFn, isDisconnecting: isPending, error: err };
  }

  return defaultDisconnectStatus;
}
