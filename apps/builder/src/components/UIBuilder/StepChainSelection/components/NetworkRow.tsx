import { Loader2, Settings } from 'lucide-react';

import { Button, NetworkIcon } from '@openzeppelin/ui-components';
import type { NetworkConfig } from '@openzeppelin/ui-types';
import { cn } from '@openzeppelin/ui-utils';

import { ICON_SIZE } from '../utils/utils';
import { NetworkDetail } from './NetworkDetail';

export interface NetworkRowProps {
  network: NetworkConfig;
  isSelected: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
  onSelect: () => void;
  onOpenSettings?: (event: React.MouseEvent) => void;
}

export function NetworkRow({
  network,
  isSelected,
  isLoading = false,
  disabled = false,
  disabledLabel,
  onSelect,
  onOpenSettings,
}: NetworkRowProps) {
  const isTestnetLike = network.type === 'testnet' || network.type === 'devnet';

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-md border p-3 transition-all w-full group',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        // Use dashed border for testnet/devnet networks
        isTestnetLike ? 'border-dashed' : 'border-solid',
        // Selection and hover states
        isSelected && !disabled
          ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
          : isTestnetLike
            ? 'border-muted-foreground/40 bg-card'
            : 'border-border bg-card'
      )}
      aria-selected={isSelected && !disabled}
      aria-disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onSelect();
        }
      }}
    >
      {/* Network info display area */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Network icon */}
        <div className="shrink-0">
          <NetworkIcon network={network} size={ICON_SIZE} />
        </div>

        {/* Network name and details */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm" title={network.name}>
            {network.name}
          </span>
          <div className="text-xs text-muted-foreground">
            <NetworkDetail network={network} />
          </div>
        </div>
      </div>

      {/* Disabled badge or action buttons */}
      <div className="flex shrink-0 items-center gap-2">
        {disabled && disabledLabel ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {disabledLabel}
          </span>
        ) : null}
        {isLoading ? (
          <div className="flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading…</span>
          </div>
        ) : (
          <>
            {!disabled && (
              <>
                {/* Select button - visible on hover */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className={cn(
                    'h-8 px-3 text-xs',
                    'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                    'transition-opacity duration-200'
                  )}
                >
                  Select
                </Button>

                {/* Settings button - visible on mobile, hover-only on desktop */}
                {onOpenSettings && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenSettings}
                    className={cn(
                      'size-8 p-0',
                      'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                      'transition-opacity duration-200'
                    )}
                    title="Configure network settings"
                  >
                    <Settings size={14} />
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
