import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Hash,
  Info,
  Loader2,
  Network,
  Timer,
} from 'lucide-react';

import React from 'react';

import type { RelayerDetails, RelayerDetailsRich } from '@openzeppelin/transaction-form-types';
import { cn } from '@openzeppelin/transaction-form-utils';

import { AddressDisplay } from '../ui/address-display';

export interface RelayerDetailsCardProps {
  details: RelayerDetails;
  enhancedDetails?: RelayerDetailsRich | null;
  loading?: boolean;
  className?: string;
}

export const RelayerDetailsCard: React.FC<RelayerDetailsCardProps> = ({
  details,
  enhancedDetails,
  loading = false,
  className,
}) => {
  const displayDetails = enhancedDetails || details;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={cn('flex items-start space-x-3 p-3 bg-slate-50 rounded-md', className)}>
      <Info className="size-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="space-y-3 flex-1">
        <div>
          <h4 className="text-sm font-medium mb-2">Relayer Details</h4>

          {/* Relayer Name and Status */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{displayDetails.name}</p>
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                displayDetails.paused || enhancedDetails?.systemDisabled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              )}
            >
              {displayDetails.paused || enhancedDetails?.systemDisabled ? (
                <>
                  <AlertCircle className="size-3 mr-1" />
                  {enhancedDetails?.systemDisabled ? 'System Disabled' : 'Paused'}
                </>
              ) : (
                <>
                  <CheckCircle className="size-3 mr-1" />
                  Active
                </>
              )}
            </span>
          </div>

          {/* Relayer Address */}
          <AddressDisplay
            className="mb-3"
            address={displayDetails.address}
            truncate={false}
            showCopyButton
          />

          {/* Additional Details */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Network className="size-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Network:</span> {displayDetails.network}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Relayer ID:</span>{' '}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                {displayDetails.relayerId}
              </code>
            </p>
          </div>

          {/* Enhanced Details Section */}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading additional details...
            </div>
          )}

          {!loading && enhancedDetails && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              {/* Balance */}
              {enhancedDetails.balance && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">Balance:</span> {enhancedDetails.balance}
                  </span>
                </div>
              )}

              {/* Nonce */}
              {enhancedDetails.nonce && (
                <div className="flex items-center gap-2 text-xs">
                  <Hash className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">Nonce:</span> {enhancedDetails.nonce}
                  </span>
                </div>
              )}

              {/* Pending Transactions */}
              {enhancedDetails.pendingTransactionsCount !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Timer className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">Pending Transactions:</span>{' '}
                    {enhancedDetails.pendingTransactionsCount}
                  </span>
                </div>
              )}

              {/* Last Transaction */}
              {enhancedDetails.lastConfirmedTransactionTimestamp && (
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">
                    <span className="font-medium">Last Transaction:</span>
                    <br />
                    <span className="text-xs">
                      {formatTimestamp(enhancedDetails.lastConfirmedTransactionTimestamp)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning if relayer is paused or system disabled */}
        {(displayDetails.paused || enhancedDetails?.systemDisabled) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <p className="text-xs text-red-700 flex items-start gap-1">
              <AlertCircle className="size-3 mt-0.5 flex-shrink-0" />
              {enhancedDetails?.systemDisabled
                ? 'This relayer has been disabled by the system and cannot process transactions.'
                : 'This relayer is currently paused and cannot process transactions.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
