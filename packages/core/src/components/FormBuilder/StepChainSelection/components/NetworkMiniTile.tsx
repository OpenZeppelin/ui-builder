import { NetworkIcon } from '@web3icons/react';

import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

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
      className={`hover:bg-muted flex flex-col rounded-md border p-1.5 text-left transition-all ${
        isSelected ? 'border-primary bg-primary/5 ring-primary/20 ring-1' : 'border-border bg-card'
      }`}
      aria-selected={isSelected}
      // Add a more descriptive title for accessibility and hover
      title={`${network.name}${network.type === 'testnet' || network.type === 'devnet' ? ` (${network.type})` : ''} - ${network.ecosystem.toUpperCase()}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-shrink min-w-0">
          {network.ecosystem === 'midnight' ? (
            <img src={MidnightLogoSvg} alt="Midnight" width={ICON_SIZE} height={ICON_SIZE} />
          ) : iconName ? (
            <NetworkIcon name={iconName} size={ICON_SIZE} variant="branded" />
          ) : (
            <div className="bg-muted flex-shrink-0 h-4 w-4 rounded-full"></div>
          )}
          <div className="flex-1 truncate font-medium text-xs" title={network.name}>
            {network.name}
          </div>
        </div>
        <NetworkTypeBadge type={network.type} />
      </div>

      <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
        <NetworkDetail network={network} />
      </div>
    </button>
  );
}
