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
  // Format result for display
  const formatResult = (rawResult: unknown): string => {
    if (rawResult === undefined) return '';
    if (rawResult === null) return 'null';
    if (typeof rawResult === 'string' && rawResult.startsWith('Error:')) return rawResult;

    try {
      // Compact JSON without indentation
      return JSON.stringify(rawResult, null, 0);
    } catch {
      return String(rawResult);
    }
  };

  const formattedResult = formatResult(result);
  const hasResult = result !== undefined;
  const isError = typeof result === 'string' && result.startsWith('Error:');
  const outputs = functionDetails.outputs || [];

  return (
    <div className="border rounded-sm p-2">
      <div className="text-xs font-medium mb-1">
        {functionDetails.name}
        {outputs.length > 0 && (
          <span className="text-muted-foreground ml-2">
            {`→ ${outputs.map((o) => o.type).join(', ')}`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground italic">Loading...</div>
      ) : hasResult ? (
        <pre
          className={`text-xs p-1 max-h-24 bg-muted overflow-auto rounded whitespace-pre-wrap break-all ${
            isError ? 'text-destructive' : ''
          }`}
        >
          {formattedResult}
        </pre>
      ) : (
        <div className="text-xs text-muted-foreground italic">Click Query All to fetch result</div>
      )}
    </div>
  );
}
