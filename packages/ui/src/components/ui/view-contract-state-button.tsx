import { FileText } from 'lucide-react';
import React from 'react';

import { truncateMiddle } from '@openzeppelin/contracts-ui-builder-utils';

import { Button } from './button';

interface ViewContractStateButtonProps {
  contractAddress: string | null;
  onToggle: () => void;
}

/**
 * ViewContractStateButton - A button to toggle the contract state widget
 * Shows the contract address in a truncated format
 */
export function ViewContractStateButton({
  contractAddress,
  onToggle,
}: ViewContractStateButtonProps): React.ReactElement | null {
  if (!contractAddress) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="px-3 py-2 h-auto gap-2 items-start justify-start sm:items-center"
      onClick={onToggle}
      title="Show Contract State"
    >
      <FileText size={16} className="shrink-0 self-center" />
      <span className="flex flex-col sm:flex-row sm:items-center text-left leading-tight">
        <span className="text-sm font-medium">View Contract State</span>
        <span className="text-xs text-muted-foreground sm:ml-1">
          ({truncateMiddle(contractAddress)})
        </span>
      </span>
    </Button>
  );
}
