import React, { useEffect, useState } from 'react';

import {
  useDerivedAccountStatus,
  useDerivedConnectStatus,
} from '@openzeppelin/contracts-ui-builder-react-core';
import type { Connector } from '@openzeppelin/contracts-ui-builder-types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@openzeppelin/contracts-ui-builder-ui';

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
  const {
    connect,
    connectors,
    error: connectError,
    isConnecting,
    pendingConnector,
  } = useDerivedConnectStatus();
  const { isConnected } = useDerivedAccountStatus();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Get the complete config to log it
  const fullConfig = useUiKitConfig();
  const showInjectedConnector = isConfigEnabled('showInjectedConnector');

  // Log the configuration to debug
  useEffect(() => {}, [fullConfig, showInjectedConnector, isConnecting, pendingConnector]);

  // Track connection attempts for dialog closure
  useEffect(() => {
    // If we're connected and there was a connection attempt, close the dialog
    if (isConnected && connectingId) {
      onOpenChange(false);
      setConnectingId(null);
    }
  }, [isConnected, connectingId, onOpenChange]);

  // If connect function itself is not available (e.g., adapter doesn't provide useConnect facade hook)
  if (!connect) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>Wallet connection function is not available.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const handleConnectorSelect = (selectedConnector: Connector) => {
    setConnectingId(selectedConnector.id);
    connect({ connector: selectedConnector });
  };

  // Filter out the injected connector if showInjectedConnector is false
  const filteredConnectors = connectors.filter((connector: Connector) => {
    const isInjected = connector.id === 'injected';
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
            filteredConnectors.map((connector: Connector) => (
              <Button
                key={connector.id}
                onClick={() => handleConnectorSelect(connector)}
                disabled={isConnecting && connectingId === connector.id}
                variant="outline"
                className="flex justify-between items-center w-full py-6"
              >
                <span>{connector.name}</span>
                {isConnecting && connectingId === connector.id && (
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
