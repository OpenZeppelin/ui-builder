import React from 'react';

import { ExternalLink } from '@openzeppelin/ui-components';

export function RelayerHeader(): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold truncate">Relayer Configuration</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          Configure OpenZeppelin Relayer service for gasless transaction execution
        </p>
      </div>
      <ExternalLink
        href="https://docs.openzeppelin.com/relayer"
        className="text-sm flex-shrink-0 self-start"
      >
        View Docs
      </ExternalLink>
    </div>
  );
}
