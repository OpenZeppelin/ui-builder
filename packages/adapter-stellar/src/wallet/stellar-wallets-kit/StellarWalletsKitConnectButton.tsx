import { useEffect, useRef } from 'react';

import { logger } from '@openzeppelin/ui-utils';

import { setStellarConnectedAddress } from '../connection';
import { stellarUiKitManager } from './stellarUiKitManager';

/**
 * Creates a Stellar Wallets Kit ConnectButton component.
 * This renders the kit's native button UI which includes built-in connected state,
 * copy address functionality, and disconnect options.
 *
 * @returns A React component that uses Stellar Wallets Kit's native button
 */
export function StellarWalletsKitConnectButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = stellarUiKitManager.getState();
    const kit = state.stellarKitProvider;

    if (!kit || !containerRef.current) {
      logger.error(
        'StellarWalletsKitConnectButton',
        'Kit not initialized or container not available'
      );
      return;
    }

    // Create the native button provided by Stellar Wallets Kit
    kit.createButton({
      container: containerRef.current,
      onConnect: ({ address }) => {
        logger.info('StellarWalletsKitConnectButton', `Connected to address: ${address}`);
        // Inform the adapter's wallet implementation so the context updates
        // This ensures the Execute Transaction button and other components
        // recognize the wallet connection state
        try {
          setStellarConnectedAddress(address ?? null);
        } catch (error) {
          logger.warn(
            'StellarWalletsKitConnectButton',
            'Failed to set connected address in adapter implementation:',
            error
          );
        }
      },
      onDisconnect: () => {
        logger.info('StellarWalletsKitConnectButton', 'Disconnected');
        // Inform the implementation we are no longer connected
        try {
          setStellarConnectedAddress(null);
        } catch (error) {
          logger.warn(
            'StellarWalletsKitConnectButton',
            'Failed to clear connected address in adapter implementation:',
            error
          );
        }
      },
      buttonText: 'Connect Wallet',
    });

    // Cleanup: remove the button when component unmounts
    return () => {
      if (typeof kit.removeButton === 'function') {
        try {
          kit.removeButton();
        } catch (error) {
          logger.warn('StellarWalletsKitConnectButton', 'Error removing button:', error);
        }
      } else {
        logger.warn(
          'StellarWalletsKitConnectButton',
          'removeButton method not available on kit instance'
        );
      }
    };
  }, []);

  return <div ref={containerRef} className="stellar-native-button" />;
}
