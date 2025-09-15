import { LogOut } from 'lucide-react';
import React from 'react';

import type { BaseComponentProps } from '@openzeppelin/contracts-ui-builder-types';
import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn, truncateMiddle } from '@openzeppelin/contracts-ui-builder-utils';

import { useStellarAccount, useStellarDisconnect } from '../../hooks';

/**
 * A component that displays the connected account address.
 * Also includes a disconnect button.
 */
export const CustomAccountDisplay: React.FC<BaseComponentProps> = ({ className }) => {
  const { isConnected, address } = useStellarAccount();
  const { disconnect } = useStellarDisconnect();

  if (!isConnected || !address || !disconnect) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col">
        <span className="text-xs font-medium">{truncateMiddle(address, 4, 4)}</span>
        <span className="text-[9px] text-muted-foreground -mt-0.5">Stellar Account</span>
      </div>
      <Button
        onClick={() => disconnect()}
        variant="ghost"
        size="icon"
        className="size-6 p-0"
        title="Disconnect wallet"
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
};
