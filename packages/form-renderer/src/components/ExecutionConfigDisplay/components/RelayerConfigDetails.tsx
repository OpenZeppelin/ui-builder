import { Network, Shield } from 'lucide-react';

import React from 'react';

import type {
  RelayerDetailsRich,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';
import { RelayerDetailsCard } from '@openzeppelin/transaction-form-ui';

import { ExecutionConfigCard } from './ExecutionConfigCard';

interface RelayerConfigDetailsProps {
  config: RelayerExecutionConfig;
  enhancedDetails?: RelayerDetailsRich | null;
  loading?: boolean;
}

export const RelayerConfigDetails: React.FC<RelayerConfigDetailsProps> = ({
  config,
  enhancedDetails,
  loading = false,
}) => {
  const { relayer } = config;

  return (
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

      <RelayerDetailsCard details={relayer} enhancedDetails={enhancedDetails} loading={loading} />

      {/* Service Information */}
      <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
        <Network className="size-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium mb-1">Service Endpoint</h4>
          <p className="text-xs text-muted-foreground font-mono break-all">{config.serviceUrl}</p>
        </div>
      </div>

      {/* Execution Configuration */}
      <ExecutionConfigCard config={config} />
    </div>
  );
};
