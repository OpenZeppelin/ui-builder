'use client';

import { useEffect, useRef } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';

import { useNetworkErrors } from './useNetworkErrors';

/**
 * Creates an adapter proxy that intercepts and reports network errors
 */
export function useNetworkErrorAwareAdapter(
  adapter: ContractAdapter | null
): ContractAdapter | null {
  const { reportNetworkError } = useNetworkErrors();
  const wrappedAdapterRef = useRef<ContractAdapter | null>(null);

  useEffect(() => {
    if (!adapter) {
      wrappedAdapterRef.current = null;
      return;
    }

    // Create a proxy that wraps the adapter to intercept errors
    const wrappedAdapter = new Proxy(adapter, {
      get(target, prop, receiver): unknown {
        const value = Reflect.get(target, prop, receiver);

        // Wrap async methods that might throw network errors
        if (
          typeof value === 'function' &&
          (prop === 'queryViewFunction' || prop === 'loadContract')
        ) {
          return async (...args: unknown[]) => {
            try {
              return await value.apply(target, args);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';

              // Check if it's an RPC error
              if (
                errorMessage.toLowerCase().includes('rpc') ||
                errorMessage.toLowerCase().includes('network') ||
                errorMessage.toLowerCase().includes('timeout') ||
                errorMessage.toLowerCase().includes('fetch') ||
                errorMessage.toLowerCase().includes('connection')
              ) {
                reportNetworkError(
                  'rpc',
                  target.networkConfig.id,
                  target.networkConfig.name,
                  errorMessage
                );
              }

              // Check if it's an explorer error
              if (
                errorMessage.toLowerCase().includes('explorer') ||
                errorMessage.toLowerCase().includes('etherscan') ||
                errorMessage.toLowerCase().includes('api key') ||
                errorMessage.toLowerCase().includes('abi') ||
                errorMessage.toLowerCase().includes('verified')
              ) {
                reportNetworkError(
                  'explorer',
                  target.networkConfig.id,
                  target.networkConfig.name,
                  errorMessage
                );
              }

              // Re-throw the error to maintain normal error handling
              throw error;
            }
          };
        }

        return value;
      },
    }) as ContractAdapter;

    wrappedAdapterRef.current = wrappedAdapter;
  }, [adapter, reportNetworkError]);

  return wrappedAdapterRef.current;
}
