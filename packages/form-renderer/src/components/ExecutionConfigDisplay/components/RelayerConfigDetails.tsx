import { Info, Shield } from 'lucide-react';

import React from 'react';

import type { RelayerExecutionConfig } from '@openzeppelin/transaction-form-types';
import { AddressDisplay } from '@openzeppelin/transaction-form-ui';

interface RelayerConfigDetailsProps {
  config: RelayerExecutionConfig;
}

export const RelayerConfigDetails: React.FC<RelayerConfigDetailsProps> = ({ config }) => (
  <div className="space-y-4">
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Shield className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">OpenZeppelin Relayer</h4>
        <p className="text-sm text-muted-foreground">
          Transaction will be sent via the selected OpenZeppelin Relayer.
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Info className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Relayer Details</h4>
        <p className="text-sm text-muted-foreground">Name: {config.relayer.name}</p>
        <AddressDisplay className="mt-2" address={config.relayer.address} />
      </div>
    </div>
  </div>
);
