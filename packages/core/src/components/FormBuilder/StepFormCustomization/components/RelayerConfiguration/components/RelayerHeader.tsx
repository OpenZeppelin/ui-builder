import React from 'react';

import { ExternalLink } from '@openzeppelin/transaction-form-ui';

export function RelayerHeader(): React.ReactElement {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold">Relayer Configuration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure OpenZeppelin Relayer service for gasless transaction execution
        </p>
      </div>
      <ExternalLink href="https://docs.openzeppelin.com/relayer" className="text-sm">
        View Docs
      </ExternalLink>
    </div>
  );
}
