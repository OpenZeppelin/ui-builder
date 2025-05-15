import {
  type Connector,
  useAccount,
  useChainId,
  useChains,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import React, { useEffect, useState } from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/transaction-form-ui';
import { cn, logger } from '@openzeppelin/transaction-form-utils';

import { useIsWagmiProviderInitialized } from './useIsWagmiProviderInitialized';

// Helper function to format addresses
const shortenAddress = (address: string | undefined) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Safe wrapper for components that use wagmi hooks
const SafeWagmiComponent = ({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const isProviderInitialized = useIsWagmiProviderInitialized();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state if provider initializes
    if (isProviderInitialized) {
      setHasError(false);
    }
  }, [isProviderInitialized]);

  // Setup global error handler for wagmi errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only handle wagmi-related errors
      if (
        event.error?.message?.includes('useConfig') ||
        event.error?.message?.includes('WagmiProvider')
      ) {
        logger.debug(
          'SafeWagmiComponent',
          'Caught wagmi error via window error event:',
          event.error
        );
        setHasError(true);
        event.preventDefault(); // Prevent the error from propagating
      }
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // If provider isn't ready yet or we had an error, show fallback
  if (!isProviderInitialized || hasError) {
    return <>{fallback}</>;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    // Only catch render errors related to wagmi hooks
    if (
      error instanceof Error &&
      (error.message.includes('useConfig') || error.message.includes('WagmiProvider'))
    ) {
      logger.debug('SafeWagmiComponent', 'Caught wagmi error:', error);
      setHasError(true);
      return <>{fallback}</>;
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Dialog component for selecting a wallet connector
 */
interface ConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectorDialog: React.FC<ConnectorDialogProps> = ({ open, onOpenChange }) => {
  // Prepare fallback dialog content
  const unavailableContent = (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wallet Connection Unavailable</DialogTitle>
          <DialogDescription>
            The wallet connection system is not properly initialized.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );

  // Only render wagmi-dependent part when provider is initialized
  return (
    <SafeWagmiComponent fallback={unavailableContent}>
      <ConnectorDialogContent open={open} onOpenChange={onOpenChange} />
    </SafeWagmiComponent>
  );
};

// Inner content that uses wagmi hooks
const ConnectorDialogContent: React.FC<ConnectorDialogProps> = ({ open, onOpenChange }) => {
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Track connection attempts for dialog closure
  useEffect(() => {
    // If we're connected and there was a connection attempt, close the dialog
    if (isConnected && connectingId) {
      onOpenChange(false);
      setConnectingId(null);
    }
  }, [isConnected, connectingId, onOpenChange]);

  const handleConnectorSelect = (connector: Connector) => {
    try {
      setConnectingId(connector.id);
      // Just start the connection - dialog will close via the effect when connected
      connect({ connector });
      // Note: The dialog closing is now handled by the useEffect above
    } catch (err) {
      console.error('Connection error:', err);
      setConnectingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet provider to connect with this application.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {connectors.length === 0 ? (
            <p className="text-center text-muted-foreground">No wallet connectors available.</p>
          ) : (
            connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => handleConnectorSelect(connector)}
                disabled={isPending && connectingId === connector.id}
                variant="outline"
                className="flex justify-between items-center w-full py-6"
              >
                <span>{connector.name}</span>
                {isPending && connectingId === connector.id && (
                  <span className="ml-2 text-xs">Connecting...</span>
                )}
              </Button>
            ))
          )}
        </div>

        {connectError && (
          <p className="text-sm text-red-500 mt-1">
            {connectError.message || 'Error connecting wallet'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * A button that allows users to connect their wallet.
 * Opens a dialog to select from available connectors.
 */
export const CustomConnectButton: React.FC<BaseComponentProps> = ({ className }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const unavailableButton = (
    <div className={cn('flex flex-col', className)}>
      <Button disabled={true} variant="default" size="default">
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
    <div className={cn('flex flex-col', className)}>
      <Button
        onClick={handleConnectClick}
        disabled={isPending || isConnected}
        variant="default"
        size="default"
      >
        {isPending ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
      </Button>

      <ConnectorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

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
        <span className="text-sm font-medium">{shortenAddress(address)}</span>
        <span className="text-xs text-muted-foreground">Chain ID: {chainId}</span>
      </div>
      <Button onClick={() => disconnect()} variant="outline" size="sm">
        Disconnect
      </Button>
    </div>
  );
};

/**
 * A component that displays the current network and allows switching to other networks.
 * Uses the chainId and switchChain hooks from wagmi.
 */
export const CustomNetworkSwitcher: React.FC<BaseComponentProps> = ({ className }) => {
  // Use the SafeWagmiComponent with null fallback
  return (
    <SafeWagmiComponent fallback={null}>
      <NetworkSwitcherContent className={className} />
    </SafeWagmiComponent>
  );
};

// Inner component that uses wagmi hooks
const NetworkSwitcherContent: React.FC<{ className?: string }> = ({ className }) => {
  const currentChainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending, error } = useSwitchChain();
  const { isConnected } = useAccount();

  if (!isConnected || chains.length === 0) {
    return null;
  }

  // Find current chain info
  const currentChain = chains.find((chain) => chain.id === currentChainId);

  const handleNetworkChange = (chainId: number) => {
    if (chainId !== currentChainId) {
      switchChain({ chainId });
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="text-sm font-medium mb-1">Network</div>
      <Select
        value={currentChainId?.toString()}
        onValueChange={(value) => handleNetworkChange(Number(value))}
        disabled={isPending || !chains.length}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={currentChain?.name || 'Select Network'} />
        </SelectTrigger>
        <SelectContent>
          {chains.map((chain) => (
            <SelectItem key={chain.id} value={chain.id.toString()}>
              {chain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && <p className="text-xs text-muted-foreground mt-1">Switching network...</p>}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message || 'Error switching network'}</p>
      )}
    </div>
  );
};
