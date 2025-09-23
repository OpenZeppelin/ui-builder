import { Key, User } from 'lucide-react';
import React from 'react';

import type { EoaExecutionConfig } from '@openzeppelin/ui-builder-types';
import { AddressDisplay } from '@openzeppelin/ui-builder-ui';

interface EoaConfigDetailsProps {
  config: EoaExecutionConfig;
}

export const EoaConfigDetails: React.FC<EoaConfigDetailsProps> = ({ config }) => (
  <div className="space-y-4">
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <User className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Externally Owned Account (EOA)</h4>
        <p className="text-sm text-muted-foreground">
          Transaction will be executed directly from the connected wallet.
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Key className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Execution Restrictions</h4>
        <p className="text-sm text-muted-foreground">
          {config.allowAny
            ? 'Any connected wallet can try to execute this transaction.'
            : config.specificAddress
              ? 'Only this address can try to execute this transaction:'
              : 'No specific address restrictions defined.'}
        </p>
        {config.specificAddress && !config.allowAny && (
          <AddressDisplay className="mt-2" address={config.specificAddress} />
        )}
      </div>
    </div>
  </div>
);
