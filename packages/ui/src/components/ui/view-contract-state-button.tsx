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
      className="gap-2 h-9 px-3 py-2"
      onClick={onToggle}
      title="Show Contract State"
    >
      <FileText size={16} className="shrink-0" />
      <span className="text-sm font-medium">View Contract State</span>
      <span className="ml-1 text-xs text-muted-foreground">
        ({truncateMiddle(contractAddress)})
      </span>
    </Button>
  );
}
