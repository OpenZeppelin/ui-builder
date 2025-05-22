import { RefreshCw } from 'lucide-react';

import { JSX, useCallback, useEffect, useState } from 'react';

import type {
  ContractFunction,
  ContractSchema,
  FullContractAdapter,
} from '@openzeppelin/transaction-form-types';
import { Button } from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

import { FunctionResult } from './FunctionResult';

interface ViewFunctionsPanelProps {
  functions: ContractFunction[];
  contractAddress: string;
  adapter: FullContractAdapter;
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
  const [isLoading, setIsLoading] = useState(false);

  // Query all view functions at once
  const handleQueryAll = useCallback(async () => {
    if (functions.length === 0) return;

    setIsLoading(true);
    const newResults: Record<string, unknown> = {};

    try {
      // Create an array of promises for all function queries
      const queries = functions.map(async (func) => {
        try {
          const result = await adapter.queryViewFunction(
            contractAddress,
            func.id,
            [],
            contractSchema
          );
          newResults[func.id] = result;
        } catch (err) {
          console.error(`Error calling ${func.name}:`, err);
          newResults[func.id] = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }
      });

      // Wait for all queries to complete
      await Promise.all(queries);

      // Format results using the adapter
      const formattedResults: Record<string, string> = {};
      for (const func of functions) {
        if (func.id in newResults) {
          // Only format if the query didn't already return an error string
          if (
            typeof newResults[func.id] !== 'string' ||
            !newResults[func.id]?.toString().startsWith('Error:')
          ) {
            formattedResults[func.id] = adapter.formatFunctionResult(newResults[func.id], func);
          } else {
            formattedResults[func.id] = newResults[func.id] as string; // Keep error string
          }
        } else {
          // Handle cases where query might not have even populated (should be rare)
          formattedResults[func.id] = '[Error: Query did not return data]';
        }
      }

      setResults(formattedResults);
    } catch (err) {
      console.error('Error querying functions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [functions, contractAddress, adapter, contractSchema]);

  // Auto-query all functions on component mount
  useEffect(() => {
    if (functions.length > 0) {
      void handleQueryAll();
    }
  }, [functions, contractAddress, handleQueryAll]); // Re-query when functions or contract address changes

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
          onClick={() => void handleQueryAll()}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 rounded-full"
          title="Refresh all view functions"
        >
          <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">{isLoading ? 'Querying...' : 'Refresh All'}</span>
        </Button>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 flex-grow min-h-0">
        {functions.map((func) => (
          <FunctionResult
            key={func.id}
            functionDetails={func}
            result={results[func.id] as string | undefined}
            loading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
