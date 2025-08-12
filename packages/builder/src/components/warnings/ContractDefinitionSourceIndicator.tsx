import { Clock, Download, Edit, ExternalLink } from 'lucide-react';
import React from 'react';

import { cn, formatTimestamp } from '@openzeppelin/contracts-ui-builder-utils';

export interface ContractDefinitionSourceIndicatorProps {
  source: 'fetched' | 'manual';
  fetchedFrom?: string;
  lastFetched?: Date;
  className?: string;
  hasError?: boolean;
}

const sourceConfig = {
  fetched: {
    icon: Download,
    label: 'Fetched',
    description: 'Contract schema was automatically fetched from block explorer',
  },
  manual: {
    icon: Edit,
    label: 'Manual',
    description: 'Contract schema was manually entered by user',
  },
};

/**
 * Component for displaying contract schema source information
 * Shows source directly in the badge with clickable link if available
 */
export const ContractDefinitionSourceIndicator: React.FC<
  ContractDefinitionSourceIndicatorProps
> = ({ source, fetchedFrom, lastFetched, className, hasError = false }) => {
  const config = sourceConfig[source];
  const Icon = config.icon;

  // Determine styling based on error state (similar to ExecutionMethodTrigger)
  const iconColorClass = hasError ? 'text-red-500' : 'text-muted-foreground';
  const borderColorClass = hasError ? 'border-red-300' : 'border-slate-200';
  const bgColorClass = hasError ? 'bg-red-50' : 'bg-white';
  const textColorClass = hasError ? 'text-red-800' : 'text-slate-700';

  // Extract domain from URL for display
  const getDisplaySource = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div
      className={cn(
        // Full-width on mobile to avoid horizontal overflow; stacked layout
        'flex flex-col gap-1 px-3 py-2 text-xs rounded-md border w-full max-w-full',
        'transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
        borderColorClass,
        bgColorClass,
        textColorClass,
        className
      )}
    >
      {/* Row 1: Source label */}
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', iconColorClass)} aria-hidden="true" />
        <span className="font-semibold">Source:</span>
        <span className="uppercase">{config.label}</span>
      </div>

      {/* Row 2: Details (URL and/or time) */}
      {source === 'fetched' && (fetchedFrom || lastFetched) && (
        <div className="flex items-center gap-3 flex-wrap">
          {fetchedFrom && (
            <a
              href={fetchedFrom}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 hover:underline break-all',
                hasError ? 'text-red-600 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'
              )}
            >
              <span className="font-medium">{getDisplaySource(fetchedFrom)}</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
          {lastFetched && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className={cn('h-3 w-3', iconColorClass)} aria-hidden="true" />
              <span className="font-medium">{formatTimestamp(lastFetched)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
