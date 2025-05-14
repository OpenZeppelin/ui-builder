import {
  useAccount as wagmiUseAccount,
  useBalance as wagmiUseBalance,
  useChainId as wagmiUseChainId,
  useChains as wagmiUseChains,
  useConnect as wagmiUseConnect,
  useDisconnect as wagmiUseDisconnect,
  useSendTransaction as wagmiUseSendTransaction,
  useSignMessage as wagmiUseSignMessage,
  useSignTypedData as wagmiUseSignTypedData,
  useSwitchChain as wagmiUseSwitchChain,
  useWaitForTransactionReceipt as wagmiUseWaitForTransactionReceipt,
} from 'wagmi';

// Assuming wagmi v2+, these are from wagmi/react

import type { EcosystemSpecificReactHooks } from '@openzeppelin/transaction-form-types';

// TODO: Properly type the return values and arguments based on actual wagmi hook signatures
// For now, they will infer from the imported hooks. 'args?: any' is a placeholder.

export const useAccountFacade = () => wagmiUseAccount();
export const useConnectFacade = () => wagmiUseConnect();
export const useDisconnectFacade = () => wagmiUseDisconnect();
export const useSwitchChainFacade = () => wagmiUseSwitchChain();
export const useChainIdFacade = () => wagmiUseChainId();
export const useChainsFacade = () => wagmiUseChains();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useBalanceFacade = (args?: any) => wagmiUseBalance(args);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSendTransactionFacade = (args?: any) => wagmiUseSendTransaction(args);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useWaitForTransactionReceiptFacade = (args?: any) =>
  wagmiUseWaitForTransactionReceipt(args);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSignMessageFacade = (args?: any) => wagmiUseSignMessage(args);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSignTypedDataFacade = (args?: any) => wagmiUseSignTypedData(args);

export const evmFacadeHooks: EcosystemSpecificReactHooks = {
  useAccount: useAccountFacade,
  useConnect: useConnectFacade,
  useDisconnect: useDisconnectFacade,
  useSwitchChain: useSwitchChainFacade,
  useChainId: useChainIdFacade,
  useChains: useChainsFacade,
  useBalance: useBalanceFacade,
  useSendTransaction: useSendTransactionFacade,
  useWaitForTransactionReceipt: useWaitForTransactionReceiptFacade,
  useSignMessage: useSignMessageFacade,
  useSignTypedData: useSignTypedDataFacade,
};
