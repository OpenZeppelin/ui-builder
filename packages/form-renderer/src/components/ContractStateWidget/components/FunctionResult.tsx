import { JSX } from 'react';

import type { ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

interface FunctionResultProps {
  functionDetails: ContractFunction;
  result?: string;
  loading: boolean;
}

/**
 * Component for displaying formatted function results (strings)
 */
export function FunctionResult({
  functionDetails,
  result,
  loading,
}: FunctionResultProps): JSX.Element {
  const formattedResult = result ?? '';
  const hasResult = typeof result === 'string';
  const isError = hasResult && (result.startsWith('Error:') || result.startsWith('[Error:'));

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
        <div className="text-xs text-muted-foreground italic animate-pulse">Loading...</div>
      ) : hasResult ? (
        <pre
          className={`text-xs p-1 max-h-24 bg-muted overflow-auto rounded whitespace-pre-wrap break-all ${
            isError ? 'text-destructive' : ''
          }`}
        >
          {formattedResult}
        </pre>
      ) : (
        <div className="text-xs text-muted-foreground italic">Click Refresh to fetch result</div>
      )}
    </div>
  );
}
