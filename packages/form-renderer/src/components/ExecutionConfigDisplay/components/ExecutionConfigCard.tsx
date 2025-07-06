import { Settings } from 'lucide-react';

import React from 'react';

import type { RelayerExecutionConfig } from '@openzeppelin/transaction-form-types';

interface ExecutionConfigCardProps {
  config: RelayerExecutionConfig;
}

export const ExecutionConfigCard: React.FC<ExecutionConfigCardProps> = ({ config }) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Settings className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-medium mb-1">Execution Configuration</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Configuration parameters that will be used for transaction execution.
        </p>

        <div className="space-y-2">
          {config.transactionOptions && Object.keys(config.transactionOptions).length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Transaction Options:
              </span>
              <div className="mt-1 bg-white border rounded p-2">
                {Object.entries(config.transactionOptions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1 border-b last:border-b-0"
                  >
                    <span className="text-xs font-mono text-slate-600">{key}:</span>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!config.transactionOptions || Object.keys(config.transactionOptions).length === 0) && (
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Transaction Options:
              </span>
              <span className="text-xs text-muted-foreground ml-2">None configured</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
