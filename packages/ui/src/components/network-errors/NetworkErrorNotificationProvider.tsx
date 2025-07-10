'use client';

import { toast } from 'sonner';

import { useCallback, useMemo, useRef, useState } from 'react';

import { NetworkErrorContext } from './NetworkErrorContext';
import type { NetworkError, NetworkErrorType } from './useNetworkErrors';

interface NetworkErrorNotificationProviderProps {
  children: React.ReactNode;
}

export function NetworkErrorNotificationProvider({
  children,
}: NetworkErrorNotificationProviderProps): React.ReactNode {
  const [errors, setErrors] = useState<NetworkError[]>([]);
  const [openNetworkSettingsHandler, setOpenNetworkSettingsHandler] = useState<
    ((networkId: string, defaultTab?: 'rpc' | 'explorer') => void) | undefined
  >();
  const errorDedupeRef = useRef<Map<string, number>>(new Map());

  const reportNetworkError = useCallback(
    (type: NetworkErrorType, networkId: string, networkName: string, message: string) => {
      // Create a unique key for deduplication
      const dedupeKey = `${type}-${networkId}-${message}`;
      const now = Date.now();
      const lastReported = errorDedupeRef.current.get(dedupeKey);

      // Dedupe errors that occur within 5 seconds
      if (lastReported && now - lastReported < 5000) {
        return;
      }

      errorDedupeRef.current.set(dedupeKey, now);

      const error: NetworkError = {
        id: `${type}-${networkId}-${now}`,
        type,
        networkId,
        networkName,
        message,
        timestamp: now,
      };

      setErrors((prev) => {
        const newErrors = [...prev, error];
        return newErrors;
      });

      // Show toast notification with action button
      const typeLabel = type === 'rpc' ? 'RPC' : 'Explorer';
      toast.error(`${typeLabel} Error - ${networkName}`, {
        description: message,
        duration: 10000, // Show for 10 seconds
        action: openNetworkSettingsHandler
          ? {
              label: 'Configure',
              onClick: (): void => {
                openNetworkSettingsHandler(networkId, type);
              },
            }
          : undefined,
      });

      // Auto-remove error after 1 minute
      setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
        errorDedupeRef.current.delete(dedupeKey);
      }, 60000);
    },
    [openNetworkSettingsHandler]
  );

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    errorDedupeRef.current.clear();
  }, []);

  const stableSetHandler = useCallback(
    (handler: (networkId: string, defaultTab?: 'rpc' | 'explorer') => void) => {
      setOpenNetworkSettingsHandler(() => handler);
    },
    []
  );

  const value = useMemo(
    () => ({
      errors,
      reportNetworkError,
      clearError,
      clearAllErrors,
      onOpenNetworkSettings: openNetworkSettingsHandler,
      setOpenNetworkSettingsHandler: stableSetHandler,
    }),
    [
      errors,
      reportNetworkError,
      clearError,
      clearAllErrors,
      openNetworkSettingsHandler,
      stableSetHandler,
    ]
  );

  return <NetworkErrorContext.Provider value={value}>{children}</NetworkErrorContext.Provider>;
}
