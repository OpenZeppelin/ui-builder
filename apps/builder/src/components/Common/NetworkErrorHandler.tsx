import { useCallback, useEffect, useState } from 'react';

import { useNetworkErrors } from '@openzeppelin/ui-components';
import { useRuntimeContext } from '@openzeppelin/ui-react';
import { NetworkSettingsDialog } from '@openzeppelin/ui-renderer';
import type { NetworkConfig, RelayerCapability } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

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
  const { getRuntimeForNetwork } = useRuntimeContext();

  const [settingsNetwork, setSettingsNetwork] = useState<NetworkConfig | null>(null);
  const [settingsRelayer, setSettingsRelayer] = useState<RelayerCapability | null>(null);

  // Resolve the relayer capability for the settings network.
  useEffect(() => {
    if (!settingsNetwork) {
      setSettingsRelayer(null);
      return;
    }

    const { runtime } = getRuntimeForNetwork(settingsNetwork);
    setSettingsRelayer(runtime?.relayer ?? null);
  }, [settingsNetwork, getRuntimeForNetwork]);

  // Create a stable callback for opening network settings
  const openNetworkSettings = useCallback(async (networkId: string) => {
    try {
      // Find the network by ID using the network service
      const network = await networkService.getNetworkById(networkId);

      if (network) {
        setSettingsNetwork(network);
        // Dialog derives tabs from adapter.getNetworkServiceForms()
        // The useEffect will handle getting the adapter
      } else {
        logger.error('NetworkErrorHandler', `Network not found: ${networkId}`);
      }
    } catch (error) {
      logger.error('NetworkErrorHandler', 'Failed to open network settings:', error);
    }
  }, []);

  // Register handler for opening network settings from error notifications
  useEffect(() => {
    setOpenNetworkSettingsHandler((networkId: string) => {
      void openNetworkSettings(networkId);
    });
  }, [openNetworkSettings, setOpenNetworkSettingsHandler]);

  const handleCloseNetworkSettings = () => {
    setSettingsNetwork(null);
    setSettingsRelayer(null);
  };

  return (
    <NetworkSettingsDialog
      isOpen={!!settingsNetwork}
      onOpenChange={(open: boolean) => !open && handleCloseNetworkSettings()}
      networkConfig={settingsNetwork}
      relayer={settingsRelayer}
    />
  );
}
