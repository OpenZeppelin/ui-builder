import { type Connector, useAccount, useConnect } from 'wagmi';

import React, { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@openzeppelin/transaction-form-ui';
import { logger } from '@openzeppelin/transaction-form-utils';

import { isConfigEnabled, useUiKitConfig } from '../../hooks/useUiKitConfig';
import { SafeWagmiComponent } from '../../utils/SafeWagmiComponent';

/**
 * Dialog component for selecting a wallet connector
 */
interface ConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectorDialog: React.FC<ConnectorDialogProps> = ({ open, onOpenChange }) => {
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

  // Get the complete config to log it
  const fullConfig = useUiKitConfig();
  const showInjectedConnector = isConfigEnabled('showInjectedConnector');

  // Log the configuration to debug
  useEffect(() => {
    logger.debug(
      'ConnectorDialog',
      `Configuration loaded: ${JSON.stringify(fullConfig)}, showInjectedConnector=${showInjectedConnector}`
    );
  }, [fullConfig, showInjectedConnector]);

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

  // Filter out the injected connector if showInjectedConnector is false
  const filteredConnectors = connectors.filter((connector) => {
    const isInjected = connector.id === 'injected';
    if (isInjected) {
      logger.debug(
        'ConnectorDialog',
        `Found injected connector: ${connector.name}, showing=${showInjectedConnector}`
      );
    }
    return !(isInjected && !showInjectedConnector);
  });

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
          {filteredConnectors.length === 0 ? (
            <p className="text-center text-muted-foreground">No wallet connectors available.</p>
          ) : (
            filteredConnectors.map((connector) => (
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
