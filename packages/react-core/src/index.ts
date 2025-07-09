// Contexts and Providers
export {
  AdapterContext,
  type AdapterContextValue,
  type AdapterRegistry,
} from './hooks/AdapterContext';
export { AdapterProvider, type AdapterProviderProps } from './hooks/AdapterProvider';
export { WalletStateContext, type WalletStateContextValue } from './hooks/WalletStateContext';
export { WalletStateProvider, type WalletStateProviderProps } from './hooks/WalletStateProvider';

// Consumer Hooks
export { useAdapterContext } from './hooks/useAdapterContext';
export { useWalletState } from './hooks/WalletStateContext';
export {
  useDerivedAccountStatus,
  type DerivedAccountStatus,
} from './hooks/useDerivedAccountStatus';
export {
  useDerivedSwitchChainStatus,
  type DerivedSwitchChainStatus,
} from './hooks/useDerivedSwitchChainStatus';
export { useDerivedChainInfo, type DerivedChainInfo } from './hooks/useDerivedChainInfo';
export {
  useDerivedConnectStatus,
  type DerivedConnectStatus,
} from './hooks/useDerivedConnectStatus';
export { useDerivedDisconnect, type DerivedDisconnectStatus } from './hooks/useDerivedDisconnect';

// UI Components
export { WalletConnectionHeader } from './components/WalletConnectionHeader';
export { WalletConnectionUI } from './components/WalletConnectionUI';
export { WalletConnectionWithSettings } from './components/WalletConnectionWithSettings';
