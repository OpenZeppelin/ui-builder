// #####################################################################
// DEVELOPER NOTE: On the Midnight Wallet Connection Flow
//
// The Midnight wallet's `.enable()` API exhibits unconventional behavior that
// requires a specific connection strategy. Standard `async/await` flows
// will not work as expected due to two main issues:
//
// 1.  **Immediate Promise Resolution**: Unlike many other wallets, the
//     `enable()` promise resolves *immediately* when the connection pop-up
//     is displayed, not after the user approves or rejects it. This
//     returns a "pre-flight" API object that is not yet fully authorized.
//
// 2.  **State Not Immediately Ready**: Calling `.state()` on the pre-flight
//     API object immediately after it's returned will fail, because the
//     user has not yet granted permission.
//
// The correct and robust solution, implemented below, is a **state-polling
// mechanism**:
//
// -   `handleConnect` first calls `implementation.connect()` to get the
//     "pre-flight" API object.
// -   A polling loop then repeatedly calls `.state()` on this object. This
//     is the part that effectively waits for user approval.
// -   Once the user approves, the `.state()` call succeeds, the poll is
//     stopped, and the UI is updated.
// -   A failsafe timeout is used to clean up the process if the user
//     rejects or ignores the connection prompt.
// #####################################################################
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EcosystemReactUiProviderProps } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { MidnightWalletContext } from '../context/MidnightWalletContext';
import * as implementation from '../midnight-implementation';
import type { ExtendedDAppConnectorWalletAPI } from '../types';

export const MidnightWalletProvider: React.FC<EcosystemReactUiProviderProps> = ({ children }) => {
  const [api, setApi] = useState<ExtendedDAppConnectorWalletAPI | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isConnected = !!address && !!api;

  const cleanupTimer = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Effect to attempt auto-reconnection on mount
  useEffect(() => {
    const attemptAutoConnect = async () => {
      // Do not auto-reconnect if the user has explicitly disconnected.
      if (localStorage.getItem('midnight-hasExplicitlyDisconnected') === 'true') {
        setIsInitializing(false);
        return;
      }

      try {
        const alreadyEnabled = await implementation.isEnabled();
        if (alreadyEnabled) {
          const preflightApi = await implementation.connect();
          const state = await preflightApi.state();
          setApi(preflightApi);
          setAddress(state.address);
        }
      } catch (err) {
        logger.warn('MidnightWalletProvider', 'Auto-reconnect failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    attemptAutoConnect();
  }, []);

  const handleConnect = useCallback(async () => {
    if (isConnecting || isInitializing) return;

    // When the user explicitly tries to connect, clear the disconnect flag.
    localStorage.removeItem('midnight-hasExplicitlyDisconnected');

    setIsConnecting(true);
    setError(null);

    try {
      // 1. Get the "pre-flight" API. This does not wait for user approval.
      const preflightApi = await implementation.connect();

      // 2. Poll the .state() method, which is the part that waits for approval.
      pollIntervalRef.current = setInterval(async () => {
        try {
          const state = await preflightApi.state();

          // Success! User approved.
          cleanupTimer();
          setApi(preflightApi);
          setAddress(state.address);
          setIsConnecting(false);
        } catch {
          // Ignore polling errors; they are expected while the user is deciding.
        }
      }, 2000); // Poll every 2 seconds.

      // 3. Failsafe timeout for the entire process.
      setTimeout(() => {
        if (pollIntervalRef.current) {
          cleanupTimer();
          setError(new Error('Connection timed out. Please try again.'));
          setIsConnecting(false);
        }
      }, 90000); // 90-second timeout
    } catch (initialError) {
      // This catches initial errors, e.g., if the wallet extension isn't found.
      setError(
        initialError instanceof Error ? initialError : new Error('Failed to initiate connection.')
      );
      setIsConnecting(false);
    }
  }, [isConnecting, isInitializing, cleanupTimer]);

  const handleDisconnect = useCallback(async () => {
    implementation.disconnect();
    setApi(null);
    setAddress(undefined);
    setError(null);
    cleanupTimer();

    // DEVELOPER NOTE: On Explicit Disconnection
    // CIP-30 wallets like Lace do not provide a programmatic `disconnect` or
    // "revoke permissions" function. The dApp cannot sever the connection.
    // To respect the user's choice to disconnect from this specific dApp session,
    // we set a flag in localStorage. This flag is checked on page load to
    // prevent auto-reconnection. This is the standard and recommended
    // workaround for this wallet API limitation.
    localStorage.setItem('midnight-hasExplicitlyDisconnected', 'true');
  }, [cleanupTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupTimer;
  }, [cleanupTimer]);

  // Effect to handle account changes after a successful connection
  useEffect(() => {
    if (api && typeof api.onAccountChange === 'function') {
      const handleAccountChange = (addresses: string[]) => {
        setAddress(addresses[0]);
      };

      api.onAccountChange(handleAccountChange);

      return () => {
        if (typeof api.offAccountChange === 'function') {
          api.offAccountChange(handleAccountChange);
        }
      };
    }
  }, [api]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      isConnecting: isConnecting || isInitializing,
      isConnectPending: isConnecting || isInitializing,
      address,
      api,
      error,
      connect: handleConnect,
      disconnect: handleDisconnect,
    }),
    [
      isConnected,
      isConnecting,
      isInitializing,
      address,
      api,
      error,
      handleConnect,
      handleDisconnect,
    ]
  );

  return (
    <MidnightWalletContext.Provider value={contextValue}>{children}</MidnightWalletContext.Provider>
  );
};
