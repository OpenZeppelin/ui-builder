/**
 * useContractDefinition Hook
 *
 * A simple, declarative hook for loading contract definitions.
 * Handles all the complexity of deduplication, loading states, and error handling internally.
 */
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import {
  ContractDefinitionMetadata,
  ContractSchema,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { contractDefinitionService } from '../services/ContractDefinitionService';
import { ContractLoadResult } from '../services/ContractLoader';

interface UseContractDefinitionOptions {
  /**
   * Callback when contract definition is successfully loaded
   */
  onLoaded?: (
    schema: ContractSchema,
    formValues: FormValues,
    source: ContractLoadResult['source'],
    metadata?: ContractDefinitionMetadata,
    originalDefinition?: string
  ) => void;

  /**
   * Callback when loading fails
   */
  onError?: (error: Error) => void;
}

interface UseContractDefinitionReturn {
  /**
   * Manually trigger contract loading
   */
  load: (formValues: FormValues) => Promise<void>;

  /**
   * Whether any contract is currently loading
   */
  isLoading: boolean;

  /**
   * Last error, if any
   */
  error: Error | null;

  /**
   * Clear any error state
   */
  clearError: () => void;
}

/**
 * Hook for loading contract definitions with automatic deduplication
 */
export function useContractDefinition(
  options: UseContractDefinitionOptions = {}
): UseContractDefinitionReturn {
  const { onLoaded, onError } = options;
  const { activeAdapter } = useWalletState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to service state changes
  useEffect(() => {
    const unsubscribe = contractDefinitionService.subscribe((state) => {
      setIsLoading(state.isLoading);
      setError(state.error);
    });

    return unsubscribe;
  }, []);

  const handleSuccess = useCallback(
    (result: ContractLoadResult, formValues: FormValues) => {
      if (onLoaded) {
        // Convert metadata format
        const metadata: ContractDefinitionMetadata | undefined = result.metadata
          ? {
              fetchedFrom: result.metadata.fetchedFrom,
              contractName: result.metadata.contractName,
              verificationStatus: result.metadata.verificationStatus,
              fetchTimestamp: result.metadata.fetchTimestamp,
              definitionHash: result.metadata.definitionHash,
            }
          : undefined;

        onLoaded(
          result.schema,
          formValues,
          result.source,
          metadata,
          result.contractDefinitionOriginal
        );
      }
    },
    [onLoaded]
  );

  const handleError = useCallback(
    (err: Error) => {
      logger.error('useContractDefinition', 'Failed to load contract definition:', err);

      if (onError) {
        onError(err);
      } else {
        // Default error handling
        toast.error('Failed to load contract', {
          description: err.message,
        });
      }
    },
    [onError]
  );

  const load = useCallback(
    async (formValues: FormValues): Promise<void> => {
      if (!activeAdapter) {
        throw new Error('No active adapter available');
      }

      if (!formValues.contractAddress || typeof formValues.contractAddress !== 'string') {
        throw new Error('Contract address is required');
      }

      try {
        await contractDefinitionService.loadContractDefinition(
          {
            adapter: activeAdapter,
            formValues,
            networkId: activeAdapter.networkConfig.id,
            contractAddress: formValues.contractAddress,
          },
          handleSuccess
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        handleError(error);
        throw error;
      }
    },
    [activeAdapter, handleSuccess, handleError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    load,
    isLoading,
    error,
    clearError,
  };
}
