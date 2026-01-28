/**
 * Facade Hooks for Polkadot Adapter
 *
 * Provides React hooks for wallet interactions, mirroring the EVM adapter pattern.
 * Re-exports wagmi hooks directly since Polkadot EVM uses the same wallet infrastructure.
 */

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
 * Direct export of wagmi hooks as our facade hooks.
 * Uses the same pattern as the EVM adapter.
 */
export const polkadotFacadeHooks: EcosystemSpecificReactHooks = {
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

// Re-export the wagmi hook types for convenience
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
