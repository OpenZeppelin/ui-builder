import { useCallback, useRef, useState } from 'react';

import type { ContractAdapter, FormValues } from '@openzeppelin/ui-builder-types';
import { simpleHash } from '@openzeppelin/ui-builder-utils';

import { loadContractDefinitionWithMetadata } from '../../../../services/ContractLoader';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

/**
 * State for the circuit breaker pattern
 * Tracks failed attempts and timing to prevent excessive API calls
 */
interface CircuitBreakerState {
  key: string; // Unique identifier for the contract+definition combination
  attempts: number; // Number of consecutive failures
  lastFailure: number; // Timestamp of the last failure
}

interface UseContractLoaderProps {
  adapter: ContractAdapter | null;
  ignoreProxy: boolean;
}

/**
 * Hook for loading contract definitions with built-in error handling and rate limiting
 *
 * This hook provides:
 * 1. Contract definition loading from blockchain explorers (e.g., Etherscan)
 * 2. Circuit breaker pattern to prevent excessive failed API calls
 * 3. Proxy detection and handling (can be disabled with ignoreProxy)
 * 4. Loading state management
 *
 * TODO: Migrate to TanStack Query which would replace this entire hook with:
 * - Built-in loading states and error handling
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Cache management
 * - Background refetching
 * The circuit breaker pattern below could be replaced with React Query's retry configuration
 *
 * ## Circuit Breaker Pattern
 *
 * The circuit breaker prevents the application from making repeated failed requests
 * to external services. It works by:
 *
 * - Tracking failed attempts for each unique contract address + definition combination
 * - After 3 consecutive failures, blocking new attempts for 30 seconds
 * - Automatically resetting after a successful load
 * - Showing a user-friendly "circuit breaker active" state instead of repeated errors
 *
 * This protects against:
 * - Rate limiting from blockchain explorers
 * - Repeated failures for invalid/unverified contracts
 * - Poor user experience from constant error messages
 * - Unnecessary API quota consumption
 *
 * @param adapter - The blockchain-specific adapter for loading contracts
 * @param ignoreProxy - Whether to skip proxy detection and use the proxy's ABI directly
 */
export function useContractLoader({ adapter, ignoreProxy }: UseContractLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

  const loadingRef = useRef(false);
  const lastAttemptedRef = useRef<string>('');
  const circuitBreakerRef = useRef<CircuitBreakerState | null>(null);
  const ignoreProxyRef = useRef(ignoreProxy);

  // Keep ref in sync with prop
  ignoreProxyRef.current = ignoreProxy;

  /**
   * Load contract definition with circuit breaker protection
   *
   * @param data - Form values containing contract address and optional manual definition
   */
  const loadContract = useCallback(
    async (
      data: FormValues,
      options?: { skipProxyDetection?: boolean; treatAsImplementation?: boolean }
    ) => {
      if (!adapter || loadingRef.current) return;
      // Narrow contractAddress to string before validation
      const address =
        typeof data.contractAddress === 'string' ? data.contractAddress.trim() : undefined;
      if (!address) return;
      // Do not attempt loads for invalid/partial addresses while the user is typing
      if (!adapter.isValidAddress(address)) return;

      // Create unique key for this specific load attempt
      // This allows tracking failures per contract/definition combination
      const definitionHash =
        data.contractDefinition && typeof data.contractDefinition === 'string'
          ? simpleHash(data.contractDefinition)
          : 'no-abi';
      const attemptKey = `${address}-${definitionHash}`;
      const now = Date.now();

      // Circuit breaker check: Prevent repeated failures
      if (circuitBreakerRef.current) {
        const { key, attempts, lastFailure } = circuitBreakerRef.current;
        const timeSinceLastFailure = now - lastFailure;

        // If this same contract has failed 3+ times in the last 30 seconds, activate circuit breaker
        if (key === attemptKey && attempts >= 3 && timeSinceLastFailure < 30000) {
          setCircuitBreakerActive(true);
          // Show circuit breaker message for 5 seconds, then hide (user can retry after 30s total)
          setTimeout(() => setCircuitBreakerActive(false), 5000);
          return;
        }
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        // Add proxy detection options to form data for chain-specific adapters
        const enhancedData = {
          ...data,
          __proxyDetectionOptions: {
            skipProxyDetection:
              options && typeof options.skipProxyDetection === 'boolean'
                ? options.skipProxyDetection
                : ignoreProxyRef.current,
            treatAsImplementation:
              options && typeof options.treatAsImplementation === 'boolean'
                ? options.treatAsImplementation
                : false,
          },
        };

        const result = await loadContractDefinitionWithMetadata(adapter, enhancedData);

        // Reset circuit breaker on success
        circuitBreakerRef.current = null;

        uiBuilderStore.setContractDefinitionResult({
          schema: result.schema,
          formValues: data,
          source: result.source,
          metadata: result.metadata ?? {},
          original: result.contractDefinitionOriginal ?? '',
          proxyInfo: result.proxyInfo,
        });
      } catch (err) {
        // Update circuit breaker
        if (circuitBreakerRef.current?.key === attemptKey) {
          circuitBreakerRef.current.attempts += 1;
          circuitBreakerRef.current.lastFailure = now;
        } else {
          circuitBreakerRef.current = {
            key: attemptKey,
            attempts: 1,
            lastFailure: now,
          };
        }

        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        uiBuilderStore.setContractDefinitionError(errorMessage);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [adapter]
  );

  /**
   * Check if we should attempt to load based on form values
   * Prevents duplicate loads for the same form state
   */
  const canAttemptLoad = useCallback(
    (formValues: FormValues) => {
      if (loadingRef.current) return false;

      // Require a valid address before attempting any load
      const address =
        typeof formValues.contractAddress === 'string'
          ? formValues.contractAddress.trim()
          : undefined;
      if (!address || (adapter && !adapter.isValidAddress(address))) return false;

      const currentAttempt = JSON.stringify(formValues);
      return currentAttempt !== lastAttemptedRef.current;
    },
    [adapter]
  );

  /**
   * Mark form values as attempted to prevent duplicate loads
   */
  const markAttempted = useCallback((formValues: FormValues) => {
    lastAttemptedRef.current = JSON.stringify(formValues);
  }, []);

  return {
    // State
    isLoading, // Whether a contract is currently being loaded
    circuitBreakerActive, // Whether circuit breaker is preventing loads

    // Actions
    loadContract, // Main function to load a contract definition (supports proxy detection options)
    canAttemptLoad, // Check if load should be attempted
    markAttempted, // Mark form values as attempted

    // Internal state (for debugging)
    loadingRef, // Direct ref access for edge cases
  };
}
