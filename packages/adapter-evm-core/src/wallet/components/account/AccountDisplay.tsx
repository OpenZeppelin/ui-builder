import { LogOut } from 'lucide-react';
import React from 'react';

import { Button } from '@openzeppelin/ui-components';
import { useDerivedAccountStatus, useDerivedDisconnect } from '@openzeppelin/ui-react';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn, getWalletAccountDisplaySizeProps, truncateMiddle } from '@openzeppelin/ui-utils';

import { SafeWagmiComponent } from '../SafeWagmiComponent';

/**
 * A component that displays the connected account address and chain ID.
 * Also includes a disconnect button.
 */
export const CustomAccountDisplay: React.FC<BaseComponentProps> = ({
  className,
  size,
  variant,
  fullWidth,
}) => {
  // Use the SafeWagmiComponent with null fallback
  return (
    <SafeWagmiComponent fallback={null}>
      <AccountDisplayContent
        className={className}
        size={size}
        variant={variant}
        fullWidth={fullWidth}
      />
    </SafeWagmiComponent>
  );
};

// Inner component that uses derived hooks
const AccountDisplayContent: React.FC<BaseComponentProps> = ({
  className,
  size,
  variant,
  fullWidth,
}) => {
  const { isConnected, address, chainId } = useDerivedAccountStatus();
  const { disconnect } = useDerivedDisconnect();

  const sizeProps = getWalletAccountDisplaySizeProps(size);

  if (!isConnected || !address || !disconnect) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', fullWidth && 'w-full', className)}>
      <div className={cn('flex flex-col', fullWidth && 'flex-1')}>
        <span className={cn(sizeProps.textSize, 'font-medium')}>
          {truncateMiddle(address, 4, 4)}
        </span>
        <span className={cn(sizeProps.subTextSize, 'text-muted-foreground -mt-0.5')}>
          {chainId ? `Chain ID: ${chainId}` : 'Chain ID: N/A'}
        </span>
      </div>
      <Button
        onClick={() => disconnect()}
        variant={variant || 'ghost'}
        size="icon"
        className={cn(sizeProps.iconButtonSize, 'p-0')}
        title="Disconnect wallet"
      >
        <LogOut className={sizeProps.iconSize} />
      </Button>
    </div>
  );
};
