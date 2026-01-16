import { Loader2, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/ui-components';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn, getWalletButtonSizeProps } from '@openzeppelin/ui-utils';

import { useStellarAccount } from '../../hooks';
import { ConnectorDialog } from './ConnectorDialog';

/**
 * A button that allows users to connect their wallet.
 * Opens a dialog to select from available connectors.
 * @param hideWhenConnected - Whether to hide the button when wallet is connected (default: true)
 */
export interface ConnectButtonProps extends BaseComponentProps {
  hideWhenConnected?: boolean;
}

export const CustomConnectButton: React.FC<ConnectButtonProps> = ({
  className,
  size,
  variant,
  fullWidth,
  hideWhenConnected = true,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isConnected, isConnecting } = useStellarAccount();

  // Local state to indicate the button has been clicked and dialog is open, awaiting user selection
  const [isManuallyInitiated, setIsManuallyInitiated] = useState(false);

  const sizeProps = getWalletButtonSizeProps(size);

  useEffect(() => {
    if (isConnected && hideWhenConnected) {
      setDialogOpen(false);
      setIsManuallyInitiated(false); // Reset if dialog closes due to connection
    }
  }, [isConnected, hideWhenConnected]);

  // If dialog is closed, reset manual initiation state
  useEffect(() => {
    if (!dialogOpen) {
      setIsManuallyInitiated(false);
    }
  }, [dialogOpen]);

  // If wallet reports it's connecting, we no longer need our manual pending state
  useEffect(() => {
    if (isConnecting) {
      setIsManuallyInitiated(false);
    }
  }, [isConnecting]);

  const handleConnectClick = () => {
    if (!isConnected) {
      setIsManuallyInitiated(true); // User clicked, show pending on button
      setDialogOpen(true);
    }
  };

  if (isConnected && hideWhenConnected) {
    return null;
  }

  // Button shows loading if either hook reports connecting OR if user just clicked to open dialog
  const showButtonLoading = isConnecting || isManuallyInitiated;

  return (
    <div className={cn('flex items-center', fullWidth && 'w-full', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={showButtonLoading || isConnected}
        variant={variant || 'outline'}
        size={sizeProps.size}
        className={cn(sizeProps.className, fullWidth && 'w-full')}
        title={isConnected ? 'Connected' : 'Connect Wallet'}
      >
        {showButtonLoading ? (
          <Loader2 className={cn(sizeProps.iconSize, 'animate-spin mr-1')} />
        ) : (
          <Wallet className={cn(sizeProps.iconSize, 'mr-1')} />
        )}
        {showButtonLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <ConnectorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          // If dialog is closed manually by user before selection, reset manual initiation
          if (!open) {
            setIsManuallyInitiated(false);
          }
        }}
      />
    </div>
  );
};
