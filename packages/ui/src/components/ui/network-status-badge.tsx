import { NetworkIcon } from '@web3icons/react';
import React from 'react';

import type { NetworkConfig } from '@openzeppelin/ui-builder-types';
import { cn } from '@openzeppelin/ui-builder-utils';

import MidnightLogoSvg from '../../assets/icons/MidnightLogo.svg';

interface NetworkStatusBadgeProps {
  network: NetworkConfig | null;
  className?: string;
}

// Define constants for consistency
const ICON_SIZE = 16;

function getNetworkIconName(network: NetworkConfig): string | null {
  // TODO: submit a PR to web3icons to add midnight to the list of networks
  if (network.ecosystem === 'midnight') {
    return null;
  }
  return network.icon || network.network.toLowerCase();
}

/**
 * NetworkStatusBadge - Displays network information in a compact badge format
 * Shows the network icon, ecosystem, and name with dashed borders for testnet/devnet
 */
export function NetworkStatusBadge({
  network,
  className,
}: NetworkStatusBadgeProps): React.ReactElement | null {
  if (!network) return null;

  const iconName = getNetworkIconName(network);
  const isTestnetLike = network.type === 'testnet' || network.type === 'devnet';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2',
        isTestnetLike ? 'border-2 border-dashed border-muted-foreground/40' : 'border-0',
        className
      )}
    >
      {/* Network icon - reusing same icon component from NetworkRow */}
      {network.ecosystem === 'midnight' ? (
        <img src={MidnightLogoSvg} alt="Midnight" width={ICON_SIZE} height={ICON_SIZE} />
      ) : iconName ? (
        <NetworkIcon name={iconName} size={ICON_SIZE} variant="branded" />
      ) : (
        <div className="bg-muted-foreground/20 flex-shrink-0 h-4 w-4 rounded-full"></div>
      )}

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
