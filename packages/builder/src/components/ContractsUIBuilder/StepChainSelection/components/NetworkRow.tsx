import { NetworkIcon } from '@web3icons/react';

import type { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import MidnightLogoSvg from '../../../../assets/icons/MidnightLogo.svg';
import { ICON_SIZE, getNetworkIconName } from '../utils/utils';

import { NetworkDetail } from './NetworkDetail';

export interface NetworkRowProps {
  network: NetworkConfig;
  isSelected: boolean;
  onSelect: () => void;
}

export function NetworkRow({ network, isSelected, onSelect }: NetworkRowProps) {
  const iconName = getNetworkIconName(network);
  const isTestnetLike = network.type === 'testnet' || network.type === 'devnet';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'hover:bg-muted relative flex items-center gap-3 rounded-md border p-3 text-left transition-all w-full',
        // Use dashed border for testnet/devnet networks
        isTestnetLike ? 'border-dashed' : 'border-solid',
        // Selection and hover states
        isSelected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
          : isTestnetLike
            ? 'border-muted-foreground/40 bg-card'
            : 'border-border bg-card'
      )}
      aria-selected={isSelected}
      title={`${network.name}${network.type === 'testnet' || network.type === 'devnet' ? ` (${network.type})` : ''} - ${network.ecosystem.toUpperCase()}`}
    >
      {/* Network icon */}
      <div className="flex-shrink-0">
        {network.ecosystem === 'midnight' ? (
          <img
            src={MidnightLogoSvg}
            alt="Midnight"
            width={ICON_SIZE}
            height={ICON_SIZE}
            className="flex-shrink-0"
          />
        ) : iconName ? (
          <NetworkIcon
            name={iconName}
            size={ICON_SIZE}
            variant="branded"
            className="flex-shrink-0"
          />
        ) : (
          <div className="bg-muted flex-shrink-0 h-4 w-4 rounded-full"></div>
        )}
      </div>

      {/* Network name and details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium text-sm" title={network.name}>
              {network.name}
            </span>
            {/* Network details inline for more compact layout */}
            <div className="text-xs text-muted-foreground">
              <NetworkDetail network={network} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings button will be positioned absolutely by parent component */}
    </button>
  );
}
