import { isRecordWithProperties } from '@openzeppelin/contracts-ui-builder-utils';
import type { Connector } from '@openzeppelin/transaction-form-types';

import { useWalletState } from './WalletStateContext';

// Assuming Connector type is available

export interface DerivedConnectStatus {
  /** Function to initiate a connection, usually takes a connector. Undefined if not available. */
  connect?: (args?: { connector?: Connector /* or string for id */ }) => void;
  /** Array of available connectors. Type is any[] for broad compatibility until Connector type is fully generic here. */
  connectors: Connector[]; // Or any[] if Connector type from types pkg is too specific for generic hook here
  /** True if a connection attempt is in progress. */
  isConnecting: boolean;
  /** Error object if the last connection attempt failed, otherwise null. */
  error: Error | null;
  /** The connector a connection is pending for, if any. */
  pendingConnector?: Connector; // Or any
}

const defaultConnectStatus: DerivedConnectStatus = {
  connect: undefined,
  connectors: [],
  isConnecting: false,
  error: null,
  pendingConnector: undefined,
};

/**
 * A custom hook that consumes `useWalletState` to get `walletFacadeHooks`,
 * then calls the `useConnect` facade hook (if available) and returns a structured,
 * safely-accessed status and control functions for wallet connection.
 */
export function useDerivedConnectStatus(): DerivedConnectStatus {
  const { walletFacadeHooks } = useWalletState();

  const connectHookOutput = walletFacadeHooks?.useConnect
    ? walletFacadeHooks.useConnect()
    : undefined;

  if (isRecordWithProperties(connectHookOutput)) {
    const connectFn =
      'connect' in connectHookOutput && typeof connectHookOutput.connect === 'function'
        ? (connectHookOutput.connect as (args?: { connector?: Connector }) => void)
        : defaultConnectStatus.connect;

    const conns =
      'connectors' in connectHookOutput && Array.isArray(connectHookOutput.connectors)
        ? (connectHookOutput.connectors as Connector[])
        : defaultConnectStatus.connectors;

    const isPending =
      'isPending' in connectHookOutput && typeof connectHookOutput.isPending === 'boolean'
        ? connectHookOutput.isPending
        : 'isLoading' in connectHookOutput && typeof connectHookOutput.isLoading === 'boolean'
          ? connectHookOutput.isLoading
          : defaultConnectStatus.isConnecting;

    const err =
      'error' in connectHookOutput && connectHookOutput.error instanceof Error
        ? connectHookOutput.error
        : defaultConnectStatus.error;

    const pendingConn =
      'pendingConnector' in connectHookOutput &&
      typeof connectHookOutput.pendingConnector === 'object' // Assuming Connector is an object
        ? (connectHookOutput.pendingConnector as Connector)
        : defaultConnectStatus.pendingConnector;

    return {
      connect: connectFn,
      connectors: conns,
      isConnecting: isPending,
      error: err,
      pendingConnector: pendingConn,
    };
  }

  return defaultConnectStatus;
}
