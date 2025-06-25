import { NetworkIcon } from '@web3icons/react';
import { capitalize } from 'lodash';

import React from 'react';

import type { NetworkConfig } from '@openzeppelin/transaction-form-types';
import { cn } from '@openzeppelin/transaction-form-utils';

import MidnightLogoSvg from '../../assets/icons/MidnightLogo.svg';

interface NetworkStatusBadgeProps {
  network: NetworkConfig | null;
  className?: string;
}

// Define constants for consistency
const ICON_SIZE = 16;
const BADGE_SIZE = '1.2rem'; // For the network type badge

function getNetworkIconName(network: NetworkConfig): string | null {
  // TODO: submit a PR to web3icons to add midnight to the list of networks
  if (network.ecosystem === 'midnight') {
    return null;
  }
  return network.icon || network.network.toLowerCase();
}

// NetworkTypeBadge component inline
function NetworkTypeBadge({ type }: { type: string }): React.ReactElement {
  const isDevnet = type === 'devnet';
  const isTestnet = type === 'testnet';
  const isTestnetLike = isTestnet || isDevnet; // For styling purposes

  // Determine badge text based on network type
  const badgeText = isDevnet ? 'D' : isTestnet ? 'T' : 'M';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium flex-shrink-0 text-xs 
                  ${
                    isTestnetLike
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }
                 `}
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        lineHeight: BADGE_SIZE /* For vertical centering */,
      }}
      title={capitalize(type)} // Full type name for tooltip
    >
      {badgeText}
    </span>
  );
}

/**
 * NetworkStatusBadge - Displays network information in a compact badge format
 * Shows the network icon, ecosystem, name, and type - exactly as in the core app
 */
export function NetworkStatusBadge({
  network,
  className,
}: NetworkStatusBadgeProps): React.ReactElement | null {
  if (!network) return null;

  const iconName = getNetworkIconName(network);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 border-0',
        className
      )}
    >
      {/* Network icon - reusing same icon component from NetworkMiniTile */}
      {network.ecosystem === 'midnight' ? (
        <MidnightLogoSvg width={ICON_SIZE} height={ICON_SIZE} />
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

      {/* Reusing the same NetworkTypeBadge component */}
      <NetworkTypeBadge type={network.type} />
    </div>
  );
}
