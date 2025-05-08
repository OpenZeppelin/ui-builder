import React from 'react';

import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

import { NetworkStatusBadge } from './NetworkStatusBadge';
import { ViewContractStateButton } from './ViewContractStateButton';

interface ActionBarProps {
  network: NetworkConfig | null;
  contractAddress?: string | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
}

export function ActionBar({
  network,
  contractAddress = null,
  onToggleContractState,
  isWidgetExpanded = false,
}: ActionBarProps): React.ReactElement | null {
  if (!network) return null;

  return (
    <div className="flex items-center gap-2 mb-6">
      <NetworkStatusBadge network={network} />
      {contractAddress && onToggleContractState && !isWidgetExpanded && (
        <ViewContractStateButton
          contractAddress={contractAddress}
          onToggle={onToggleContractState}
        />
      )}
    </div>
  );
}
