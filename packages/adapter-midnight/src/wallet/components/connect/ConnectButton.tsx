import { Loader2, Wallet } from 'lucide-react';
import React from 'react';

import { Button } from '@openzeppelin/ui-components';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn } from '@openzeppelin/ui-utils';

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
  hideWhenConnected = true,
}) => {
  const unavailableButton = (
    <div className={cn('flex items-center', className)}>
      <Button disabled={true} variant="outline" size="sm" className="h-8 px-2 text-xs">
        <Wallet className="size-3.5 mr-1" />
        Wallet Unavailable
      </Button>
    </div>
  );

  return (
    <SafeMidnightComponent fallback={unavailableButton}>
      <ConnectButtonContent className={className} hideWhenConnected={hideWhenConnected} />
    </SafeMidnightComponent>
  );
};

/**
 * The inner component that contains the actual UI and uses the hooks.
 */
const ConnectButtonContent: React.FC<{
  className?: string;
  hideWhenConnected: boolean;
}> = ({ className, hideWhenConnected }) => {
  const { isConnected } = useAccount();
  const { connect, isConnecting, connectors, error: connectError } = useConnect();

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
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <div className="flex items-center">
        <Button
          onClick={handleConnectClick}
          disabled={showButtonLoading || isConnected || !hasWallet}
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs"
        >
          {showButtonLoading ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : (
            <Wallet className="size-3.5 mr-1" />
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
