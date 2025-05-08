import { NetworkIcon } from '@web3icons/react';

import React from 'react';

import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

import MidnightLogoSvg from '../../assets/icons/MidnightLogo.svg';
import { NetworkTypeBadge } from '../FormBuilder/StepChainSelection/components/NetworkTypeBadge';
import { ICON_SIZE, getNetworkIconName } from '../FormBuilder/StepChainSelection/utils/utils';

interface NetworkStatusBadgeProps {
  network: NetworkConfig | null;
}

export function NetworkStatusBadge({
  network,
}: NetworkStatusBadgeProps): React.ReactElement | null {
  if (!network) return null;

  const iconName = getNetworkIconName(network);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 shadow-sm">
      {/* Network icon - reusing same icon component from NetworkMiniTile */}
      {network.ecosystem === 'midnight' ? (
        <img src={MidnightLogoSvg} alt="Midnight" width={ICON_SIZE} height={ICON_SIZE} />
      ) : iconName ? (
        <NetworkIcon name={iconName} size={ICON_SIZE} variant="branded" />
      ) : (
        <div className="bg-muted flex-shrink-0 h-4 w-4 rounded-full"></div>
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
