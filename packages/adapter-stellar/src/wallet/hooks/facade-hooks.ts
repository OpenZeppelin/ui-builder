import type { EcosystemSpecificReactHooks } from '@openzeppelin/ui-builder-types';

import { useStellarAccount } from './useStellarAccount';
import { useStellarConnect } from './useStellarConnect';
import { useStellarDisconnect } from './useStellarDisconnect';

/**
 * Stellar-specific facade hooks following the EcosystemSpecificReactHooks interface
 * These hooks provide a standardized interface for wallet operations in the Stellar ecosystem
 */
export const stellarFacadeHooks: EcosystemSpecificReactHooks = {
  // Account management
  useAccount: useStellarAccount,

  // Connection management
  useConnect: useStellarConnect,
  useDisconnect: useStellarDisconnect,

  // Stellar doesn't have the same network switching capabilities as EVM
  // These are included for interface compatibility but may not be fully functional
  useSwitchChain: () => ({ switchChain: undefined }),
  useChainId: () => 'stellar',
  useChains: () => [],

  // Transaction and signing hooks - to be implemented as needed
  useBalance: () => ({ data: undefined, isLoading: false }),
  useSendTransaction: () => ({ sendTransaction: undefined }),
  useWaitForTransactionReceipt: () => ({ data: undefined }),
  useSignMessage: () => ({ signMessage: undefined }),
  useSignTypedData: () => ({ signTypedData: undefined }),
};
