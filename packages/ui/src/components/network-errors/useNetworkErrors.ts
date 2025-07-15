'use client';

import { useCallback, useContext } from 'react';

import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';

import { NetworkErrorContext } from './NetworkErrorContext';

export type NetworkErrorType = 'rpc' | 'explorer';

export interface NetworkError {
  id: string;
  type: NetworkErrorType;
  networkId: string;
  networkName: string;
  message: string;
  timestamp: number;
}

export interface NetworkErrorContextValue {
  errors: NetworkError[];
  reportNetworkError: (
    type: NetworkErrorType,
    networkId: string,
    networkName: string,
    message: string
  ) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  onOpenNetworkSettings?: (networkId: string, defaultTab?: 'rpc' | 'explorer') => void;
  setOpenNetworkSettingsHandler: (
    handler: (networkId: string, defaultTab?: 'rpc' | 'explorer') => void
  ) => void;
}

export function useNetworkErrors(): NetworkErrorContextValue {
  const context = useContext(NetworkErrorContext);
  if (!context) {
    throw new Error('useNetworkErrors must be used within NetworkErrorNotificationProvider');
  }
  return context;
}

/**
 * Hook for reporting network errors for a specific adapter
 */
export function useNetworkErrorReporter(adapter: ContractAdapter | null): {
  reportRpcError: (message: string) => void;
  reportExplorerError: (message: string) => void;
} {
  const { reportNetworkError } = useNetworkErrors();

  const reportRpcError = useCallback(
    (message: string) => {
      if (!adapter) return;
      reportNetworkError('rpc', adapter.networkConfig.id, adapter.networkConfig.name, message);
    },
    [adapter, reportNetworkError]
  );

  const reportExplorerError = useCallback(
    (message: string) => {
      if (!adapter) return;
      reportNetworkError('explorer', adapter.networkConfig.id, adapter.networkConfig.name, message);
    },
    [adapter, reportNetworkError]
  );

  return {
    reportRpcError,
    reportExplorerError,
  };
}
