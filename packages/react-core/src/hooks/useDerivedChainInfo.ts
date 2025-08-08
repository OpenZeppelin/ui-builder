import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { useWalletState } from './WalletStateContext';

export interface DerivedChainInfo {
  /** The current chain ID reported by the wallet's active connection, if available. */
  currentChainId?: number;
  /** Array of chains configured in the underlying wallet library (e.g., wagmi). Type is any[] for generic compatibility. */
  availableChains: unknown[];
}

const defaultChainInfo: DerivedChainInfo = {
  currentChainId: undefined,
  availableChains: [],
};

/**
 * A custom hook that consumes `useWalletState` to get `walletFacadeHooks`,
 * then calls the `useChainId` and `useChains` facade hooks (if available)
 * and returns a structured object with this information.
 * Provides default values if the hooks or their properties are unavailable.
 */
export function useDerivedChainInfo(): DerivedChainInfo {
  const { walletFacadeHooks } = useWalletState();

  let chainIdToReturn: number | undefined = defaultChainInfo.currentChainId;
  const chainIdHookOutput = walletFacadeHooks?.useChainId
    ? walletFacadeHooks.useChainId()
    : undefined;
  // The useChainId hook from wagmi directly returns the number or undefined
  if (typeof chainIdHookOutput === 'number') {
    chainIdToReturn = chainIdHookOutput;
  } else if (chainIdHookOutput !== undefined) {
    // If it's not a number but not undefined, log a warning but use default. Could be an adapter returning unexpected type.
    logger.warn(
      'useDerivedChainInfo',
      'useChainId facade hook returned non-numeric value:',
      chainIdHookOutput
    );
  }

  let chainsToReturn: unknown[] = defaultChainInfo.availableChains;
  const chainsHookOutput = walletFacadeHooks?.useChains ? walletFacadeHooks.useChains() : undefined;
  // The useChains hook from wagmi directly returns an array of Chain objects
  if (Array.isArray(chainsHookOutput)) {
    chainsToReturn = chainsHookOutput;
  } else if (chainsHookOutput !== undefined) {
    logger.warn(
      'useDerivedChainInfo',
      'useChains facade hook returned non-array value:',
      chainsHookOutput
    );
  }

  return { currentChainId: chainIdToReturn, availableChains: chainsToReturn };
}
