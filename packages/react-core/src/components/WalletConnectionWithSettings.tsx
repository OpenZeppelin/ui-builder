import { Settings } from 'lucide-react';

import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  RpcSettingsPanel,
} from '@openzeppelin/transaction-form-ui';

import { useWalletState } from '../hooks/WalletStateContext';

import { WalletConnectionUI } from './WalletConnectionUI';

/**
 * Enhanced wallet connection header with RPC settings menu.
 * Used in exported apps to provide access to RPC configuration.
 */
export const WalletConnectionWithSettings: React.FC = () => {
  const { isAdapterLoading, activeAdapter, activeNetworkConfig } = useWalletState();
  const [showRpcSettings, setShowRpcSettings] = useState(false);

  if (isAdapterLoading) {
    return <div className="h-9 w-28 animate-pulse rounded bg-muted"></div>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <WalletConnectionUI />

        {/* Settings Button */}
        {activeAdapter && activeNetworkConfig && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="RPC Settings"
            onClick={() => setShowRpcSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* RPC Settings Dialog */}
      <Dialog open={showRpcSettings} onOpenChange={setShowRpcSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>RPC Provider Settings</DialogTitle>
            <DialogDescription>
              Configure a custom RPC provider for {activeNetworkConfig?.name}
            </DialogDescription>
          </DialogHeader>
          {activeNetworkConfig && activeAdapter && (
            <RpcSettingsPanel
              adapter={activeAdapter}
              networkId={activeNetworkConfig.id}
              onSettingsChanged={() => {
                setShowRpcSettings(false);
                // Components will automatically refresh via the RPC change event system
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
