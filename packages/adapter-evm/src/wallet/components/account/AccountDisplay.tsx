import { useAccount, useChainId, useDisconnect } from 'wagmi';

import React from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import { Button } from '@openzeppelin/transaction-form-ui';
import { cn, truncateMiddle } from '@openzeppelin/transaction-form-utils';

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

// Inner component that uses wagmi hooks
const AccountDisplayContent: React.FC<{ className?: string }> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-4 p-2 rounded-md border', className)}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{truncateMiddle(address)}</span>
        <span className="text-xs text-muted-foreground">Chain ID: {chainId}</span>
      </div>
      <Button onClick={() => disconnect()} variant="outline" size="sm">
        Disconnect
      </Button>
    </div>
  );
};
