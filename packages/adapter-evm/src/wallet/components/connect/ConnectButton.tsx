import { Loader2, Wallet } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import {
  useDerivedAccountStatus,
  useDerivedConnectStatus,
} from '@openzeppelin/transaction-form-react-core';
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
      />
    </SafeWagmiComponent>
  );
};

const ConnectButtonContent: React.FC<{
  className?: string;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  hideWhenConnected: boolean;
}> = ({ className, dialogOpen, setDialogOpen, hideWhenConnected }) => {
  const { isConnected } = useDerivedAccountStatus();
  const { isConnecting: isHookConnecting, error: connectError } = useDerivedConnectStatus();

  // Local state to indicate the button has been clicked and dialog is open, awaiting user selection
  const [isManuallyInitiated, setIsManuallyInitiated] = useState(false);

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
    <div className={cn('flex items-center', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={showButtonLoading || isConnected}
        variant="outline"
        size="sm"
        className="h-8 px-2 text-xs"
        title={isConnected ? 'Connected' : connectError?.message || 'Connect Wallet'}
      >
        {showButtonLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <Wallet className="h-3.5 w-3.5 mr-1" />
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
