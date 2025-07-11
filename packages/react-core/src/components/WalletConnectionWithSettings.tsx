import { Settings } from 'lucide-react';

import React, { useCallback, useEffect, useState } from 'react';

import { Button, NetworkSettingsDialog, useNetworkErrors } from '@openzeppelin/transaction-form-ui';

import { useWalletState } from '../hooks/WalletStateContext';

import { WalletConnectionUI } from './WalletConnectionUI';

/**
 * Enhanced wallet connection header with network settings menu.
 * Used in exported apps to provide access to RPC and Explorer configuration.
 */
export const WalletConnectionWithSettings: React.FC = () => {
  const { isAdapterLoading, activeAdapter, activeNetworkConfig } = useWalletState();
  const { setOpenNetworkSettingsHandler } = useNetworkErrors();

  // Network settings dialog state
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'rpc' | 'explorer'>('rpc');

  // Create a stable callback for opening network settings
  const openNetworkSettings = useCallback(
    (networkId: string, tab: 'rpc' | 'explorer' = 'rpc') => {
      // In exported apps, we only support the current network
      if (activeNetworkConfig && networkId === activeNetworkConfig.id) {
        setDefaultTab(tab);
        setShowNetworkSettings(true);
      }
    },
    [activeNetworkConfig]
  );

  // Register handler for opening network settings from error notifications
  useEffect(() => {
    setOpenNetworkSettingsHandler(openNetworkSettings);
  }, [openNetworkSettings, setOpenNetworkSettingsHandler]);

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
            title="Network Settings"
            onClick={() => setShowNetworkSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Network Settings Dialog */}
      <NetworkSettingsDialog
        isOpen={showNetworkSettings}
        onOpenChange={setShowNetworkSettings}
        networkConfig={activeNetworkConfig}
        adapter={activeAdapter}
        defaultTab={defaultTab}
      />
    </>
  );
};
