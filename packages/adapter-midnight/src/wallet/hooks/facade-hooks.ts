import { useMidnightWallet } from './useMidnightWallet';

/**
 * Facade hook to expose connection status and the connect action.
 * Adheres to the `DerivedConnectStatus` interface expected by the builder app.
 */
export const useConnect = () => {
  const { connect, isConnecting, error } = useMidnightWallet();
  // The adapter currently only supports Lace, so we return a static connector list.
  const connectors = [{ id: 'mnLace', name: 'Lace (Midnight)' }];

  return {
    connect: connect,
    connectors,
    isConnecting,
    error,
    pendingConnector: undefined, // This adapter doesn't have a concept of a pending connector.
  };
};

/**
 * Facade hook to expose disconnection status and the disconnect action.
 * Adheres to the `DerivedDisconnectStatus` interface expected by the builder app.
 */
export const useDisconnect = () => {
  const { disconnect } = useMidnightWallet();
  return {
    disconnect,
    isDisconnecting: false, // This adapter doesn't track disconnecting state.
    error: null,
  };
};

/**
 * Facade hook to expose the current account state.
 * Adheres to the `Account` interface expected by the builder app.
 */
export const useAccount = () => {
  const { address, isConnected, isConnecting } = useMidnightWallet();

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected: !isConnected && !isConnecting,
    isReconnecting: false, // This adapter doesn't have a concept of reconnecting.
    status: isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected',
  };
};

/**
 * An object containing all the facade hooks for the Midnight adapter.
 * This is the primary export that will be consumed by the builder application.
 */
export const midnightFacadeHooks = {
  useAccount,
  useConnect,
  useDisconnect,
  // Other hooks like useBalance, useSwitchChain, etc., can be added here
  // in the future. For now, we only need the core connection hooks.
};
