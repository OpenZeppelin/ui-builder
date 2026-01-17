import { Loader2, Wallet } from 'lucide-react';
import React from 'react';

import { Button } from '@openzeppelin/ui-components';
import type { BaseComponentProps, WalletComponentSize } from '@openzeppelin/ui-types';
import { cn, getWalletButtonSizeProps } from '@openzeppelin/ui-utils';

import { useAccount, useConnect } from '../../hooks/facade-hooks';
import { SafeMidnightComponent } from '../../utils/SafeMidnightComponent';

/**
 * A button that allows users to connect their wallet.
 * @param hideWhenConnected - Whether to hide the button when wallet is connected (default: true)
 */
export interface ConnectButtonProps extends BaseComponentProps {
  hideWhenConnected?: boolean;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  className,
  size,
  variant,
  fullWidth,
  hideWhenConnected = true,
}) => {
  const sizeProps = getWalletButtonSizeProps(size);

  const unavailableButton = (
    <div className={cn('flex items-center', fullWidth && 'w-full', className)}>
      <Button
        disabled={true}
        variant={variant || 'outline'}
        size={sizeProps.size}
        className={cn(sizeProps.className, fullWidth && 'w-full')}
      >
        <Wallet className={cn(sizeProps.iconSize, 'mr-1')} />
        Wallet Unavailable
      </Button>
    </div>
  );

  return (
    <SafeMidnightComponent fallback={unavailableButton}>
      <ConnectButtonContent
        className={className}
        size={size}
        variant={variant}
        fullWidth={fullWidth}
        hideWhenConnected={hideWhenConnected}
      />
    </SafeMidnightComponent>
  );
};

/**
 * The inner component that contains the actual UI and uses the hooks.
 */
const ConnectButtonContent: React.FC<{
  className?: string;
  size?: WalletComponentSize;
  variant?: BaseComponentProps['variant'];
  fullWidth?: boolean;
  hideWhenConnected: boolean;
}> = ({ className, size, variant, fullWidth, hideWhenConnected }) => {
  const { isConnected } = useAccount();
  const { connect, isConnecting, connectors, error: connectError } = useConnect();

  const sizeProps = getWalletButtonSizeProps(size);

  const handleConnectClick = () => {
    if (connect && !isConnected) {
      connect();
    }
  };

  if (isConnected && hideWhenConnected) {
    return null;
  }

  const showButtonLoading = isConnecting;
  const hasWallet = connectors.length > 0;

  // Determine button text based on connection state
  let buttonText = 'Connect Wallet';
  if (!hasWallet) {
    buttonText = 'No Wallet Found';
  } else if (showButtonLoading) {
    buttonText = 'Connecting...';
  } else if (connectError) {
    buttonText = 'Connect Wallet'; // Or 'Try Again'
  }

  return (
    <div className={cn('flex flex-col items-start gap-1', fullWidth && 'w-full', className)}>
      <div className={cn('flex items-center', fullWidth && 'w-full')}>
        <Button
          onClick={handleConnectClick}
          disabled={showButtonLoading || isConnected || !hasWallet}
          variant={variant || 'outline'}
          size={sizeProps.size}
          className={cn(sizeProps.className, fullWidth && 'w-full')}
        >
          {showButtonLoading ? (
            <Loader2 className={cn(sizeProps.iconSize, 'animate-spin mr-1')} />
          ) : (
            <Wallet className={cn(sizeProps.iconSize, 'mr-1')} />
          )}
          {buttonText}
        </Button>
      </div>

      {connectError && !isConnecting && (
        <p className="text-xs text-red-500 px-2">
          {connectError.message || 'Error connecting wallet'}
        </p>
      )}
    </div>
  );
};
