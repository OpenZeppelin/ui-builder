import { useCallback, useEffect, useState } from 'react';

import { useAdapterContext } from '@openzeppelin/contracts-ui-builder-react-core';
import { ContractAdapter, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { NetworkSettingsDialog, useNetworkErrors } from '@openzeppelin/contracts-ui-builder-ui';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { networkService } from '../../core/networks/service';

/**
 * Global network error handler that registers the settings dialog opener
 * at the app level, ensuring it's always available for error toasts.
 *
 * This component is BUILDER-SPECIFIC and not used in exported apps because:
 *
 * 1. Builder App Requirements:
 *    - Needs handler available across all wizard steps (network selection, contract loading, etc.)
 *    - Must handle network switching between different ecosystems dynamically
 *    - Includes dev tools that can trigger test errors on any network
 *    - Uses networkService.getNetworkById() to search across all ecosystems
 *
 * 2. Exported Apps Have Different Architecture:
 *    - Use WalletConnectionWithSettings component which has its own simpler handler
 *    - Only work with a single pre-selected network (no ecosystem switching)
 *    - No dev tools or test error triggers
 *    - Handler registration is scoped to the wallet connection component
 *
 * 3. Shared Infrastructure:
 *    - NetworkErrorNotificationProvider (in UI package) - provides the toast system
 *    - useNetworkErrors hook (in UI package) - provides error reporting API
 *    - NetworkSettingsDialog (in UI package) - the actual settings dialog
 *    - NetworkErrorAwareAdapter (in UI package) - wraps adapters to detect errors
 *
 * The toast notifications work in both contexts but with different handler implementations
 * appropriate to each app's architecture and requirements.
 */
export function NetworkErrorHandler() {
  const { setOpenNetworkSettingsHandler } = useNetworkErrors();
  const { getAdapterForNetwork } = useAdapterContext();

  const [settingsNetwork, setSettingsNetwork] = useState<NetworkConfig | null>(null);
  const [settingsAdapter, setSettingsAdapter] = useState<ContractAdapter | null>(null);
  const [defaultTab, setDefaultTab] = useState<'rpc' | 'explorer'>('rpc');

  // Get adapter for the settings network
  useEffect(() => {
    if (!settingsNetwork) {
      setSettingsAdapter(null);
      return;
    }

    const { adapter } = getAdapterForNetwork(settingsNetwork);
    setSettingsAdapter(adapter);
  }, [settingsNetwork, getAdapterForNetwork]);

  // Create a stable callback for opening network settings
  const openNetworkSettings = useCallback(
    async (networkId: string, tab: 'rpc' | 'explorer' = 'rpc') => {
      try {
        // Find the network by ID using the network service
        const network = await networkService.getNetworkById(networkId);

        if (network) {
          setSettingsNetwork(network);
          setDefaultTab(tab);
          // The useEffect will handle getting the adapter
        } else {
          logger.error('NetworkErrorHandler', `Network not found: ${networkId}`);
        }
      } catch (error) {
        logger.error('NetworkErrorHandler', 'Failed to open network settings:', error);
      }
    },
    []
  );

  // Register handler for opening network settings from error notifications
  useEffect(() => {
    setOpenNetworkSettingsHandler((networkId: string, defaultTab?: 'rpc' | 'explorer') => {
      void openNetworkSettings(networkId, defaultTab);
    });
  }, [openNetworkSettings, setOpenNetworkSettingsHandler]);

  const handleCloseNetworkSettings = () => {
    setSettingsNetwork(null);
    setSettingsAdapter(null);
  };

  return (
    <NetworkSettingsDialog
      isOpen={!!settingsNetwork}
      onOpenChange={(open: boolean) => !open && handleCloseNetworkSettings()}
      networkConfig={settingsNetwork}
      adapter={settingsAdapter}
      defaultTab={defaultTab}
    />
  );
}
