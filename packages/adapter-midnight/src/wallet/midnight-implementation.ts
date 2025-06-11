import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

// This file contains the core implementation for interacting with the Lace wallet's
// CIP-30 style API (window.midnight.lace). It's responsible for all direct
// communication with the wallet extension.

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
 * Calls the wallet's enable() method.
 * This resolves immediately with a "pre-flight" API object that is not
 * fully authorized until the user approves the connection in the UI.
 * The `.state()` method of the returned object is the part that will
 * actually wait for user approval.
 *
 * @returns A Promise that resolves with the pre-flight Lace wallet API object.
 */
export const connect = (): Promise<DAppConnectorWalletAPI> => {
  if (typeof window === 'undefined' || !window.midnight?.mnLace) {
    // Return a rejected promise for consistency
    return Promise.reject(new Error('Lace wallet not found.'));
  }
  return window.midnight.mnLace.enable();
};

/**
 * Disconnect is a no-op in this implementation, as all state is managed
 * within the React provider.
 */
export const disconnect = (): void => {
  // No action needed here.
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
