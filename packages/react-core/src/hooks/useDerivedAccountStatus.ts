// Assumes WalletStateContext exports useWalletState
import { isRecordWithProperties } from '@openzeppelin/ui-builder-utils';

import { useWalletState } from './WalletStateContext';

export interface DerivedAccountStatus {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  // Potentially add other commonly used and safely extracted properties from useAccount's result
}

const defaultAccountStatus: DerivedAccountStatus = {
  isConnected: false,
  address: undefined,
  chainId: undefined,
};

/**
 * A custom hook that consumes useWalletState to get the walletFacadeHooks,
 * then calls the useAccount facade hook (if available) and returns a structured,
 * safely-accessed account status (isConnected, address, chainId).
 * Provides default values if the hook or its properties are unavailable.
 */
export function useDerivedAccountStatus(): DerivedAccountStatus {
  const { walletFacadeHooks } = useWalletState();

  // Call the useAccount hook from the facade
  const accountHookOutput = walletFacadeHooks?.useAccount
    ? walletFacadeHooks.useAccount()
    : undefined;

  if (isRecordWithProperties(accountHookOutput)) {
    const isConnected =
      'isConnected' in accountHookOutput && typeof accountHookOutput.isConnected === 'boolean'
        ? accountHookOutput.isConnected
        : defaultAccountStatus.isConnected;
    const address =
      'address' in accountHookOutput && typeof accountHookOutput.address === 'string'
        ? accountHookOutput.address
        : defaultAccountStatus.address;
    const chainId =
      'chainId' in accountHookOutput && typeof accountHookOutput.chainId === 'number'
        ? accountHookOutput.chainId
        : defaultAccountStatus.chainId;
    return { isConnected, address, chainId };
  }
  return defaultAccountStatus;
}
