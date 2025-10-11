import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EcosystemReactUiProviderProps } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { onMidnightWalletConnectionChange } from '../connection';
import { MidnightWalletContext } from '../context/MidnightWalletContext';
import type { ExtendedDAppConnectorWalletAPI } from '../types';
import { getMidnightWalletImplementation } from '../utils';

interface MidnightWalletUiRootProps extends EcosystemReactUiProviderProps {
  children: ReactNode;
}

/**
 * MidnightWalletUiRoot
 *
 * Root provider for Midnight wallet UI state and connection management.
 *
 * DESIGN DECISIONS & LIMITATIONS:
 *
 * 1. **Focus/Blur Dismissal Detection**
 *    - Lace wallet popup does not expose a native "onDismiss" event.
 *    - We detect dismissal by monitoring window focus events:
 *      - When unlock flow starts, we mark awaitingAuth=true.
 *      - When window regains focus while still connecting and no address, we treat it as dismissal.
 *      - This clears "Connecting…" state and unsubscribes from polling to stop re-prompting.
 *    - LIMITATION: If user switches tabs instead of closing popup, dismissal won't be detected until focus returns.
 *
 * 2. **Fallback Timeout (60s)**
 *    - A defensive 60s timeout clears "Connecting…" state to avoid infinite loading.
 *    - This handles edge cases where:
 *      - Wallet never responds or gets stuck.
 *      - Popup is closed in a way we can't detect (rare browser scenarios).
 *      - User leaves popup open for a very long time.
 *    - This timeout is intentionally long to avoid prematurely canceling legitimate unlock flows.
 *
 * 3. **Event-Driven Connection Status**
 *    - We subscribe to onMidnightWalletConnectionChange (which internally polls api.state()).
 *    - When address becomes available, we update state and clear loading.
 *    - When user dismisses, we unsubscribe → polling stops → no more prompts.
 *
 * 4. **Auto-Reconnect on Mount**
 *    - If wallet is already enabled (isEnabled() === true) and user hasn't explicitly disconnected,
 *      we attempt auto-reconnect on page load.
 *    - This provides seamless UX for returning users with an unlocked wallet.
 *    - If wallet is locked, the unlock popup will appear once.
 *
 * 5. **No Immediate State Reads After enable()**
 *    - Calling api.state() immediately after enable() can re-prompt the user if wallet is locked.
 *    - We rely on the polling loop (started by listener subscription) to emit the address once ready.
 *
 * FUTURE IMPROVEMENTS:
 * - If Lace adds native onDismiss or onUnlock events, replace focus/blur heuristics.
 * - Configurable fallback timeout for different use cases (e.g., shorter for impatient UX).
 */
export function MidnightWalletUiRoot({ children }: MidnightWalletUiRootProps) {
  const [api, setApi] = useState<ExtendedDAppConnectorWalletAPI | null>(null);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awaitingAuthRef = useRef(false);
  const activeUnsubscribeRef = useRef<(() => void) | null>(null);

  const isConnected = !!address && !!api;

  // DESIGN DECISION: Auto-reconnect on mount if the wallet is already enabled
  // - Provides seamless UX for returning users with unlocked wallet
  // - Respects explicit user disconnection (stored in localStorage)
  // - If wallet is locked, unlock popup will appear once
  useEffect(() => {
    const attempt = async () => {
      if (localStorage.getItem('midnight-hasExplicitlyDisconnected') === 'true') {
        setIsInitializing(false);
        return;
      }
      try {
        const impl = await getMidnightWalletImplementation();
        if (await impl.isEnabled()) {
          setIsConnecting(true);
          if (!impl.getApi()) {
            await impl.connect();
          }
          // Subscribe to be notified when address becomes available after unlock
          const unsubscribe = onMidnightWalletConnectionChange((curr) => {
            if (!curr.address) return;
            const activeApi = impl.getApi();
            if (activeApi) setApi(activeApi as ExtendedDAppConnectorWalletAPI);
            setAddress(curr.address);
            setIsConnecting(false);
            unsubscribe();
            activeUnsubscribeRef.current = null;
            awaitingAuthRef.current = false;
          });
          activeUnsubscribeRef.current = unsubscribe;
          awaitingAuthRef.current = true;

          // DESIGN DECISION: 60s fallback timeout
          // - Prevents infinite "Connecting…" if wallet never responds or gets stuck
          // - Long enough to avoid canceling legitimate unlock flows (user reading wallet prompts)
          // - Cleared on success or dismissal detection
          if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = setTimeout(() => {
            setIsConnecting(false);
            if (activeUnsubscribeRef.current) {
              activeUnsubscribeRef.current();
              activeUnsubscribeRef.current = null;
            }
            awaitingAuthRef.current = false;
          }, 60000);
        }
      } catch (err) {
        logger.warn('MidnightWalletUiRoot', 'Auto-reconnect failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    attempt();
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting || isInitializing) return;
    localStorage.removeItem('midnight-hasExplicitlyDisconnected');
    setIsConnecting(true);
    setError(null);
    try {
      const impl = await getMidnightWalletImplementation();
      // DESIGN DECISION: Avoid re-calling enable() if we already hold an API
      // - LaceWalletImplementation.connect() internally checks this
      // - Prevents re-triggering wallet popup on rapid button clicks
      if (!impl.getApi()) {
        await impl.connect();
      }
      const activeApi = impl.getApi();
      if (!activeApi) throw new Error('Failed to connect');

      // Subscribe to connection changes; polling will emit address when ready
      const unsubscribe = impl.onWalletConnectionChange((curr) => {
        if (!curr.address) return;
        setApi(activeApi as ExtendedDAppConnectorWalletAPI);
        setAddress(curr.address);
        setIsConnecting(false);
        awaitingAuthRef.current = false;
        activeUnsubscribeRef.current = null;
      });
      activeUnsubscribeRef.current = unsubscribe;
      awaitingAuthRef.current = true;

      // DESIGN DECISION: 60s fallback timeout (same as auto-reconnect)
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = setTimeout(() => {
        setIsConnecting(false);
        if (activeUnsubscribeRef.current) {
          activeUnsubscribeRef.current();
          activeUnsubscribeRef.current = null;
        }
        awaitingAuthRef.current = false;
      }, 60000);

      // DESIGN DECISION: No immediate state read
      // - Calling api.state() here could re-prompt if wallet is locked
      // - Polling loop (started by subscription) will emit address when wallet is ready
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to initiate connection.'));
      setIsConnecting(false);
    }
  }, [isConnecting, isInitializing]);

  const disconnect = useCallback(async () => {
    try {
      const impl = await getMidnightWalletImplementation();
      impl.disconnect();
      setApi(null);
      setAddress(undefined);
      setError(null);
      localStorage.setItem('midnight-hasExplicitlyDisconnected', 'true');
    } catch (err) {
      logger.warn('MidnightWalletUiRoot', 'Disconnect error:', err);
    }
  }, []);

  // Keep address synced if wallet changes accounts after connection
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const sub = async () => {
      if (!api) return;
      unsubscribe = onMidnightWalletConnectionChange((curr) => {
        setAddress(curr.address || undefined);
      });
    };
    sub();
    return () => {
      if (unsubscribe) unsubscribe();
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [api]);

  // DESIGN DECISION: Focus-based dismissal detection
  // - Lace wallet does not expose native onDismiss/onReject events
  // - We infer dismissal by monitoring window focus:
  //   1. Popup opens → window typically loses focus
  //   2. User closes popup → window regains focus
  //   3. If we're still connecting and no address, treat as dismissal
  // - On dismissal: clear loading state, unsubscribe (stops polling), clear timeout
  // - LIMITATION: If user switches tabs instead of closing popup, we won't detect dismissal
  //   until they return to the tab. This is acceptable as it doesn't cause re-prompting.
  useEffect(() => {
    if (!isConnecting) return;
    const onFocus = () => {
      if (awaitingAuthRef.current && !address) {
        // User likely dismissed the popup → cancel connection attempt
        setIsConnecting(false);
        if (activeUnsubscribeRef.current) {
          activeUnsubscribeRef.current(); // Stops polling
          activeUnsubscribeRef.current = null;
        }
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        awaitingAuthRef.current = false;
      }
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [isConnecting, address]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      isConnecting: isConnecting || isInitializing,
      isConnectPending: isConnecting || isInitializing,
      address,
      api,
      error,
      connect,
      disconnect,
    }),
    [isConnected, isConnecting, isInitializing, address, api, error, connect, disconnect]
  );

  return (
    <MidnightWalletContext.Provider value={contextValue}>{children}</MidnightWalletContext.Provider>
  );
}
