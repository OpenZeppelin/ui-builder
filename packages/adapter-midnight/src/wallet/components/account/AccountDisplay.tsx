import { LogOut } from 'lucide-react';

import React from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import { cn, truncateMiddle } from '@openzeppelin/transaction-form-utils';

import { useAccount, useDisconnect } from '../../hooks/facade-hooks';
import { SafeMidnightComponent } from '../../utils/SafeMidnightComponent';

/**
 * A component that displays the connected account address and network.
 * Also includes a disconnect button.
 */
export const CustomAccountDisplay: React.FC<BaseComponentProps> = ({ className }) => {
  // Use the SafeMidnightComponent with null fallback
  return (
    <SafeMidnightComponent fallback={null}>
      <AccountDisplayContent className={className} />
    </SafeMidnightComponent>
  );
};

/**
 * The inner component that contains the actual UI and uses the hooks.
 */
const AccountDisplayContent: React.FC<{ className?: string }> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address || !disconnect) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col">
        <span className="text-xs font-medium">{truncateMiddle(address, 4, 4)}</span>
        <span className="text-[9px] text-muted-foreground -mt-0.5">Midnight Network</span>
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
