/**
 * Facade Hooks Contract - Wagmi v3
 * 
 * This file defines the expected public API for adapter-evm facade hooks
 * after the Wagmi v3 upgrade.
 * 
 * Note: Per clarification, facade hooks are INTERNAL implementation details,
 * not part of the public API. Consumers interact through the ContractAdapter
 * interface, not directly with wagmi hooks.
 */

import type { EcosystemSpecificReactHooks } from '@openzeppelin/ui-types';

// =============================================================================
// Wagmi v3 Hook Imports
// =============================================================================

/**
 * Expected imports from wagmi@3
 * 
 * Key changes from v2:
 * - useAccount → useConnection
 * - UseAccountReturnType → UseConnectionReturnType
 */
export type WagmiV3Imports = {
  // Renamed in v3
  useConnection: typeof import('wagmi').useConnection;
  
  // Unchanged in v3
  useBalance: typeof import('wagmi').useBalance;
  useChainId: typeof import('wagmi').useChainId;
  useChains: typeof import('wagmi').useChains;
  useConnect: typeof import('wagmi').useConnect;
  useDisconnect: typeof import('wagmi').useDisconnect;
  useSendTransaction: typeof import('wagmi').useSendTransaction;
  useSignMessage: typeof import('wagmi').useSignMessage;
  useSignTypedData: typeof import('wagmi').useSignTypedData;
  useSwitchChain: typeof import('wagmi').useSwitchChain;
  useWaitForTransactionReceipt: typeof import('wagmi').useWaitForTransactionReceipt;
};

// =============================================================================
// Facade Hooks Interface (Internal)
// =============================================================================

/**
 * EVM Facade Hooks - Wagmi v3
 * 
 * This interface exposes wagmi v3 hooks through the adapter's facade layer.
 * 
 * IMPORTANT: This is an internal implementation detail. The public API is
 * the ContractAdapter interface in @openzeppelin/ui-types.
 */
export interface EvmFacadeHooksV3 extends EcosystemSpecificReactHooks {
  /**
   * Hook to get current wallet connection state
   * @see https://wagmi.sh/react/api/hooks/useConnection
   * 
   * Renamed from useAccount in v2
   */
  useConnection: WagmiV3Imports['useConnection'];
  
  /**
   * Hook to connect wallet
   * @see https://wagmi.sh/react/api/hooks/useConnect
   */
  useConnect: WagmiV3Imports['useConnect'];
  
  /**
   * Hook to disconnect wallet
   * @see https://wagmi.sh/react/api/hooks/useDisconnect
   */
  useDisconnect: WagmiV3Imports['useDisconnect'];
  
  /**
   * Hook to switch chains
   * @see https://wagmi.sh/react/api/hooks/useSwitchChain
   */
  useSwitchChain: WagmiV3Imports['useSwitchChain'];
  
  /**
   * Hook to get current chain ID
   * @see https://wagmi.sh/react/api/hooks/useChainId
   */
  useChainId: WagmiV3Imports['useChainId'];
  
  /**
   * Hook to get available chains
   * @see https://wagmi.sh/react/api/hooks/useChains
   */
  useChains: WagmiV3Imports['useChains'];
  
  /**
   * Hook to get wallet balance
   * @see https://wagmi.sh/react/api/hooks/useBalance
   */
  useBalance: WagmiV3Imports['useBalance'];
  
  /**
   * Hook to send transactions
   * @see https://wagmi.sh/react/api/hooks/useSendTransaction
   */
  useSendTransaction: WagmiV3Imports['useSendTransaction'];
  
  /**
   * Hook to wait for transaction receipt
   * @see https://wagmi.sh/react/api/hooks/useWaitForTransactionReceipt
   */
  useWaitForTransactionReceipt: WagmiV3Imports['useWaitForTransactionReceipt'];
  
  /**
   * Hook to sign messages
   * @see https://wagmi.sh/react/api/hooks/useSignMessage
   */
  useSignMessage: WagmiV3Imports['useSignMessage'];
  
  /**
   * Hook to sign typed data (EIP-712)
   * @see https://wagmi.sh/react/api/hooks/useSignTypedData
   */
  useSignTypedData: WagmiV3Imports['useSignTypedData'];
}

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Re-exported types from wagmi v3
 * 
 * Note: UseAccountReturnType is renamed to UseConnectionReturnType in v3
 */
export type {
  UseConnectionReturnType,
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
} from 'wagmi';
