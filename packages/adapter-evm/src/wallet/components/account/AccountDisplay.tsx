import { LogOut } from 'lucide-react';
import React from 'react';

import { Button } from '@openzeppelin/ui-components';
import { useDerivedAccountStatus, useDerivedDisconnect } from '@openzeppelin/ui-react';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn, truncateMiddle } from '@openzeppelin/ui-utils';

import { SafeWagmiComponent } from '../../utils/SafeWagmiComponent';

/**
 * A component that displays the connected account address and chain ID.
 * Also includes a disconnect button.
 */
export const CustomAccountDisplay: React.FC<BaseComponentProps> = ({ className }) => {
  // Use the SafeWagmiComponent with null fallback
  return (
    <SafeWagmiComponent fallback={null}>
      <AccountDisplayContent className={className} />
    </SafeWagmiComponent>
  );
};

// Inner component that uses derived hooks
const AccountDisplayContent: React.FC<{ className?: string }> = ({ className }) => {
  const { isConnected, address, chainId } = useDerivedAccountStatus();
  const { disconnect } = useDerivedDisconnect();

  if (!isConnected || !address || !disconnect) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col">
        <span className="text-xs font-medium">{truncateMiddle(address, 4, 4)}</span>
        <span className="text-[9px] text-muted-foreground -mt-0.5">
          {chainId ? `Chain ID: ${chainId}` : 'Chain ID: N/A'}
        </span>
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
