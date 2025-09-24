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

import type { RelayerDetails, RelayerDetailsRich } from '@openzeppelin/ui-builder-types';
import { cn } from '@openzeppelin/ui-builder-utils';

import { AddressDisplay } from '../ui/address-display';

export interface RelayerDetailsCardProps {
  details: RelayerDetails;
  enhancedDetails?: RelayerDetailsRich | null;
  loading?: boolean;
  className?: string;
  /** Optional UI labels to override default copy */
  labels?: Partial<{
    detailsTitle: string;
    active: string;
    paused: string;
    systemDisabled: string;
    network: string;
    relayerId: string;
    balance: string;
    nonce: string;
    pending: string;
    lastTransaction: string;
  }>;
}

export const RelayerDetailsCard: React.FC<RelayerDetailsCardProps> = ({
  details,
  enhancedDetails,
  loading = false,
  className,
  labels,
}) => {
  const displayDetails = enhancedDetails || details;

  const l = {
    detailsTitle: labels?.detailsTitle || 'Relayer Details',
    active: labels?.active || 'Active',
    paused: labels?.paused || 'Paused',
    systemDisabled: labels?.systemDisabled || 'System Disabled',
    network: labels?.network || 'Network',
    relayerId: labels?.relayerId || 'Relayer ID',
    balance: labels?.balance || 'Balance',
    nonce: labels?.nonce || 'Nonce',
    pending: labels?.pending || 'Pending Transactions',
    lastTransaction: labels?.lastTransaction || 'Last Transaction',
  } as const;

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
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-slate-50 rounded-md',
        className
      )}
    >
      <Info className="size-5 text-primary mt-0.5 flex-shrink-0 hidden sm:block" />
      <div className="space-y-3 flex-1 min-w-0">
        <div>
          <h4 className="text-sm font-medium mb-2">{l.detailsTitle}</h4>

          {/* Relayer Name and Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <p className="text-sm font-medium text-foreground truncate">{displayDetails.name}</p>
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium self-start',
                displayDetails.paused || enhancedDetails?.systemDisabled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              )}
            >
              {displayDetails.paused || enhancedDetails?.systemDisabled ? (
                <>
                  <AlertCircle className="size-3 mr-1" />
                  {enhancedDetails?.systemDisabled ? l.systemDisabled : l.paused}
                </>
              ) : (
                <>
                  <CheckCircle className="size-3 mr-1" />
                  {l.active}
                </>
              )}
            </span>
          </div>

          {/* Relayer Address */}
          <div className="mb-3">
            <AddressDisplay
              className="w-full sm:w-auto"
              address={displayDetails.address}
              truncate={true}
              startChars={6}
              endChars={4}
              showCopyButton
            />
          </div>

          {/* Additional Details */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Network className="size-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-medium">{l.network}:</span> {displayDetails.network}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Hash className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground min-w-0 flex-1">
                <span className="font-medium">{l.relayerId}:</span>{' '}
                <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded break-all">
                  {displayDetails.relayerId}
                </code>
              </div>
            </div>
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
                  <DollarSign className="size-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="text-muted-foreground min-w-0 flex-1">
                    <span className="font-medium">{l.balance}:</span>{' '}
                    <span className="break-all">{enhancedDetails.balance}</span>
                  </div>
                </div>
              )}

              {/* Nonce */}
              {enhancedDetails.nonce && (
                <div className="flex items-center gap-2 text-xs">
                  <Hash className="size-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">{l.nonce}:</span> {enhancedDetails.nonce}
                  </span>
                </div>
              )}

              {/* Pending Transactions */}
              {enhancedDetails.pendingTransactionsCount !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Timer className="size-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">{l.pending}:</span>{' '}
                    {enhancedDetails.pendingTransactionsCount}
                  </span>
                </div>
              )}

              {/* Last Transaction */}
              {enhancedDetails.lastConfirmedTransactionTimestamp && (
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="size-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-muted-foreground min-w-0 flex-1">
                    <span className="font-medium">{l.lastTransaction}:</span>
                    <br />
                    <span className="text-xs break-words">
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
              <span className="min-w-0 flex-1">
                {enhancedDetails?.systemDisabled
                  ? 'This relayer has been disabled by the system and cannot process transactions.'
                  : 'This relayer is currently paused and cannot process transactions.'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
