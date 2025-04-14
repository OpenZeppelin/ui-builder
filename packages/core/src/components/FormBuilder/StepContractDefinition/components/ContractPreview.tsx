import React from 'react';

import { ContractPreviewProps } from '../types';

export function ContractPreview({
  contractSchema,
}: ContractPreviewProps): React.ReactElement | null {
  if (!contractSchema) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="space-y-1">
        <h4 className="text-base font-medium">ABI Preview</h4>
        <p className="text-muted-foreground text-sm">
          Contract {contractSchema.name} loaded successfully with {contractSchema.functions.length}{' '}
          functions.
        </p>
      </div>
      <div className="max-h-80 overflow-auto rounded-md border bg-muted p-4">
        <pre className="text-xs font-mono">{JSON.stringify(contractSchema, null, 2)}</pre>
      </div>
    </div>
  );
}
