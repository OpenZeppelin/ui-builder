import { Download, Edit, GitBranch } from 'lucide-react';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

export interface ContractDefinitionSourceIndicatorProps {
  source: 'fetched' | 'manual';
  fetchedFrom?: string;
  lastFetched?: Date;
  className?: string;
}

const sourceConfig = {
  fetched: {
    icon: Download,
    label: 'Fetched',
    variant: 'default' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Contract schema was automatically fetched from block explorer',
  },
  manual: {
    icon: Edit,
    label: 'Manual',
    variant: 'secondary' as const,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Contract schema was manually entered by user',
  },
};

/**
 * Component for displaying contract schema source information with tooltips
 */
export const ContractDefinitionSourceIndicator: React.FC<
  ContractDefinitionSourceIndicatorProps
> = ({ source, fetchedFrom, lastFetched, className }) => {
  const config = sourceConfig[source];
  const Icon = config.icon;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getTooltipContent = () => {
    let content = config.description;

    if (source === 'fetched' && fetchedFrom) {
      content += `\n\nSource: ${fetchedFrom}`;
    }

    if (lastFetched) {
      content += `\n\nLast fetched: ${formatTimestamp(lastFetched)}`;
    }

    return content;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 cursor-help rounded-full px-2 py-1 text-xs font-medium',
              config.bgColor,
              className
            )}
          >
            <Icon className={cn('h-3 w-3', config.color)} />
            <span className={config.color}>{config.label}</span>
            {source === 'fetched' && lastFetched && (
              <span className="text-xs opacity-70">({formatTimestamp(lastFetched)})</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="whitespace-pre-line text-sm">{getTooltipContent()}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
