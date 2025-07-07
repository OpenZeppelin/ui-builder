import React from 'react';

import { ExternalLink } from '@openzeppelin/transaction-form-ui';

export function RelayerHeader(): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold truncate">Relayer Configuration</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          Configure OpenZeppelin Relayer service for gasless transaction execution
        </p>
      </div>
      <ExternalLink href="https://docs.openzeppelin.com/relayer" className="text-sm flex-shrink-0">
        View Docs
      </ExternalLink>
    </div>
  );
}
