import { RefreshCw } from 'lucide-react';

import { JSX, useCallback, useEffect, useState } from 'react';

import type {
  ContractAdapter,
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/contracts-ui-builder-types';
import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import {
  type RpcConfigEvent,
  cn,
  logger,
  rateLimitedBatch,
  userRpcConfigService,
} from '@openzeppelin/contracts-ui-builder-utils';

import { FunctionResult } from './FunctionResult';

interface ViewFunctionsPanelProps {
  functions: ContractFunction[];
  contractAddress: string;
  adapter: ContractAdapter;
  contractSchema: ContractSchema;
  className?: string;
}

/**
 * Panel for displaying and querying simple view functions (functions without parameters)
 */
export function ViewFunctionsPanel({
  functions,
  contractAddress,
  adapter,
  contractSchema,
  className,
}: ViewFunctionsPanelProps): JSX.Element {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [hasQueried, setHasQueried] = useState(false);
  const [isQueryInProgress, setIsQueryInProgress] = useState(false);

  // Query all view functions at once
  const handleQueryAll = useCallback(async () => {
    if (functions.length === 0) return;

    // Prevent duplicate queries
    if (isQueryInProgress) {
      logger.info('ViewFunctionsPanel', 'Query already in progress, skipping...');
      return;
    }

    setIsQueryInProgress(true);

    // Set all functions to loading state
    const initialLoadingStates: Record<string, boolean> = {};
    functions.forEach((func) => {
      initialLoadingStates[func.id] = true;
    });
    setLoadingStates(initialLoadingStates);

    try {
      // Create query functions with incremental result updates
      const queryFunctions = functions.map(
        (func) => async (): Promise<{ funcId: string; success: boolean }> => {
          try {
            const result = await adapter.queryViewFunction(
              contractAddress,
              func.id,
              [],
              contractSchema
            );

            // Format the result immediately
            let formattedResult: string;
            try {
              formattedResult = adapter.formatFunctionResult(result, func);
            } catch (formatError) {
              logger.error(
                'ViewFunctionsPanel',
                `Error formatting result for ${func.name}:`,
                formatError
              );
              formattedResult = `Error formatting result: ${formatError instanceof Error ? formatError.message : 'Unknown error'}`;
            }

            // Update results and loading state incrementally
            setResults((prev) => ({ ...prev, [func.id]: formattedResult }));
            setLoadingStates((prev) => ({ ...prev, [func.id]: false }));

            return { funcId: func.id, success: true };
          } catch (err) {
            logger.error('ViewFunctionsPanel', `Error calling ${func.name}:`, err);
            const errorMessage = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;

            // Update with error message and clear loading state
            setResults((prev) => ({ ...prev, [func.id]: errorMessage }));
            setLoadingStates((prev) => ({ ...prev, [func.id]: false }));

            return { funcId: func.id, success: false };
          }
        }
      );

      // Execute queries with rate limiting (1 at a time with 200ms delay between requests)
      await rateLimitedBatch(queryFunctions, 1, 200);
    } catch (err) {
      console.error('Error querying functions:', err);
      // Clear all loading states on error
      setLoadingStates({});
    } finally {
      setHasQueried(true);
      setIsQueryInProgress(false);
    }
  }, [functions, contractAddress, adapter, contractSchema, isQueryInProgress]);

  // Auto-query all functions on component mount
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const performInitialQuery = async (): Promise<void> => {
      if (functions.length > 0 && mounted && !hasQueried && !isQueryInProgress) {
        // Add a small delay to help with React StrictMode double mounting
        timeoutId = setTimeout(() => {
          if (mounted) {
            void handleQueryAll();
          }
        }, 100);
      }
    };

    void performInitialQuery();

    return (): void => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [functions.length, hasQueried, isQueryInProgress, handleQueryAll]);

  // Listen for RPC configuration changes
  useEffect(() => {
    // Get the network ID from the adapter
    const networkId = adapter.networkConfig?.id;
    if (!networkId) return;

    // Subscribe to RPC config changes for this network
    const unsubscribe = userRpcConfigService.subscribe(networkId, (event: RpcConfigEvent) => {
      logger.info('ViewFunctionsPanel', 'RPC configuration changed:', event);
      // Re-query all functions when RPC config changes
      void handleQueryAll();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [adapter.networkConfig?.id, handleQueryAll]);

  if (functions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No simple view functions found in this contract.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">View Functions</h4>
        <Button
          onClick={() => {
            setHasQueried(false);
            void handleQueryAll();
          }}
          disabled={isQueryInProgress}
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 rounded-full"
          title="Refresh all view functions"
        >
          <RefreshCw size={14} className={`${isQueryInProgress ? 'animate-spin' : ''}`} />
          <span className="sr-only">{isQueryInProgress ? 'Querying...' : 'Refresh All'}</span>
        </Button>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 flex-grow min-h-0">
        {functions.map((func) => (
          <FunctionResult
            key={func.id}
            functionDetails={func}
            result={results[func.id] as string | undefined}
            loading={loadingStates[func.id] || false}
          />
        ))}
      </div>
    </div>
  );
}
