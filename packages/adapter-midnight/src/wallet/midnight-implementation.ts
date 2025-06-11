import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

// This file contains the core implementation for interacting with the Lace wallet's
// CIP-30 style API (window.midnight.lace). It's responsible for all direct
// communication with the wallet extension.

let enabledApi: DAppConnectorWalletAPI | null = null;

/**
 * Checks if the wallet is already enabled (i.e., if the dApp has permission).
 * This method should not trigger a UI pop-up.
 * @returns A Promise that resolves with a boolean.
 */
export const isEnabled = (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.midnight?.mnLace) {
    return Promise.resolve(false);
  }
  return window.midnight.mnLace.isEnabled();
};

/**
 * Calls the wallet's enable() method to initiate a connection.
 *
 * DEVELOPER NOTE: This method is non-blocking and resolves *immediately*
 * with a "pre-flight" API object. It does not wait for user approval.
 * The `MidnightWalletProvider` handles the subsequent state polling required
 * to confirm the connection is fully established.
 *
 * @returns A Promise that resolves with the pre-flight Lace wallet API object.
 */
export const connect = async (): Promise<DAppConnectorWalletAPI> => {
  if (typeof window === 'undefined' || !window.midnight?.mnLace) {
    return Promise.reject(new Error('Lace wallet not found.'));
  }

  const api = await window.midnight.mnLace.enable();
  enabledApi = api;
  return api;
};

/**
 * Disconnects by clearing the stored API object. This is critical for
 * ensuring the next connection attempt requires user approval.
 */
export const disconnect = (): void => {
  enabledApi = null;
};

/**
 * Synchronously returns the currently connected Lace API instance.
 * This is the non-blocking function used by the polling mechanism.
 * @returns The Lace API object or `null` if not connected.
 */
export const getApi = (): DAppConnectorWalletAPI | null => {
  return enabledApi;
};

// Functions below are not yet implemented and are placeholders.
// They are not part of the core connection flow.

export const signTx = async (): Promise<void> => {
  throw new Error('signTx is not implemented yet.');
};

/**
 * Placeholder for submitting a transaction.
 * @throws Not implemented.
 */
export const submitTx = async (): Promise<void> => {
  throw new Error('submitTx is not implemented yet.');
};
