import {
  useAccount,
  useBalance,
  useChainId,
  useChains,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
  type UseAccountReturnType,
  type UseBalanceReturnType,
  type UseChainIdReturnType,
  type UseChainsReturnType,
  type UseConnectReturnType,
  type UseDisconnectReturnType,
  type UseSendTransactionReturnType,
  type UseSignMessageReturnType,
  type UseSignTypedDataReturnType,
  type UseSwitchChainReturnType,
  type UseWaitForTransactionReceiptReturnType,
} from 'wagmi';

import type { EcosystemSpecificReactHooks } from '@openzeppelin/ui-types';

/**
 * Direct export of wagmi hooks as our facade hooks
 * Using the EcosystemSpecificReactHooks interface which now accepts any function signatures
 */
export const evmFacadeHooks: EcosystemSpecificReactHooks = {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useChainId,
  useChains,
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSignMessage,
  useSignTypedData,
};

// Re-export the wagmi hook types for convenience when consuming these hooks
export type {
  UseAccountReturnType,
  UseBalanceReturnType,
  UseChainIdReturnType,
  UseChainsReturnType,
  UseConnectReturnType,
  UseDisconnectReturnType,
  UseSendTransactionReturnType,
  UseSignMessageReturnType,
  UseSignTypedDataReturnType,
  UseSwitchChainReturnType,
  UseWaitForTransactionReceiptReturnType,
};
