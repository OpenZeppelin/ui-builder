import { Loader2, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/ui-components';
import { useDerivedAccountStatus, useDerivedConnectStatus } from '@openzeppelin/ui-react';
import type { BaseComponentProps, WalletComponentSize } from '@openzeppelin/ui-types';
import { cn, getWalletButtonSizeProps } from '@openzeppelin/ui-utils';

import { SafeWagmiComponent } from '../SafeWagmiComponent';
import { ConnectorDialog } from './ConnectorDialog';

/**
 * A button that allows users to connect their wallet.
 * Opens a dialog to select from available connectors.
 * @param hideWhenConnected - Whether to hide the button when wallet is connected (default: true)
 * @param showInjectedConnector - Whether to show the injected connector in the dialog (default: false)
 */
export interface ConnectButtonProps extends BaseComponentProps {
  hideWhenConnected?: boolean;
  showInjectedConnector?: boolean;
}

export const CustomConnectButton: React.FC<ConnectButtonProps> = ({
  className,
  size,
  variant,
  fullWidth,
  hideWhenConnected = true,
  showInjectedConnector = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <SafeWagmiComponent fallback={unavailableButton}>
      <ConnectButtonContent
        className={className}
        size={size}
        variant={variant}
        fullWidth={fullWidth}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        hideWhenConnected={hideWhenConnected}
        showInjectedConnector={showInjectedConnector}
      />
    </SafeWagmiComponent>
  );
};

const ConnectButtonContent: React.FC<{
  className?: string;
  size?: WalletComponentSize;
  variant?: BaseComponentProps['variant'];
  fullWidth?: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  hideWhenConnected: boolean;
  showInjectedConnector: boolean;
}> = ({
  className,
  size,
  variant,
  fullWidth,
  dialogOpen,
  setDialogOpen,
  hideWhenConnected,
  showInjectedConnector,
}) => {
  const { isConnected } = useDerivedAccountStatus();
  const { isConnecting: isHookConnecting, error: connectError } = useDerivedConnectStatus();

  // Local state to indicate the button has been clicked and dialog is open, awaiting user selection
  const [isManuallyInitiated, setIsManuallyInitiated] = useState(false);

  const sizeProps = getWalletButtonSizeProps(size);

  useEffect(() => {
    if (isConnected && hideWhenConnected) {
      setDialogOpen(false);
      setIsManuallyInitiated(false); // Reset if dialog closes due to connection
    }
  }, [isConnected, hideWhenConnected, setDialogOpen]);

  // If dialog is closed, reset manual initiation state
  useEffect(() => {
    if (!dialogOpen) {
      setIsManuallyInitiated(false);
    }
  }, [dialogOpen]);

  // If wagmi hook reports it's connecting, we no longer need our manual pending state
  useEffect(() => {
    if (isHookConnecting) {
      setIsManuallyInitiated(false);
    }
  }, [isHookConnecting]);

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
  const showButtonLoading = isHookConnecting || isManuallyInitiated;

  return (
    <div className={cn('flex items-center', fullWidth && 'w-full', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={showButtonLoading || isConnected}
        variant={variant || 'outline'}
        size={sizeProps.size}
        className={cn(sizeProps.className, fullWidth && 'w-full')}
        title={isConnected ? 'Connected' : connectError?.message || 'Connect Wallet'}
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
        showInjectedConnector={showInjectedConnector}
      />
    </div>
  );
};
