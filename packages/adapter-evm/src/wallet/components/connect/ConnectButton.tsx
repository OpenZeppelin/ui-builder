import { Loader2, Wallet } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';

import React, { useState } from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import { Button } from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

import { SafeWagmiComponent } from '../../utils/SafeWagmiComponent';

import { ConnectorDialog } from './ConnectorDialog';

/**
 * A button that allows users to connect their wallet.
 * Opens a dialog to select from available connectors.
 */
export const CustomConnectButton: React.FC<BaseComponentProps> = ({ className }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const unavailableButton = (
    <div className={cn('flex items-center', className)}>
      <Button disabled={true} variant="ghost" size="sm" className="h-8 px-2 text-xs">
        <Wallet className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <SafeWagmiComponent fallback={unavailableButton}>
      <ConnectButtonContent
        className={className}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </SafeWagmiComponent>
  );
};

// Inner component that uses wagmi hooks
const ConnectButtonContent: React.FC<{
  className?: string;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}> = ({ className, dialogOpen, setDialogOpen }) => {
  const { isConnected } = useAccount();
  const { isPending } = useConnect();

  const handleConnectClick = () => {
    if (!isConnected) {
      setDialogOpen(true);
    }
  };

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={isPending || isConnected}
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        title={isConnected ? 'Connected' : 'Connect Wallet'}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wallet className="h-3.5 w-3.5" />
        )}
      </Button>

      <ConnectorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};
