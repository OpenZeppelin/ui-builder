import { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';
import type {
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import { ContractAdapter } from '../../../adapters';

import { FunctionResult } from './FunctionResult';

interface ViewFunctionsPanelProps {
  functions: ContractFunction[];
  contractAddress: string;
  adapter: ContractAdapter;
  contractSchema: ContractSchema;
}

/**
 * Panel for displaying and querying simple view functions (functions without parameters)
 */
export function ViewFunctionsPanel({
  functions,
  contractAddress,
  adapter,
  contractSchema,
}: ViewFunctionsPanelProps) {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Query all view functions at once
  const handleQueryAll = async () => {
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
      setResults(newResults);
    } catch (err) {
      console.error('Error querying functions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-query all functions on component mount
  useEffect(() => {
    if (functions.length > 0) {
      void handleQueryAll();
    }
  }, [functions, contractAddress]); // Re-query when functions or contract address changes

  if (functions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No simple view functions found in this contract.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => void handleQueryAll()}
        disabled={isLoading}
        size="sm"
        className="text-xs w-full"
      >
        {isLoading ? 'Querying...' : 'Refresh All'}
      </Button>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {functions.map((func) => (
          <FunctionResult
            key={func.id}
            functionDetails={func}
            result={results[func.id]}
            loading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
