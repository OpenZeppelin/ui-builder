import React from 'react';

import type { NetworkConfig } from '@openzeppelin/ui-builder-types';
import { cn } from '@openzeppelin/ui-builder-utils';

import { NetworkIcon } from './network-icon';

interface NetworkStatusBadgeProps {
  network: NetworkConfig | null;
  className?: string;
}

// Define constants for consistency
const ICON_SIZE = 16;

/**
 * NetworkStatusBadge - Displays network information in a compact badge format
 * Shows the network icon, ecosystem, and name with dashed borders for testnet/devnet
 */
export function NetworkStatusBadge({
  network,
  className,
}: NetworkStatusBadgeProps): React.ReactElement | null {
  if (!network) return null;

  const isTestnetLike = network.type === 'testnet' || network.type === 'devnet';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2',
        isTestnetLike ? 'border-2 border-dashed border-muted-foreground/40' : 'border-0',
        className
      )}
    >
      {/* Network icon */}
      <NetworkIcon network={network} size={ICON_SIZE} />

      {/* Combined ecosystem + network name */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {network.ecosystem}
        </span>
        <span className="text-xs font-medium">{network.name}</span>
      </div>
    </div>
  );
}
