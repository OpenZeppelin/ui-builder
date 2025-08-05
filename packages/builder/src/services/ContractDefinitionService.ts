/**
 * Contract Definition Service
 *
 * A centralized service that handles contract definition loading with automatic
 * deduplication, state management, and error handling.
 *
 * TODO: Consider migrating to TanStack Query which would provide:
 * - Built-in request deduplication
 * - Automatic caching with configurable stale times
 * - Background refetching on focus/reconnect
 * - Optimistic updates
 * - Better error handling with retry strategies
 * - Integration with React Suspense and Error Boundaries
 * - DevTools for debugging query states
 */
import { ContractAdapter, FormValues } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { ContractLoadResult, loadContractDefinitionWithMetadata } from './ContractLoader';

/**
 * Contract definition request configuration
 */
interface ContractDefinitionRequest {
  adapter: ContractAdapter;
  formValues: FormValues;
  networkId: string;
  contractAddress: string;
}

/**
 * Loading state for a contract definition
 */
interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  lastLoaded: string | null; // Request key of last successful load
}

/**
 * Contract definition service with automatic deduplication and state management
 */
class ContractDefinitionService {
  private loadingStates = new Map<string, LoadingState>();
  private callbacks = new Set<(state: LoadingState & { requestKey: string }) => void>();

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(networkId: string, contractAddress: string): string {
    return `${networkId}:${contractAddress.toLowerCase()}`;
  }

  /**
   * Get current loading state for a request
   */
  getLoadingState(networkId: string, contractAddress: string): LoadingState {
    const key = this.getRequestKey(networkId, contractAddress);
    return (
      this.loadingStates.get(key) || {
        isLoading: false,
        error: null,
        lastLoaded: null,
      }
    );
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(callback: (state: LoadingState & { requestKey: string }) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify subscribers of state changes
   */
  private notify(requestKey: string, state: LoadingState): void {
    this.loadingStates.set(requestKey, state);
    this.callbacks.forEach((callback) => callback({ ...state, requestKey }));
  }

  /**
   * Load contract definition with automatic deduplication
   * Returns true if load was initiated, false if skipped
   */
  async loadContractDefinition(
    request: ContractDefinitionRequest,
    onSuccess: (result: ContractLoadResult, formValues: FormValues) => void
  ): Promise<boolean> {
    const { adapter, formValues, networkId, contractAddress } = request;
    const requestKey = this.getRequestKey(networkId, contractAddress);
    const currentState = this.getLoadingState(networkId, contractAddress);

    // Skip if already loading
    if (currentState.isLoading) {
      logger.info(
        'ContractDefinitionService',
        `Already loading ${contractAddress} on ${networkId}`
      );
      return false;
    }

    // Skip if we've already loaded this exact configuration
    if (currentState.lastLoaded === requestKey) {
      logger.info('ContractDefinitionService', `Already loaded ${contractAddress} on ${networkId}`);
      return false;
    }

    // Start loading
    this.notify(requestKey, {
      isLoading: true,
      error: null,
      lastLoaded: currentState.lastLoaded,
    });

    try {
      logger.info('ContractDefinitionService', `Loading ${contractAddress} on ${networkId}`);
      const result = await loadContractDefinitionWithMetadata(adapter, formValues);

      // Success
      this.notify(requestKey, {
        isLoading: false,
        error: null,
        lastLoaded: requestKey,
      });

      onSuccess(result, formValues);
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Error
      this.notify(requestKey, {
        isLoading: false,
        error: err,
        lastLoaded: currentState.lastLoaded,
      });

      throw err;
    }
  }

  /**
   * Reset loading state for a specific contract (useful when switching configurations)
   */
  reset(networkId?: string, contractAddress?: string): void {
    if (networkId && contractAddress) {
      const key = this.getRequestKey(networkId, contractAddress);
      this.loadingStates.delete(key);
      this.notify(key, {
        isLoading: false,
        error: null,
        lastLoaded: null,
      });
    } else {
      // Reset all
      this.loadingStates.clear();
    }
  }

  /**
   * Check if any contract is currently loading
   */
  get isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some((state) => state.isLoading);
  }
}

// Export singleton instance
export const contractDefinitionService = new ContractDefinitionService();
