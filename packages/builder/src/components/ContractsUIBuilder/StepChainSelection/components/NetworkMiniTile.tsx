import { NetworkIcon } from '@web3icons/react';

import type { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import MidnightLogoSvg from '../../../../assets/icons/MidnightLogo.svg';
import { ICON_SIZE, getNetworkIconName } from '../utils/utils';

import { NetworkDetail } from './NetworkDetail';
import { NetworkTypeBadge } from './NetworkTypeBadge';

export interface NetworkMiniTileProps {
  network: NetworkConfig;
  isSelected: boolean;
  onSelect: () => void;
}

export function NetworkMiniTile({ network, isSelected, onSelect }: NetworkMiniTileProps) {
  const iconName = getNetworkIconName(network);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'hover:bg-muted relative flex flex-col rounded-md border p-3 text-left transition-all h-full',
        isSelected ? 'border-primary bg-primary/5 ring-primary/20 ring-1' : 'border-border bg-card'
      )}
      aria-selected={isSelected}
      title={`${network.name}${network.type === 'testnet' || network.type === 'devnet' ? ` (${network.type})` : ''} - ${network.ecosystem.toUpperCase()}`}
    >
      {/* Main content area */}
      <div>
        {/* Header row with icon, name and badge */}
        <div className="flex items-start gap-2">
          {/* Network icon */}
          {network.ecosystem === 'midnight' ? (
            <img
              src={MidnightLogoSvg}
              alt="Midnight"
              width={ICON_SIZE}
              height={ICON_SIZE}
              className="flex-shrink-0 mt-0.5"
            />
          ) : iconName ? (
            <NetworkIcon
              name={iconName}
              size={ICON_SIZE}
              variant="branded"
              className="flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="bg-muted flex-shrink-0 h-4 w-4 rounded-full mt-0.5"></div>
          )}

          {/* Network name and badge container */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm whitespace-nowrap" title={network.name}>
                {network.name}
              </span>
              <NetworkTypeBadge type={network.type} />
            </div>
          </div>
        </div>

        {/* Network details */}
        <div className="mt-2 pl-6 text-xs text-muted-foreground">
          <NetworkDetail network={network} />
        </div>
      </div>

      {/* Settings button will be positioned absolutely by parent component */}
    </button>
  );
}
