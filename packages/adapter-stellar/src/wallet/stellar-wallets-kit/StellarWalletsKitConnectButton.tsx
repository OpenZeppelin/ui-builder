import { useEffect, useRef } from 'react';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
      },
      onDisconnect: () => {
        logger.info('StellarWalletsKitConnectButton', 'Disconnected');
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
