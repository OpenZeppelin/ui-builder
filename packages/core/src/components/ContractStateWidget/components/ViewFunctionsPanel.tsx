import { useState } from 'react';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Query all functions at once
  const queryAllFunctions = async () => {
    setLoading(true);
    setError(null);

    // Validate contract address first
    if (!contractAddress || contractAddress.trim() === '') {
      setError('Contract address is empty or not provided');
      setLoading(false);
      return;
    }

    try {
      const newResults: Record<string, unknown> = {};

      // Query each function sequentially
      for (const fn of functions) {
        try {
          const result = await adapter.queryViewFunction(
            contractAddress,
            fn.id,
            [], // No params for simple view functions
            contractSchema
          );
          newResults[fn.id] = adapter.formatFunctionResult(result, fn);
        } catch (fnError) {
          newResults[fn.id] = `Error: ${(fnError as Error).message}`;
        }
      }

      setResults(newResults);
    } catch (err) {
      setError(`Failed to query functions: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  if (functions.length === 0) {
    return <div className="text-sm text-muted-foreground">No simple view functions available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => void queryAllFunctions()} disabled={loading} size="sm">
          {loading ? 'Querying...' : 'Query All'}
        </Button>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="space-y-3">
        {functions.map((fn) => (
          <FunctionResult
            key={fn.id}
            functionDetails={fn}
            result={results[fn.id]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
