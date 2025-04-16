import React from 'react';

import type { ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

interface FunctionResultProps {
  functionDetails: ContractFunction;
  result?: unknown;
  loading: boolean;
}

/**
 * Component for displaying function results
 */
export function FunctionResult({ functionDetails, result, loading }: FunctionResultProps) {
  const formatResult = (result: unknown): React.ReactNode => {
    if (result === undefined) {
      return null;
    }

    if (typeof result === 'object' && result !== null) {
      // For complex objects/arrays, show as JSON
      return (
        <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    }

    // For simple values
    return <span className="font-mono text-sm">{String(result)}</span>;
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {functionDetails.displayName || functionDetails.name}
        </div>
        {loading && <div className="text-xs text-muted-foreground">Loading...</div>}
      </div>

      {result !== undefined && <div className="mt-2">{formatResult(result)}</div>}
    </div>
  );
}
