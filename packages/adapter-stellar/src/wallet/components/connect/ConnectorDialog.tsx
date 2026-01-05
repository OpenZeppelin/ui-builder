import React, { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@openzeppelin/ui-components';
import type { Connector } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getStellarAvailableConnectors } from '../../connection';
import { useStellarAccount, useStellarConnect } from '../../hooks';

/**
 * Dialog component for selecting a wallet connector
 */
interface ConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectorDialog: React.FC<ConnectorDialogProps> = ({ open, onOpenChange }) => {
  const { connect } = useStellarConnect();
  const { isConnected, isConnecting } = useStellarAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);

  // Load available connectors
  useEffect(() => {
    const loadConnectors = async () => {
      try {
        const availableConnectors = await getStellarAvailableConnectors();
        setConnectors(availableConnectors);
      } catch (err) {
        logger.error('Failed to load Stellar connectors:', String(err));
        setError('Failed to load available wallets');
      } finally {
        setLoadingConnectors(false);
      }
    };

    if (open) {
      loadConnectors();
    }
  }, [open]);

  // Track connection attempts for dialog closure
  useEffect(() => {
    // If we're connected and there was a connection attempt, close the dialog
    if (isConnected && connectingId) {
      onOpenChange(false);
      setConnectingId(null);
      setError(null);
    }
  }, [isConnected, connectingId, onOpenChange]);

  // If connect function itself is not available
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

  const handleConnectorSelect = async (selectedConnector: Connector) => {
    setConnectingId(selectedConnector.id);
    setError(null);

    try {
      await connect({ connector: selectedConnector });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
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
          {loadingConnectors ? (
            <p className="text-center text-muted-foreground">Loading available wallets...</p>
          ) : connectors.length === 0 ? (
            <p className="text-center text-muted-foreground">No wallet connectors available.</p>
          ) : (
            connectors.map((connector: Connector) => (
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

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </DialogContent>
    </Dialog>
  );
};
