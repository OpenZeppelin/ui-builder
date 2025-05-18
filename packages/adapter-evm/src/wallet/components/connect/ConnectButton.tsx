import { Loader2, Wallet } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';

import React, { useEffect, useState } from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import { Button } from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

import { SafeWagmiComponent } from '../../utils/SafeWagmiComponent';

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
  hideWhenConnected = true,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Track our own loading state
  const [isPendingConnection, setIsPendingConnection] = useState(false);

  const unavailableButton = (
    <div className={cn('flex items-center', className)}>
      <Button disabled={true} variant="outline" size="sm" className="h-8 px-2 text-xs">
        <Wallet className="h-3.5 w-3.5 mr-1" />
        Wallet Unavailable
      </Button>
    </div>
  );

  return (
    <SafeWagmiComponent fallback={unavailableButton}>
      <ConnectButtonContent
        className={className}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        hideWhenConnected={hideWhenConnected}
        isPendingConnection={isPendingConnection}
        setIsPendingConnection={setIsPendingConnection}
      />
    </SafeWagmiComponent>
  );
};

// Inner component that uses wagmi hooks
const ConnectButtonContent: React.FC<{
  className?: string;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  hideWhenConnected: boolean;
  isPendingConnection: boolean;
  setIsPendingConnection: (isPending: boolean) => void;
}> = ({
  className,
  dialogOpen,
  setDialogOpen,
  hideWhenConnected,
  isPendingConnection,
  setIsPendingConnection,
}) => {
  const { isConnected } = useAccount();
  const { isPending } = useConnect();

  // Set our local pending state when wagmi's isPending changes
  useEffect(() => {
    if (isPending) {
      setIsPendingConnection(true);
    }
  }, [isPending, setIsPendingConnection]);

  // Reset pending state when connection completes
  useEffect(() => {
    if (isConnected) {
      setIsPendingConnection(false);
    }
  }, [isConnected, setIsPendingConnection]);

  // Reset pending state when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      // Small delay to prevent flickering if dialog closes and immediately reopens
      const timer = setTimeout(() => {
        if (!dialogOpen) {
          setIsPendingConnection(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, setIsPendingConnection]);

  useEffect(() => {
    // If the button content is being hidden because the wallet is connected,
    // ensure the dialog is closed.
    if (isConnected && hideWhenConnected) {
      setDialogOpen(false);
    }
  }, [isConnected, hideWhenConnected, setDialogOpen]);

  // Hide the button if connected and hideWhenConnected is true
  if (isConnected && hideWhenConnected) {
    return null;
  }

  const handleConnectClick = () => {
    if (!isConnected) {
      setIsPendingConnection(true); // Set pending immediately on click
      setDialogOpen(true);
    }
  };

  // Use combined state (wagmi's isPending or our local state)
  const isLoading = isPending || isPendingConnection;

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={isLoading || isConnected}
        variant="outline"
        size="sm"
        className="h-8 px-2 text-xs"
        title={isConnected ? 'Connected' : 'Connect Wallet'}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <Wallet className="h-3.5 w-3.5 mr-1" />
        )}
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <ConnectorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          // If dialog is manually closed, reset pending state
          if (!open) {
            setIsPendingConnection(false);
          }
        }}
      />
    </div>
  );
};
