import { CheckCircle, Zap } from 'lucide-react';

import React from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@openzeppelin/contracts-ui-builder-ui';
import type { ContractAdapter } from '@openzeppelin/transaction-form-types';

interface RelayerGasConfigurationCardProps {
  isActive: boolean;
  adapter: ContractAdapter | null;
  transactionOptions: Record<string, unknown>;
  onSetupStepChange: (step: 'configuration') => void;
  onTransactionOptionsChange: (options: Record<string, unknown>) => void;
}

export function RelayerGasConfigurationCard({
  isActive,
  adapter,
  transactionOptions,
  onSetupStepChange,
  onTransactionOptionsChange,
}: RelayerGasConfigurationCardProps): React.ReactElement {
  const hasCustomOptions =
    transactionOptions.speed || transactionOptions.gasPrice || transactionOptions.maxFeePerGas;

  if (!adapter?.getRelayerOptionsComponent) {
    return <></>;
  }

  return (
    <Card className={isActive ? '' : ''}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div
              className={`rounded-md p-0.5 ${
                hasCustomOptions ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
              }`}
            >
              {hasCustomOptions ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <span className="block w-5 h-5 text-center text-xs font-medium leading-5">3</span>
              )}
            </div>
            <CardTitle className="text-base">Gas Configuration</CardTitle>
          </div>
        </div>
        <CardDescription className="mt-1">
          {isActive
            ? 'Customize gas pricing strategy for transaction submission'
            : 'Using recommended gas configuration for reliable transactions'}
        </CardDescription>
      </CardHeader>

      {!isActive && (
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1.5 mt-0.5 flex-shrink-0">
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Fast Speed Preset Active
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Transactions will use high priority gas pricing for quick inclusion
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onSetupStepChange('configuration')}
                className="w-full sm:flex-1"
                type="button"
              >
                Customize Gas Settings
              </Button>
              <p className="text-xs text-muted-foreground self-start sm:self-center">(Optional)</p>
            </div>
          </div>
        </CardContent>
      )}

      {isActive && (
        <CardContent>
          {(() => {
            const RelayerOptionsComponent = adapter.getRelayerOptionsComponent();
            if (!RelayerOptionsComponent) return null;

            return (
              <RelayerOptionsComponent
                options={transactionOptions}
                onChange={onTransactionOptionsChange}
              />
            );
          })()}
        </CardContent>
      )}
    </Card>
  );
}
