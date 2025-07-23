import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn, logger } from '@openzeppelin/contracts-ui-builder-utils';

import { useWalletState } from '../hooks/WalletStateContext';

interface WalletConnectionUIProps {
  className?: string;
}

/**
 * Component that displays wallet connection UI components
 * provided by the active adapter.
 */
export const WalletConnectionUI: React.FC<WalletConnectionUIProps> = ({ className }) => {
  const [isError, setIsError] = useState(false);
  const { activeAdapter, walletFacadeHooks } = useWalletState();

  // Setup error handling with useEffect
  useEffect(() => {
    const handleError = () => {
      setIsError(true);
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    logger.debug('WalletConnectionUI', '[Debug] State from useWalletState:', {
      adapterId: activeAdapter?.networkConfig.id,
      hasFacadeHooks: !!walletFacadeHooks,
    });
  }, [activeAdapter, walletFacadeHooks]);

  // Memoize wallet components to avoid repeated calls on every render
  const walletComponents = useMemo(() => {
    // Get wallet components from adapter if available
    if (!activeAdapter || typeof activeAdapter.getEcosystemWalletComponents !== 'function') {
      logger.debug(
        'WalletConnectionUI',
        '[Debug] No activeAdapter or getEcosystemWalletComponents method, returning null.'
      );
      return null;
    }

    try {
      const components = activeAdapter.getEcosystemWalletComponents();
      logger.debug('WalletConnectionUI', '[Debug] walletComponents from adapter:', components);
      return components;
    } catch (error) {
      logger.error('WalletConnectionUI', '[Debug] Error getting wallet components:', error);
      setIsError(true);
      return null;
    }
  }, [activeAdapter]); // Only re-compute when activeAdapter changes

  if (!walletComponents) {
    logger.debug(
      'WalletConnectionUI',
      '[Debug] getEcosystemWalletComponents returned null/undefined, rendering null.'
    );
    return null;
  }

  // Log available components for debugging
  logger.debug('WalletConnectionUI', 'Rendering wallet components:', {
    hasConnectButton: !!walletComponents.ConnectButton,
    hasAccountDisplay: !!walletComponents.AccountDisplay,
    hasNetworkSwitcher: !!walletComponents.NetworkSwitcher,
  });

  const { ConnectButton, AccountDisplay, NetworkSwitcher } = walletComponents;

  // If there was an error, show an error button
  if (isError) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>
          Wallet Error - Retry
        </Button>
      </div>
    );
  }

  // Ensure walletComponents is not null before destructuring
  if (!walletComponents) {
    // This case should ideally be caught above, but as a safeguard:
    logger.debug(
      'WalletConnectionUI',
      '[Debug] walletComponents is null before rendering, rendering null.'
    );
    return null;
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Display network switcher if available - moved before account to match typical wallet UI flow */}
      {NetworkSwitcher && <NetworkSwitcher />}

      {/* Display account info if available */}
      {AccountDisplay && <AccountDisplay />}

      {/* Display connect button if available */}
      {ConnectButton && <ConnectButton />}
    </div>
  );
};
